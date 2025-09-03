const User = require('../modules/User');
const Role = require('../modules/Role');
const Token = require('../modules/Token');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const generator = require('generate-password');
const path = require('path');
const fs = require('fs').promises; // Використовуємо async/await версію fs

const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { hash_password, jwt_access_secret, jwt_refresh_secret, smtp_host, smtp_port, smtp_user, smtp_password} = require('../config')

const uploadDir = path.join(__dirname, '..', '..', 'uploads');

const generateAccessAndRefreshToken = (id, firstName, lastName, email, isActivated, gender, phone, role, dateOfBirth, city, address, zipCode, bio, position, hireDate, employmentType, status, emergencyContact, profilePicture) => {
    const payload = {
        id,
        firstName,
        lastName,
        email,
        isActivated,
        gender,
        phone,
        role,
        dateOfBirth,
        city,
        address,
        zipCode,
        bio,
        position,
        hireDate,
        employmentType,
        status,
        emergencyContact,
        profilePicture
    }
    const accessToken = jwt.sign(payload, jwt_access_secret, { expiresIn: '1d' })
    const refreshToken = jwt.sign(payload, jwt_refresh_secret, { expiresIn: '7d' })
    return {
        accessToken,
        refreshToken
    }
}

class authController {
    async rigistration(req, res) {
        try {
            // Перевірка на помилки валідації
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                // Якщо є помилки, видаляємо завантажений файл, якщо він існує
                if (req.file) {
                    await fs.unlink(req.file.path);
                }
                return res.status(400).json({ message: 'Помилка реєстрації.', errors });
            }
            
            // Перевірка паролів
            const { firstName, lastName, email, password, confirmPassword, gender, phone, role, dateOfBirth, city, address, zipCode, bio, position, hireDate, employmentType, status, emergencyContact } = req.body;
            
            if (password !== confirmPassword) {
                 // Якщо паролі не співпадають, видаляємо завантажений файл, якщо він існує
                if (req.file) {
                    await fs.unlink(req.file.path);
                }
                return res.status(400).json({ message: 'Паролі не співпадають (поле: password і confirmPassword)' });
            }

            // Перевірка, чи існує користувач з таким email
            const condidate = await User.findOne({ email });
            if (condidate) {
                // Якщо користувач вже існує, видаляємо завантажений файл
                if (req.file) {
                    await fs.unlink(req.file.path);
                }
                return res.status(400).json({ message: 'Користувач з таким email уже існує.' });
            }

            // Хешування пароля
            const hashPassword = bcrypt.hashSync(password, hash_password);
            
            // Створення та збереження користувача без профільного фото
             const user = new User({ firstName, lastName, email, password: hashPassword, gender, phone, role, dateOfBirth, city, address, zipCode, bio, position, hireDate, employmentType, status, emergencyContact });
            await user.save();

            // === ЛОГІКА З ФАЙЛАМИ ===
            // Перевіряємо, чи був завантажений файл
            if (req.file) {
                const oldPath = req.file.path;
                const fileExt = path.extname(req.file.originalname);
                // Нова назва файлу = ID користувача + розширення файлу
                const newFileName = `${user._id}${fileExt}`;
                const newPath = path.join(uploadDir, newFileName);

                try {
                    // Перейменовуємо файл на нове, унікальне ім'я
                    await fs.rename(oldPath, newPath);
                    
                    // Зберігаємо шлях до фото у базі даних
                    user.profilePicture = `/uploads/${newFileName}`;
                    await user.save();
                } catch (renameError) {
                    // Обробка помилки перейменування файлу
                    console.error('Помилка при перейменуванні файлу:', renameError);
                    // Можна залишити користувача без фото або видалити його
                    // await User.findByIdAndDelete(user._id);
                    // return res.status(500).json({ message: 'Registration failed due to file error.' });
                }
            } else {
                // Якщо файл не завантажено, встановлюємо дефолтний аватар
                user.profilePicture = '/uploads/default-avatar.png'; // Переконайтеся, що такий файл існує
                await user.save();
            }
            // === КІНЕЦЬ ЛОГІКИ З ФАЙЛАМИ ===

            // Відправлення листа для активації
            const transporter = nodemailer.createTransport({
                host: smtp_host,
                port: smtp_port,
                service: 'gmail',
                secure: false,
                auth: {
                    user: smtp_user,
                    pass: smtp_password
                },
                tls: {
                    rejectUnauthorized: false,
                },
            });

            const activationLink = `http://194.44.149.125:1114/api/user/activate/${user._id}`;
            const mailOptions = {
                to: email,
                from: smtp_user,
                subject: 'Активуйте свій обліковий запис',
                text: `Дякуємо за реєстрацію на нашому веб-сайті. Будь ласка активуйте свій обліковий запис, перейшовши за посиланням \n\n ${activationLink}\n\nЯкщо ви не реєструвалися на нашому веб-сайті, проігноруйте цей лист.`,
            };

            transporter.sendMail(mailOptions, (err) => {
                if (err) {
                    console.log(err);
                    return res.status(500).json({ message: 'Не вдалося надіслати лист для активації.' });
                }
                return res.json({ message: 'Лист для активації надіслано на вашу електронну адрусу.' });
            });

        } catch (error) {
           console.log(error);
           res.status(500).json({ message: 'Registration error.' });
        }
    }

    async activate (req, res){
        try {
          const { userId } = req.params 
          const user = await User.findById(userId)
          if(!user || user.isActivated){
            return res.status(400).json({message: 'Невірний ID користувача або обліковий запис вже активований'})
          }
          user.isActivated = true
          await user.save()

            return res.json({message: 'Обліковий запис активовано. Тепер ви можете увійти.'})
        } catch (error) {
           console.log(error);
           res.status(500).json({message:'Помилка сервера.'})
        }
    }

    async login (req, res){
        try {
            const {email, password} = req.body
            // find user
            const user = await User.findOne({email})
            if(!user){
                return res.status(400).json({message: `Користувача з таким email: ${email} не існує.`})
            }

            if(!user.isActivated){
              return res.status(400).json({message: `Користувача не активований, спочатку активуйте вашого акаунта.`})
            }

            // check password
            const validPassword = bcrypt.compareSync(password, user.password)
            if(!validPassword){
                return res.status(400).json({message: 'Невірний пароль'})
            }
            // create jwt
            const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id, user.firstName, user.lastName, user.email, user.isActivated, user.gender, user.phone, user.role, user.dateOfBirth, user.city, user.address, user.zipCode, user.bio, user.position, user.hireDate, user.employmentType, user.status, user.emergencyContact, user.profilePicture)
            let refresh = await Token.findOne({user: user._id})
            if (!refresh) {
              refresh = new Token({user: user._id, refreshToken})
            } else{
              refresh.refreshToken = refreshToken
            }
            await refresh.save()
            return res.json({accessToken, refreshToken})
        } catch (error) {
            console.log(error); 
            return res.status(400).json({message:'Login error.'})
        }
    }

    // async getUsers (req, res){
    //     try {
    //       const users = new Role()
    //       const users2 = new Role({value: 'ADMIN'})
    //       const users3 = new Role({value: 'DEV'})
    //       await users.save()
    //       await users2.save()
    //       await users3.save()
    //     } catch (error) {
    //       console.log(error); 
    //     }
    //   }
    async getUsers (req, res){
        try {
          const users = await User.find()
          res.json(users)
        } catch (error) {
          console.log(error); 
        }
      }

    async deleteUser(req, res) {
        try {
            const { id } = req.params;
            const user = await User.findById(id);
            if (!user) {
                return res.status(404).json({ message: 'Користувач не знайдений.' });
            }
            if (user.profilePicture) {
                const uploadDir = path.join(__dirname, '..', '..', 'uploads');
                const filePath = path.join(uploadDir, user.profilePicture.replace('/uploads/', ''));
                try {
                    await fs.unlink(filePath);
                    console.log(`Файл ${filePath} успішно видалено.`);
                } catch (err) {
                    console.error(`Помилка при видаленні файлу ${filePath}:`, err);
                }
            }
            await User.findByIdAndDelete(id);
            return res.status(200).json({ message: 'Користувач та його фотографія успішно видалені.' });

        } catch (e) {
            console.error(e);
            res.status(500).json({ message: 'Помилка сервера при видаленні користувача.' });
        }
    }

    async RefreshToken(req, res) {
      try {
          const { refreshToken } = req.body; 
          const existiogToken = await Token.findOne({refreshToken})
          if (!existiogToken) {
              return res.status(401).json({message: 'Невірний або недійсний рефреш токен.'})
          }

          const decodedPayload = jwt.verify(refreshToken, jwt_refresh_secret)

          const {accessToken, refreshToken: newRefreshToken} = generateAccessAndRefreshToken(
                decodedPayload.id,
                decodedPayload.firstName,
                decodedPayload.lastName,
                decodedPayload.email,
                decodedPayload.isActivated,
                decodedPayload.gender,
                decodedPayload.phone,
                decodedPayload.role,
                decodedPayload.dateOfBirth,
                decodedPayload.city,
                decodedPayload.address,
                decodedPayload.zipCode,
                decodedPayload.bio,
                decodedPayload.position,
                decodedPayload.hireDate,
                decodedPayload.employmentType,
                decodedPayload.status,
                decodedPayload.emergencyContact,
                decodedPayload.profilePicture
            )

          
          existiogToken.refreshToken = newRefreshToken
          await existiogToken.save()

          return res.json({ accessToken, refreshToken: newRefreshToken });
      } catch (error) {
          console.error(error);
          return res.status(400).json({ message: 'Update token error' });
      }
    }

    async logout(req, res) {
      try {
          const { userId } = req.params; 

          const token = await Token.findOneAndDelete({user: userId})
          if(!token){
            return res.status(400).json({message: 'Користувача не знайдено з таким id.'})
          }

          return res.json({message: 'Ви вийшли з системи.'});
      } catch (error) {
          console.error(error);
          return res.status(400).json({ message: 'Logout error' });
      }
    }

    async changePassword(req, res) {
      try {
          const { userId, currentPassword, newPassword, confirmNewPassword } = req.body; 

          const user = await User.findById(userId)
          if(!user){
            return res.status(400).json({message: 'Користувача не знайдено.'})
          }

          const validPassword = bcrypt.compareSync(currentPassword, user.password)
          if (!validPassword) {
            return res.status(400).json({message: 'Невірний поточний пароль.'})
          }

          const newHashedPassword = bcrypt.hashSync(newPassword, hash_password)

          user.password = newHashedPassword
          await user.save()

          return res.json({message: 'Пароль змінено успішно.'});
      } catch (error) {
          console.error(error);
          return res.status(400).json({ message: 'Change password error' });
      }
    }

    async updateProfile(req, res) {
      try {
            const { id, firstName, lastName, email, gender, phone, bio, position, hireDate, employmentType, status, emergencyContact } = req.body; 
            
            const user = await User.findById(id)
            if(!user){
              return res.status(400).json({message: 'Користувача не знайдено.'})
            }
            
            user.firstName = firstName
            user.lastName = lastName
            user.email = email
            user.gender = gender
            user.phone = phone
            user.bio = bio;
            user.position = position;
            user.hireDate = hireDate;
            user.employmentType = employmentType;
            user.status = status;
            user.emergencyContact = emergencyContact;
            
            await user.save()

            return res.json({message: 'Користовач змінено успішно.'});
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: 'Edit profile error' });
        }
    }

    async forgotPassword(req, res) {
      try {
          const { email } = req.body

          const user = await User.findOne({email})
          if(!user){
            return res.status(400).json({message: 'Користувача з таким емейлом не знайдено.'})
          }

          const newPassword = generator.generate({
            length: 10,
            numbers: true,
            symbols: true
          })

          const hashPassword = bcrypt.hashSync(newPassword, hash_password)
          
          user.password = hashPassword
          await user.save()

          const transporter = nodemailer.createTransport({
            host: smtp_host,
            port: smtp_port,
            service: 'gmail',
            secure: false,
            auth: {
              user: smtp_user,
              pass: smtp_password,
            },
            tls: {
              rejectUnauthorized: false,
            },
          })

          const mailOptions = {
            to: email,
            from: smtp_user,
            subject: 'Відновлення пароля.',
            text: '',
            html:
            `
          <h3 style='font-size: 28px;'>Ваш новий пароль:</h3>
          <h1 style='
          text-align: center;
          padding: 10px;
          background-color: silver;
          border-radius: 12px;
          border: 3px solid black;
          width: 170px;
          '>${newPassword}</h1>
          <h4 style='font-size: 22px; color: red;'>Рекомендуємо після того як ви ввійдете у ваш акаунт, замінити пароль!</h4>
            `
          }

          transporter.sendMail(mailOptions, (error) => {
            if(error){
              return res.status(500).json({message: 'Не вдалося відправити новий пароль на емейл.'})
            }
            return res.json({message: 'Новий пароль відправлено на ваш емейл.'})
          })
      } catch (error) {
          console.error(error);
          return res.status(500).json({ message: 'Помилка відновлення пароля' });
      }
    }

}

    module.exports = new authController()



    // const userRole = new Role()
    // const adminRole = new Role({value: 'ADMINISTRATOR'})
    // await userRole.save()
    // await adminRole.save()
