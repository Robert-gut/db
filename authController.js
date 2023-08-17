const User = require('./modules/User')
const Role = require('./modules/Role')

const bcrypt = require('bcrypt');

class authController {
    async rigistration (req, res){
        try {
            const {username, password} = req.body
            const condidate = await User.findOne({username})
            if(condidate){
                return res.status(400).json({message: 'Користувач з таким іменем уже існує'})
            }
            const hashPassword = bcrypt.hashSync(password, 8);
            const userRole = await Role.findOne({value: 'ADMINISTRATOR'})
            const user = new User({username, password: hashPassword, roles: [userRole.value]})
            await user.save()
            return res.json({message: 'Користувач успішно зареєстрований'})
        } catch (error) {
           console.log(error);
           res.status(400).json({message:'Refistaration error'})
        }
    }

    async login (req, res){
        try {
            
        } catch (error) {
            console.log(error); 
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