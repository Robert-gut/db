const Router = require('express')
const router = new Router()
const controller = require('./authController')
const {check} = require('express-validator')


router.post('/registration',
[
    check('username', `Ім'я користувача не може бути порожнім.`).notEmpty(),
    check('password', 'Пароль може мати мінімум 8 символів і максимум 16 символів.').isLength({min:8, max:16})
] 
,controller.rigistration)
router.post('/login', controller.login)
router.get('/users', controller.getUsers)

module.exports = router