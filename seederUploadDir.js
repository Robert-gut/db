const fs = require('fs');
const path = require('path');

// Шлях до папки, яку потрібно створити.
// __dirname - це поточна директорія, де знаходиться seed.js
// path.join(__dirname, '..', 'uploads') - це шлях до папки uploads,
// що знаходиться на один рівень вище за поточну директорію проекту.
const uploadDir = path.join(__dirname, '..', 'uploads');

// Перевіряємо, чи існує папка
if (!fs.existsSync(uploadDir)) {
    try {
        // Якщо папки немає, створюємо її
        fs.mkdirSync(uploadDir);
        console.log('Папка "uploads" успішно створена поруч з проектом.');
    } catch (err) {
        console.error('Помилка при створенні папки:', err);
    }
} else {
    console.log('Папка "uploads" вже існує.');
}