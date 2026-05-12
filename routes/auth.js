const express = require('express');
const User = require('../models/User');

const router = express.Router();

router.get('/login', (req, res) => {
  if (req.session && req.session.userId) return res.redirect('/');
  res.render('login', { error: null });
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).render('login', { error: 'Vui lòng nhập đầy đủ tài khoản và mật khẩu.' });
  }
  const user = await User.findOne({ username: String(username).toLowerCase().trim() });
  if (!user) {
    return res.status(401).render('login', { error: 'Sai tài khoản hoặc mật khẩu.' });
  }
  const ok = await user.verifyPassword(password);
  if (!ok) {
    return res.status(401).render('login', { error: 'Sai tài khoản hoặc mật khẩu.' });
  }
  req.session.userId = user._id.toString();
  req.session.username = user.username;
  req.session.role = user.role;
  req.session.flash = { type: 'success', text: 'Đăng nhập thành công.' };
  res.redirect('/');
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

router.get('/change-password', (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  res.render('change-password', { error: null, success: null });
});

router.post('/change-password', async (req, res) => {
  if (!req.session.userId) return res.redirect('/login');
  const { currentPassword, newPassword, confirmPassword } = req.body;
  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).render('change-password', { error: 'Vui lòng nhập đầy đủ.', success: null });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).render('change-password', { error: 'Mật khẩu xác nhận không khớp.', success: null });
  }
  if (newPassword.length < 8) {
    return res.status(400).render('change-password', { error: 'Mật khẩu mới phải có tối thiểu 8 ký tự.', success: null });
  }
  const user = await User.findById(req.session.userId);
  if (!user) return res.redirect('/login');
  const ok = await user.verifyPassword(currentPassword);
  if (!ok) {
    return res.status(401).render('change-password', { error: 'Mật khẩu hiện tại không đúng.', success: null });
  }
  user.passwordHash = await User.hashPassword(newPassword);
  await user.save();
  res.render('change-password', { error: null, success: 'Đã đổi mật khẩu thành công.' });
});

module.exports = router;
