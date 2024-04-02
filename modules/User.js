const { Schema, model } = require('mongoose');

const User = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  isActivated: { type: Boolean, default: false },
  password: { type: String, required: true },
  gender: { type: String, required: true },
  phone: { type: String, required: true },
  role: { type: String, ref: 'Role' },
  dateOfBirth: { type: Date },
  city: { type: String },
  address: { type: String },
  zipCode: { type: String },
});

module.exports = model('User', User);
