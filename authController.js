const User = require('./modules/User')
const Role = require('./modules/Role')
const Token = require('./modules/Token')
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer')
const generator = require('generate-password')

const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { hash_password, jwt_access_secret, jwt_refresh_secret, smtp_host, smtp_port, smtp_user, smtp_password} = require('./config')


const generateAccessAndRefreshToken = (id, firstName, lastName, email, isActivated, gender, phone, role, dateOfBirth, city, address, zipCode) =>{
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
    }
    const accessToken = jwt.sign(payload, jwt_access_secret, { expiresIn: '30m' })
    const refreshToken = jwt.sign(payload, jwt_refresh_secret, { expiresIn: '3d' })
    return {
        accessToken,
        refreshToken
    }
}

class authController {
    async rigistration (req, res){
        try {
            // valid
            const errors = validationResult(req)
            if(!errors.isEmpty()){
                return res.status(400).json({message: 'Помилка реєстрації.', errors})
            }
            // condidate
            const {firstName, lastName, email, password, confirmPassword, gender, phone, role, dateOfBirth, city, address, zipCode} = req.body
            const condidate = await User.findOne({email})
            if(condidate){
                return res.status(400).json({message: 'Користувач з таким email уже існує.'})
            }
            // check password and confirmPassword
            if(password !== confirmPassword){
              return res.status(400).json({message: 'Паролі не співпадають(поле:password і confirmPassword)'})
            }
            // hashPassword
            const hashPassword = bcrypt.hashSync(password, hash_password);
            // const userRole = await Role.findOne({value: 'USER'})
            // save user
            const user = new User({firstName, lastName, email, password: hashPassword, gender, phone, role, dateOfBirth, city, address, zipCode})
            await user.save()

            //відправлення листів на активацію
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
            })

            const activationLink = `http://35.180.116.219:80/api/User/activate/${user._id}`

            const mailOptions = {
              to: email,
              from: smtp_user,
              subject: 'Активуйте свій обліковий запис',
              text: `Дякуємо за реєстрацію на нашому веб-сайті. Будь ласка активуйте свій обліковий запис, перейшовши за посиланням \n\n ${activationLink}\n\nЯкщо ви не реєструвалися на нашому веб-сайті, проігноруйте цей лист.`,
            }

            transporter.sendMail(mailOptions, (err)=>{
              if(err){
                console.log(err)
                return res.status(500).json({message: 'Не вдалося надіслати лист для активації.'})
              }
              return res.json({message: 'Лист для активації надіслано на вашу електронну адрусу.'})
            })

            // return res.json({message: 'Користувач успішно зареєстрований.'})
        } catch (error) {
           console.log(error);
           res.status(400).json({message:'Registaration error.'})
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
            const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id, user.firstName, user.lastName, user.email, user.isActivated, user.gender, user.phone, user.role, user.dateOfBirth, user.city, user.address, user.zipCode)
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
            const deletedUser = await User.findByIdAndDelete(id);
            if (!deletedUser) {
                return res.status(400).json({ message: 'Користувача не знайдено' });
            }
            
            return res.json({ message: 'Користувача успішно видалено', deletedUser });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: 'Delete user error' });
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

            const {accessToken, refreshToken: newRefreshToken} =  generateAccessAndRefreshToken(
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
            const { id, firstName, lastName, email, sex, phone} = req.body; 
            
            const user = await User.findById(id)
            if(!user){
              return res.status(400).json({message: 'Користувача не знайдено.'})
            }
            // console.logu(serId, firstName, lastName, email, phone);

            user.firstName = firstName
            user.lastName = lastName
            user.email = email
            user.sex = sex
            user.phone = phone
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
