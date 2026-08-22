const mongoose = require('mongoose');

async function connectDB(uri) {
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri || process.env.MONGO_URI);
  return mongoose.connection;
}

module.exports = { connectDB };
