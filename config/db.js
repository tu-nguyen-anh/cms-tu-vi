const mongoose = require('mongoose');

async function connect() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI is not set');
  await mongoose.connect(uri, { dbName: 'tuvi' });
  console.log('[db] Connected to MongoDB (db=tuvi)');
}

module.exports = { connect };
