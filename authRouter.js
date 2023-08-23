const Router = require('express')
const router = new Router()
const controller = require('./authController')
const {check} = require('express-validator')


router.post('/registration',
[
    check('firstName', `Ім'я користувача не може бути порожнім.`).notEmpty(),
    check('lastName', `Прізвище користувача не може бути порожнім.`).notEmpty(),
    check('email', `Поле email не може бути порожнім.`).notEmpty(),
    check('sex', `Поле стать не може бути порожнім.`).notEmpty(),
    check('phone', `Поле телефон не може бути порожнім.`).notEmpty(),
    check('password', 'Пароль може мати мінімум 8 символів і максимум 16 символів.').isLength({min:8, max:16})
] 
,controller.rigistration)
router.post('/login', controller.login)
router.get('/users', controller.getUsers)

module.exports = router