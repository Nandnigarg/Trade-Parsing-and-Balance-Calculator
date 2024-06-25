// app.js

const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const csvParser = require('csv-parser');
const fs = require('fs');
const Trade = require('./models/trade.model');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB connection
mongoose.connect('mongodb+srv://Nandni:nandu6239@cluster0.ok9o9jh.mongodb.net/Calculator-DB?retryWrites=true&w=majority');

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Multer setup for file upload
const uploadDir = './uploads';
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, file.originalname);
    }
});

const upload = multer({
    storage: storage,
    fileFilter(req, file, cb) {
        if (file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Not a CSV file'), false);
        }
    },
    limits: {
        fileSize: 1024 * 1024 * 5 // 5MB limit
    }
});

// Express middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API endpoint to upload CSV file
// API endpoint to upload CSV file
app.post('/upload', upload.single('file'), async (req, res) => {
    if (!req.file) {
        return res.status(400).send({ message: 'No file uploaded' });
    }

    const trades = [];
    fs.createReadStream(req.file.path)
        .pipe(csvParser())
        .on('data', (row) => {
            // Validate row and check for necessary properties
            if (row.UTC_Time && row.Operation && row.Market && row['Buy/Sell Amount'] && row.Price) {
                const marketParts = row.Market.split('/');
                trades.push({
                    UTC_Time: new Date(row.UTC_Time),
                    Operation: row.Operation.toLowerCase(),
                    Market: row.Market,
                    baseCoin: marketParts[0],
                    quoteCoin: marketParts[1],
                    Amount: parseFloat(row['Buy/Sell Amount']),
                    Price: parseFloat(row.Price)
                });
            } else {
                console.warn('Skipping row due to missing data:', row);
            }
        })
        .on('end', async () => {
            try {
                if (trades.length > 0) {
                    await Trade.insertMany(trades);
                    res.send({ message: 'Trade data stored successfully' });
                } else {
                    res.status(400).send({ message: 'No valid trade data found' });
                }
            } catch (err) {
                console.error(err);
                res.status(500).send({ message: 'Error storing trade data' });
            } finally {
                // Delete uploaded file after processing
                fs.unlinkSync(req.file.path);
            }
        })
        .on('error', (err) => {
            console.error(err);
            res.status(500).send({ message: 'Error parsing CSV file' });
        });
});

app.post('/api/balance', async (req, res) => {
    try {
        const { timestamp } = req.body;

        // Validate timestamp format (optional step)
        const requestedTimestamp = new Date(timestamp);
        if (isNaN(requestedTimestamp.getTime())) {
            return res.status(400).json({ error: 'Invalid timestamp format' });
        }

        // Query MongoDB to find all trades before the requested timestamp
        const trades = await Trade.find({ timestamp: { $lt: requestedTimestamp } });

        // Calculate asset-wise balances
        const assetBalances = {};

        trades.forEach(trade => {
            const { operation, baseCoin, amount } = trade;

            if (!assetBalances[baseCoin]) {
                assetBalances[baseCoin] = 0;
            }

            if (operation === 'buy') {
                assetBalances[baseCoin] += amount;
            } else if (operation === 'sell') {
                assetBalances[baseCoin] -= amount;
            }
        });

        // Remove assets with zero balance
        Object.keys(assetBalances).forEach(key => {
            if (assetBalances[key] === 0) {
                delete assetBalances[key];
            }
        });

        // Send the response
        res.json(assetBalances);
    } catch (error) {
        console.error('Error fetching asset balances:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


// Start server
app.listen(port, () => {
    console.log(`Server started on port ${port}`);
});
