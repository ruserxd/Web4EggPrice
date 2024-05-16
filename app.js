const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const sqlite3 = require('sqlite3').verbose();
const crawler = require('./crawler'); // 引入爬虫脚本

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/users', usersRouter);

const db = new sqlite3.Database(path.join(__dirname, 'DB/sqlite.db'), (err) => {
    if (err) {
        return console.error(err.message);
    }
    console.log('Connected to the SQlite database.');
});

app.get('/api/quotes', (req, res) => {
    db.all('SELECT * FROM Products', (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(rows);
        }
    });
});

app.post('/api/insert', (req, res) => {
    let productName = req.body.productName;
    let price = req.body.price;
    let date = req.body.date;

    let sqlSelectProduct = 'SELECT ProductID FROM Products WHERE ProductName = ?';
    let sqlInsertProduct = 'INSERT INTO Products (ProductName, CreationDate) VALUES (?, ?)';
    let sqlInsertPriceRecord = 'INSERT INTO PriceRecords (ProductID, Date, Price) VALUES (?, ?, ?)';

    db.get(sqlSelectProduct, [productName], (err, row) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (row) {
            let productId = row.ProductID;
            db.run(sqlInsertPriceRecord, [productId, date, price], (err) => {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.send('Insert success');
                }
            });
        } else {
            db.run(sqlInsertProduct, [productName, date], function(err) {
                if (err) {
                    console.error(err.message);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                let newProductId = this.lastID;
                db.run(sqlInsertPriceRecord, [newProductId, date, price], (err) => {
                    if (err) {
                        console.error(err.message);
                        res.status(500).send('Internal Server Error');
                    } else {
                        res.send('Insert success');
                    }
                });
            });
        }
    });
});

app.get('/api/price-records', (req, res) => {
    let search = req.query.search || '';
    let sql = `
        SELECT Products.ProductName, PriceRecords.Date, PriceRecords.Price 
        FROM PriceRecords 
        JOIN Products ON PriceRecords.ProductID = Products.ProductID 
        WHERE Products.ProductName LIKE ? 
        ORDER BY PriceRecords.Date DESC
    `;
    db.all(sql, [`%${search}%`], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.json(rows);
        }
    });
});

// 新增路由來觸發爬蟲并返回商品数据
app.get('/api/fetch-products', async (req, res) => {
    try {
        const products = await crawler.fetchPChomeData();
        res.json(products);
    } catch (error) {
        console.error('Error during fetching products:', error);
        res.status(500).send('Fetch products failed');
    }
});

module.exports = app;