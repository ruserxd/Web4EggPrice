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
    console.log('Connected to the SQLite database.');
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

    console.log(`Inserting: Product Name - ${productName}, Price - ${price}, Date - ${date}`);

    let sqlSelectProduct = 'SELECT ProductID FROM Products WHERE ProductName = ?';
    let sqlInsertProduct = 'INSERT INTO Products (ProductName) VALUES (?)';
    let sqlInsertPriceRecord = 'INSERT INTO PriceRecords (ProductID, Date, Price) VALUES (?, ?, ?)';

    db.get(sqlSelectProduct, [productName], (err, row) => {
        if (err) {
            console.error('Error selecting product:', err.message);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (row) {
            let productId = row.ProductID;
            db.run(sqlInsertPriceRecord, [productId, date, price], (err) => {
                if (err) {
                    console.error('Error inserting price record:', err.message);
                    res.status(500).send('Internal Server Error');
                } else {
                    res.send('Insert success');
                }
            });
        } else {
            db.run(sqlInsertProduct, [productName], function(err) {
                if (err) {
                    console.error('Error inserting product:', err.message);
                    res.status(500).send('Internal Server Error');
                    return;
                }

                let newProductId = this.lastID;
                db.run(sqlInsertPriceRecord, [newProductId, date, price], (err) => {
                    if (err) {
                        console.error('Error inserting price record:', err.message);
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

// 新增路由来触发爬虫并返回商品数据
app.get('/api/fetch-products', async (req, res) => {
    try {
        const keyword = req.query.searchKeyword || '泡麵';
        console.log('搜尋關鍵字', keyword);
        const products = await crawler.fetchPChomeData(keyword);
        res.json(products);
    } catch (error) {
        console.error('Error during fetching products:', error);
        res.status(500).send('Fetch products failed');
    }
});

// 新增用于删除的API
app.delete('/api/delete', (req, res) => {
    let productName = req.body.productName;
    let date = req.body.date;

    console.log(`Request to delete: ${productName} - ${date}`);

    let sqlDeleteRecord = 'DELETE FROM PriceRecords WHERE ProductID = (SELECT ProductID FROM Products WHERE ProductName = ?) AND Date = ?';

    db.run(sqlDeleteRecord, [productName, date], function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
            return;
        }

        if (this.changes > 0) {
            res.send('Delete success');
        } else {
            console.log(`No matching record found for: ${productName} - ${date}`);
            res.status(404).send('No matching record found');
        }
    });
});

// 新增路由來清空所有資料
app.delete('/api/clear-data', (req, res) => {
    let sqlDeletePriceRecords = 'DELETE FROM PriceRecords';
    let sqlDeleteProducts = 'DELETE FROM Products';

    db.run(sqlDeletePriceRecords, function(err) {
        if (err) {
            console.error(err.message);
            res.status(500).send('Internal Server Error');
            return;
        }

        db.run(sqlDeleteProducts, function(err) {
            if (err) {
                console.error(err.message);
                res.status(500).send('Internal Server Error');
                return;
            }

            res.send('All data cleared successfully');
        });
    });
});

// 新增路由來處理數據導入
// 新增路由來處理數據導入
app.post('/api/import-products', (req, res) => {
    const products = req.body;
    const sqlSelectProduct = 'SELECT ProductID FROM Products WHERE ProductName = ?';
    const sqlInsertProduct = 'INSERT INTO Products (ProductName) VALUES (?)';
    const sqlInsertPriceRecord = 'INSERT INTO PriceRecords (ProductID, Date, Price) VALUES (?, ?, ?)';

    db.serialize(() => {
        products.forEach(product => {
            db.get(sqlSelectProduct, [product.productName], (err, row) => {
                if (err) {
                    console.error('Error selecting product:', err.message);
                    return;
                }

                let productId;
                if (row) {
                    productId = row.ProductID;
                    db.run(sqlInsertPriceRecord, [productId, new Date().toISOString().split('T')[0], product.price], (err) => {
                        if (err) {
                            console.error('Error inserting price record:', err.message);
                        }
                    });
                } else {
                    db.run(sqlInsertProduct, [product.productName], function(err) {
                        if (err) {
                            console.error('Error inserting product:', err.message);
                            return;
                        }

                        productId = this.lastID;
                        db.run(sqlInsertPriceRecord, [productId, new Date().toISOString().split('T')[0], product.price], (err) => {
                            if (err) {
                                console.error('Error inserting price record:', err.message);
                            }
                        });
                    });
                }
            });
        });
    });

    res.send('Products imported successfully');
});

app.get('/api/fetch-div-content', async (req, res) => {
    try {
        console.log('API /api/fetch-div-content called');
        const divContent = await crawler.fetchDivContent();
        console.log('Fetched div content:', divContent);
        res.json({ divContent });
    } catch (error) {
        console.error('Error during fetching div content:', error);
        res.status(500).send('Fetch div content failed: ' + error.message);
    }
});
module.exports = app;
