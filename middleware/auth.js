function requireLogin(req, res, next) {
  if (req.session && req.session.userId) return next();
  return res.redirect('/login');
}

function injectUser(req, res, next) {
  res.locals.currentUser = req.session && req.session.username ? { username: req.session.username, role: req.session.role } : null;
  res.locals.flash = req.session.flash || null;
  if (req.session.flash) delete req.session.flash;
  res.locals.tuviBaseUrl = (process.env.TUVI_BASE_URL || '').replace(/\/+$/, '');
  next();
}

module.exports = { requireLogin, injectUser };
