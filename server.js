require('dotenv').config();
const path = require('path');
const express = require('express');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const methodOverride = require('method-override');

const { connect } = require('./config/db');
const User = require('./models/User');
const { requireLogin, injectUser } = require('./middleware/auth');

const authRoutes = require('./routes/auth');
const lasoRoutes = require('./routes/laso');
const articlesRoutes = require('./routes/articles');

async function seedAdmin() {
  const username = (process.env.ADMIN_USERNAME || 'admin').toLowerCase();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'Tuvi@2025';
  const existing = await User.findOne({ username });
  if (!existing) {
    const passwordHash = await User.hashPassword(password);
    await User.create({ username, passwordHash, role: 'admin' });
    console.log(`[seed] Admin user "${username}" created with default password.`);
  } else {
    console.log(`[seed] Admin user "${username}" already exists.`);
  }
}

async function main() {
  await connect();
  await seedAdmin();

  const app = express();
  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, 'views'));
  app.use(express.urlencoded({ extended: true, limit: '5mb' }));
  app.use(express.json({ limit: '5mb' }));
  app.use(methodOverride('_method'));
  app.use(express.static(path.join(__dirname, 'public')));

  app.use(
    session({
      secret: process.env.SESSION_SECRET || 'please-change-me',
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URI,
        dbName: 'tuvi',
        collectionName: 'cms_sessions',
        ttl: 7 * 24 * 60 * 60,
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: false,
        maxAge: 7 * 24 * 60 * 60 * 1000,
      },
    })
  );

  app.use(injectUser);

  app.use('/', authRoutes);

  app.get('/', requireLogin, (req, res) => res.redirect('/laso'));

  app.use('/laso', requireLogin, lasoRoutes);
  app.use('/articles', requireLogin, articlesRoutes);

  app.use((req, res) => res.status(404).render('404'));

  app.use((err, req, res, next) => {
    console.error('[error]', err);
    res.status(500).render('error', { message: err.message });
  });

  const port = parseInt(process.env.PORT, 10) || 4000;
  app.listen(port, () => console.log(`[server] CMS listening on http://localhost:${port}`));
}

main().catch((e) => {
  console.error('Fatal:', e);
  process.exit(1);
});
