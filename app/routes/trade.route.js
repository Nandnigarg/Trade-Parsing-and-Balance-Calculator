const express = require('express');
const router = express.Router();
const Trade = require('../models/trade.model');

router.get('/trades', async (req, res) => {
  try {
    const trades = await Trade.find().exec();
    res.json(trades);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching trades' });
  }
});

router.post('/trades', async (req, res) => {
  try {
    const trade = new Trade(req.body);
    await trade.save();
    res.json(trade);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error creating trade' });
  }
});

module.exports = router;