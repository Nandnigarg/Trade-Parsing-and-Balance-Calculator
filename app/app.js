const express = require('express');
const app = express();
const models = require('./models'); 
const tradesRoute = require('./routes/trade.route');

app.use(express.json());
app.use('/api', tradesRoute);

app.listen(3000, () => {
  console.log('Server started on port 3000');
});