const express = require('express');
const app = express();
const models = require('./models');
const multer = require('multer');
const csv = require('csv-parser');
const fs = require('fs');
const morgan = require('morgan');

const upload = multer({ dest: './uploads/' });

app.use(express.json());

// Create endpoint to store trade data from CSV file
app.post('/trades', upload.single('file'), (req, res) => {
    const file = req.file;
    const filePath = file.path;
    const csvData = [];

    fs.createReadStream(filePath)
        .pipe(csv())
        .on('data', (data) => {
            csvData.push(data);
        })
        .on('end', () => {
            csvData.forEach((trade) => {
                models.Trade.create(trade, (err, trade) => {
                    if (err) {
                        console.error(err);
                    }
                });
            });
            res.send({ message: 'Trade data stored successfully' });
        });
});

// Create endpoint to retrieve balance
app.get('/balance', (req, res) => {
    models.Trade.aggregate([
        {
            $group: {
                _id: null,
                balance: { $sum: { $toDouble: "$amount" } }
            }
        }
    ]).then(result => {
        const balance = result[0].balance;
        res.send({ balance });
    }).catch(err => {
        res.status(500).send({ message: 'Error retrieving balance' });
    });
});

// Create endpoint to retrieve profit/loss
app.get('/pnl', (req, res) => {
    models.Trade.aggregate([
        {
            $group: {
                _id: null,
                buyAmount: { $sum: { $cond: [{ $eq: ["$type", "buy"] }, { $toDouble: "$amount" }, 0] } },
                sellAmount: { $sum: { $cond: [{ $eq: ["$type", "sell"] }, { $toDouble: "$amount" }, 0] } }
            }
        }
    ]).then(result => {
        const buyAmount = result[0].buyAmount;
        const sellAmount = result[0].sellAmount;
        const pnl = sellAmount - buyAmount;
        res.send({ pnl });
    }).catch(err => {
        res.status(500).send({ message: 'Error retrieving P/L' });
    });
});

// Create endpoint to retrieve trade history
app.get('/trades', (req, res) => {
    models.Trade.find().then(trades => {
        res.send(trades);
    }).catch(err => {
        res.status(500).send({ message: 'Error retrieving trade history' });
    });
});

// Get trade by ID
app.get('/trades/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const trade = await Trade.findById(id);
        if (!trade) {
            return res.status(404).send({ message: 'Trade not found' });
        }
        res.send(trade);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Update trade
app.put('/trades/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const trade = await Trade.findByIdAndUpdate(id, req.body, { new: true });
        if (!trade) {
            return res.status(404).send({ message: 'Trade not found' });
        }
        res.send(trade);
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Delete trade
app.delete('/trades/:id', async (req, res) => {
    try {
        const id = req.params.id;
        await Trade.findByIdAndRemove(id);
        res.send({ message: 'Trade deleted successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).send({ message: 'Internal Server Error' });
    }
});

// Add error handling middleware
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).send({ message: 'Internal Server Error' });
});

// Add logging middleware
app.use(morgan('dev'));

app.listen(3000, () => {
    console.log('Server started on port 3000');
});