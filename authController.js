const User = require('./modules/User')
const Role = require('./modules/Role')
const bcrypt = require('bcrypt');

const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { secret } = require('./config')


const generateAccessToken = (id, username, roles) =>{
    const payload = {
        id,
        username,
        roles
    }
    return jwt.sign(payload, secret, { expiresIn: '1h' })
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
            // hashPassword
            const hashPassword = bcrypt.hashSync(password, 8);
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
            const {username, password} = req.body
            // find user
            const user = await User.findOne({username})
            if(!user){
                return res.status(400).json({message: `Користувача ${username} не існує.`})
            }
            // check password
            const validPassword = bcrypt.compareSync(password, user.password)
            if(!validPassword){
                return res.status(400).json({message: 'Невірний пароль'})
            }
            // create jwt
            const token = generateAccessToken(user._id, user.username, user.roles)
            console.log(token);
            return res.json({token})

        } catch (error) {
            console.log(error); 
            return res.status(400).json({message:'Login error.'})
        }
    }

    async getUsers (req, res){
        try {
            // const userRole = new Role()
            // const adminRole = new Role({value: 'ADMINISTRATOR'})
            // await userRole.save()
            // await adminRole.save()

            res.json('server work')
        } catch (error) {
            console.log(error); 
        }
    }
}

module.exports = new authController()