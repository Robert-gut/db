const mongoose = require('mongoose')
const User = require('./modules/User')
const bcrypt = require('bcrypt');
const { url_db, hash_password } = require('./config')

mongoose.connect(url_db)
const db = mongoose.connection

db.on('error', console.error.bind(console, 'Помилка підключення до бази даних:'))

db.once('open', async () => {
  try {
    const hashPassword = bcrypt.hashSync('qwerty-1', hash_password)

    const user = new User({
      firstName: 'ADMIN',
      lastName: 'ADMIN',
      email: 'ADMIN@ADMIN.COM',
      password: hashPassword,
      gender: 'ADMIN', // 'gender' changed to 'gender' to match schema
      phone: '999999999999',
      role: 'ADMINISTRATOR',
      isActivated: true,
      dateOfBirth: new Date('1980-01-01'), // Set DOB as an example
      city: 'Kyiv', // Set city as an example
      address: '123 Main Street', // Set address as an example
      zipCode: '01001', // Set zip code as an example
    })

    await user.save()
    console.log('Користувач створений успішно.');
  } catch (error) {
    console.log('Помилка створення користувача', error);
  } finally {
    db.close()
  }
})