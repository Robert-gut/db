const { Schema, model } = require('mongoose');

const User = new Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  email: { type: String, unique: true, required: true },
  password: { type: String, required: true },
  isActivated: { type: Boolean, default: false },
  gender: { type: String, required: true, enum: ['male', 'female'] },
  dateOfBirth: { type: Date },
  bio: { type: String, maxLength: 500 },
  position: { type: String, required: true },
  hireDate: { type: Date, required: true },
  phone: { type: String, required: true },
  role: { type: String, ref: 'Role' },
  employmentType: { type: String, enum: ['full-time', 'part-time', 'contract'], default: 'full-time' },
  status: { type: String, enum: ['active', 'on-leave', 'terminated'], default: 'active' },
  city: { type: String },
  address: { type: String },
  zipCode: { type: String },
  emergencyContact: {
      name: { type: String },
      relationship: { type: String },
      phone: { type: String },
    },
  profilePicture: {
    type: String,
    default: '/uploads/default-avatar.png' 
  }
});

module.exports = model('User', User);
