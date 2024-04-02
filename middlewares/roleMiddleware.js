const jwt = require('jsonwebtoken')
const { jwt_access_secret } = require('../config')

module.exports = function (roleTest) {
  return function (req, res, next) {
    if (req.method === 'OPTIONS') {
      next();
    }
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (!token) {
        return res.status(401).json({ message: 'Користувач не авторизований!' });
      }

      // Декодуємо токен
      const { role } = jwt.verify(token, jwt_access_secret);
      
      // Перевіряємо, чи має користувач необхідну роль
      if (role !== roleTest) {
        return res.status(403).json({ message: 'У вас немає доступу.' });
      }

      next();
    } catch (error) {
      console.log(error);
      return res.status(401).json({ message: 'Користувач не авторизований!' });
    }
  };
};
