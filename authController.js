const User = require('./modules/User')
const Role = require('./modules/Role')
const bcrypt = require('bcrypt');

const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const { secret } = require('./config')


const generateAccessToken = (id, firstName, lastName, email, sex, phone, roles) =>{
    const payload = {
        id,
        firstName,
        lastName,
        email,
        sex,
        phone,
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
            // check password and confirmPassword
            if(password !== confirmPassword){
              return res.status(400).json({message: 'Паролі не співпадають(поле:password і confirmPassword)'})
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
            const token = generateAccessToken(user._id, user.firstName, user.lastName, user.email , user.sex, user.phone, user.roles)
            console.log(token);
            return res.json({token})

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
            console.log(deletedUser);
            if (!deletedUser) {
                return res.status(400).json({ message: 'Користувача не знайдено' });
            }
            
            return res.json({ message: 'Користувача успішно видалено', deletedUser });
        } catch (error) {
            console.error(error);
            return res.status(400).json({ message: 'Delete user error' });
        }
      }
    }

    
    
    module.exports = new authController()



    // const userRole = new Role()
    // const adminRole = new Role({value: 'ADMINISTRATOR'})
    // await userRole.save()
    // await adminRole.save()