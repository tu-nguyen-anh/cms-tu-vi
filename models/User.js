const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ['admin', 'editor'], default: 'admin' },
  },
  { timestamps: true, collection: 'cms_users' }
);

UserSchema.methods.verifyPassword = function (plain) {
  return bcrypt.compare(plain, this.passwordHash);
};

UserSchema.statics.hashPassword = function (plain) {
  return bcrypt.hash(plain, 12);
};

module.exports = mongoose.model('User', UserSchema);
