const News = require('../modules/News');
const { validationResult } = require('express-validator');

class NewsController {
    /**
     * @route   POST /api/news
     * @desc    Створює нову новину.
     * @access  Приватний (тільки для ADMINISTATOR)
     */
    async createNews(req, res) {
        try {
            // Перевірка на помилки валідації, визначені в роуті
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ message: 'Помилка валідації', errors });
            }

            const { title, body, author } = req.body;
            
            const newNews = new News({
                title,
                body,
                author,
                date: new Date()
            });

            await newNews.save();
            
            res.status(201).json({ message: 'Новину успішно створено!', news: newNews });

        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Помилка сервера при створенні новини.' });
        }
    }

    /**
     * @route   GET /api/news
     * @desc    Отримує список усіх новин.
     * @access  Публічний
     */
    async getAllNews(req, res) {
        try {
            const news = await News.find().sort({ date: -1 }); // Сортуємо від найновіших до найстаріших
            res.status(200).json(news);
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Помилка сервера при отриманні новин.' });
        }
    }

    /**
     * @route   PUT /api/news/:id
     * @desc    Оновлює існуючу новину за ID.
     * @access  Приватний (тільки для ADMINISTATOR)
     */
    async updateNews(req, res) {
        try {
            const { id } = req.params;
            const updatedData = req.body;

            const news = await News.findByIdAndUpdate(id, updatedData, { new: true });
            
            if (!news) {
                return res.status(404).json({ message: 'Новина не знайдена.' });
            }

            res.status(200).json({ message: 'Новину успішно оновлено!', news });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Помилка сервера при оновленні новини.' });
        }
    }

    /**
     * @route   DELETE /api/news/:id
     * @desc    Видаляє новину за ID.
     * @access  Приватний (тільки для ADMINISTATOR)
     */
    async deleteNews(req, res) {
        try {
            const { id } = req.params;
            
            const news = await News.findByIdAndDelete(id);

            if (!news) {
                return res.status(404).json({ message: 'Новина не знайдена.' });
            }

            res.status(200).json({ message: 'Новину успішно видалено.' });
        } catch (error) {
            console.error(error);
            res.status(500).json({ message: 'Помилка сервера при видаленні новини.' });
        }
    }
}

module.exports = new NewsController();