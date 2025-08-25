const Router = require('express');
const router = new Router();
const { check } = require('express-validator');
const controller = require('./newsController');
const authMiddleware = require('../middlewares/authMiddleware'); // Припустимо, що це шлях до вашого міделвару
const roleMiddleware = require('../middlewares/roleMiddleware'); // Припустимо, що це шлях до вашого міделвару


// Маршрут для отримання всіх новин. Доступний для всіх користувачів.
router.get('/', authMiddleware, controller.getAllNews);

// Маршрут для створення новини. Доступний тільки для ADMINISTRATOR.
router.post(
    '/',
    [
        // Валідація вхідних даних
        check('title', 'Заголовок новини не може бути порожнім.').notEmpty(),
        check('body', 'Текст новини не може бути порожнім.').notEmpty(),
        check('author', 'Ім\'я автора не може бути порожнім.').notEmpty()
    ],
    authMiddleware,
    roleMiddleware('ADMINISTRATOR'),
    controller.createNews
);

// Маршрут для оновлення новини за ID. Доступний тільки для ADMINISTRATOR.
router.put(
    '/:id',
    authMiddleware,
    roleMiddleware('ADMINISTRATOR'),
    controller.updateNews
);

// Маршрут для видалення новини за ID. Доступний тільки для ADMINISTRATOR.
router.delete(
    '/:id',
    authMiddleware,
    roleMiddleware('ADMINISTRATOR'),
    controller.deleteNews
);

module.exports = router;