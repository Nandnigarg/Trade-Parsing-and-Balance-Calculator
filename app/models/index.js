const mongoose = require('mongoose');

mongoose.connect('mongodb+srv://Nandni:nandu6239@cluster0.ok9o9jh.mongodb.net/Calculator-DB?retryWrites=true&w=majority')

const db = mongoose.connection;

db.on('error', (err) => {
  console.error(err);
});

db.once('open', () => {
  console.log('Connected to MongoDB');
});