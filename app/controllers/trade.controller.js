const Trade = require('../models/trade.model');

exports.createTrade = async (req, res) => {
  try {
    const trade = new Trade(req.body);
    await trade.save();
    res.status(201).send(trade);
  } catch (err) {
    res.status(400).send(err);
  }
};

exports.getTrades = async (req, res) => {
  try {
    const trades = await Trade.find().sort({ date: -1 });
    res.send(trades);
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.getTrade = async (req, res) => {
  try {
    const trade = await Trade.findById(req.params.id);
    if (!trade) {
      res.status(404).send({ message: 'Trade not found' });
    } else {
      res.send(trade);
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.updateTrade = async (req, res) => {
  try {
    const trade = await Trade.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!trade) {
      res.status(404).send({ message: 'Trade not found' });
    } else {
      res.send(trade);
    }
  } catch (err) {
    res.status(500).send(err);
  }
};

exports.deleteTrade = async (req, res) => {
  try {
    await Trade.findByIdAndRemove(req.params.id);
    res.send({ message: 'Trade deleted successfully' });
  } catch (err) {
    res.status(500).send(err);
  }
};