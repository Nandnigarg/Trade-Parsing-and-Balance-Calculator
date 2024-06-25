// models/trade.model.js

const mongoose = require('mongoose');

const tradeSchema = new mongoose.Schema({
    UTC_Time: {
        type: Date,
        required: true
    },
    Operation: {
        type: String,
        enum: ['buy', 'sell'],
        required: true
    },
    Market: {
        type: String,
        required: true
    },
    baseCoin: {
        type: String,
        required: true
    },
    quoteCoin: {
        type: String,
        required: true
    },
    Amount: {
        type: Number,
        required: true
    },
    Price: {
        type: Number,
        required: true
    }
});

module.exports = mongoose.model('Trade', tradeSchema);


//mongoose.connect('mongodb+srv://Nandni:nandu6239@cluster0.ok9o9jh.mongodb.net/Calculator-DB?retryWrites=true&w=majority'