const Router = require('express')
const router = new Router()
const controller = require('./authController')
const {check} = require('express-validator')

const authMiddleware = require('./middlewares/authMiddleware')
const roleMiddleware = require('./middlewares/roleMiddleware')

router.post('/register',
[
    check('firstName', `Ім'я користувача не може бути порожнім.`).notEmpty(),
    check('lastName', `Прізвище користувача не може бути порожнім.`).notEmpty(),
    check('email', `Поле email не може бути порожнім.`).notEmpty(),
    check('gender', `Поле стать не може бути порожнім.`).notEmpty(),
    check('role', `Поле role не може бути порожнім.`).notEmpty(),
    check('dateOfBirth', `Поле dateOfBirth не може бути порожнім.`).notEmpty(),
    check('city', `Поле city не може бути порожнім.`).notEmpty(),
    check('address', `Поле address не може бути порожнім.`).notEmpty(),
    check('zipCode', `Поле zipCode не може бути порожнім.`).notEmpty(),
    check('phone', `Поле телефон не може бути порожнім.`).notEmpty(),
    check('password', 'Пароль може мати мінімум 8 символів і максимум 16 символів.').isLength({min:8, max:16})
] 
, authMiddleware, roleMiddleware('ADMINISTRATOR'), controller.rigistration)
router.post('/login', controller.login)
router.get('/getAllUsers', authMiddleware, roleMiddleware('ADMINISTRATOR'), controller.getUsers)
router.delete('/deleteUser/:id', authMiddleware, roleMiddleware('ADMINISTRATOR'), controller.deleteUser)
router.post('/refreshToken', controller.RefreshToken)
router.post('/logout/:userId', controller.logout)
router.post('/changePassword', authMiddleware, controller.changePassword)
router.get('/activate/:userId', controller.activate)
router.post('/forgotPassword', controller.forgotPassword)
router.post('/updateProfile', authMiddleware, controller.updateProfile)


module.exports = router