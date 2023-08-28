const User = require('./modules/User')
const Role = require('./modules/Role')
const Token = require('./modules/Token')
const bcrypt = require('bcrypt');

const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { hash_password, jwt_access_secret, jwt_refresh_secret } = require('./config')


const generateAccessAndRefreshToken = (id, firstName, lastName, email, sex, phone, roles) =>{
    const payload = {
        id,
        firstName,
        lastName,
        email,
        sex,
        phone,
        roles
    }
    const accessToken = jwt.sign(payload, jwt_access_secret, { expiresIn: '1h' })
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
            const {firstName, lastName, email, password, confirmPassword, sex, phone} = req.body
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
            const userRole = await Role.findOne({value: 'USER'})
            // save user
            const user = new User({firstName, lastName, email, password: hashPassword, sex, phone, roles: [userRole.value]})
            await user.save()
            return res.json({message: 'Користувач успішно зареєстрований.'})
        } catch (error) {
           console.log(error);
           res.status(400).json({message:'Registaration error.'})
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
            // check password
            const validPassword = bcrypt.compareSync(password, user.password)
            if(!validPassword){
                return res.status(400).json({message: 'Невірний пароль'})
            }
            // create jwt
            const {accessToken, refreshToken} = generateAccessAndRefreshToken(user._id, user.firstName, user.lastName, user.email , user.sex, user.phone, user.roles)
            const refresh = new Token({user: user._id, refreshToken})
            refresh.save()
            return res.json({accessToken, refreshToken})

        } catch (error) {
            console.log(error); 
            return res.status(400).json({message:'Login error.'})
        }
    }

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
            const { id } = req.params; // Припускаючи, що ідентифікатор користувача передається у параметрі URL
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

      async refresh(req, res) {
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
                decodedPayload.sex,
                decodedPayload.phone,
                decodedPayload.roles
            )

            
            existiogToken.refreshToken = newRefreshToken
            await existiogToken.save()

            return res.json({ accessToken, refreshToken: newRefreshToken });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: 'Update token error' });
        }
      }


    }

    
    
    module.exports = new authController()



    // const userRole = new Role()
    // const adminRole = new Role({value: 'ADMINISTRATOR'})
    // await userRole.save()
    // await adminRole.save()