document.addEventListener('DOMContentLoaded', function() {
    // 如果存在 productForm，則綁定其提交事件
    const productForm = document.getElementById('productForm');
    if (productForm) {
        productForm.addEventListener('submit', function (e) {
            e.preventDefault();

            let productName = document.getElementById('productName').value;
            let price = document.getElementById('price').value;
            let date = document.getElementById('date').value;

            console.log('Product Name:', productName); // 調試日誌
            console.log('Price:', price); // 調試日誌
            console.log('Date:', date); // 調試日誌

            fetch('/api/insert', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({productName, price, date})
            })
                .then(response => response.text())
                .then(data => {
                    document.getElementById('response').innerText = data;

                    // 只有當 search 元素存在時才加載價格記錄
                    if (document.getElementById('search')) {
                        loadPriceRecords();  // 插入後重新加載價格記錄
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    document.getElementById('response').innerText = 'Error: ' + error;
                });
        });
    }

    // 如果存在 search 元素，則加載價格記錄
    if (document.getElementById('search')) {
        loadPriceRecords();
    }

    // 如果存在 fetchCrawlerData 按鈕，則綁定其點擊事件
    const fetchCrawlerDataButton = document.getElementById('fetchCrawlerData');
    if (fetchCrawlerDataButton) {
        fetchCrawlerDataButton.addEventListener('click', function (e) {
            e.preventDefault();
            fetchCrawlerData();
        });
    }
});

function loadPriceRecords() {
    let search = document.getElementById('search').value;
    fetch(`/api/price-records?search=${search}`)
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById('priceTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach(record => {
                let row = tableBody.insertRow();
                row.insertCell(0).innerText = record.ProductName;
                row.insertCell(1).innerText = record.Date;
                row.insertCell(2).innerText = record.Price;
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

// 新增用於獲取爬蟲數據的函數
function fetchCrawlerData() {
    let keyword = document.getElementById('searchKeyword').value || '泡麵';
    fetch(`/api/fetch-products?searchKeyword=${encodeURIComponent(keyword)}`)
        .then(response => response.json())
        .then(data => {
            let tableBody = document.getElementById('crawlerTable').getElementsByTagName('tbody')[0];
            tableBody.innerHTML = '';
            data.forEach(product => {
                let row = tableBody.insertRow();
                row.insertCell(0).innerText = product.productId;
                row.insertCell(1).innerText = product.productName;
                row.insertCell(2).innerHTML = `<a href="${product.productLink}" target="_blank">${product.productLink}</a>`;
                row.insertCell(3).innerText = product.price;
            });

            // 顯示 Import Data 按鈕
            document.getElementById('importData').style.display = 'block';
        })
        .catch(error => {
            console.error('Error:', error);
        });
}

function importDataToDatabase() {
    let tableBody = document.getElementById('crawlerTable').getElementsByTagName('tbody')[0];
    let products = [];
    for (let i = 0; i < tableBody.rows.length; i++) {
        let row = tableBody.rows[i];
        let product = {
            productId: row.cells[0].innerText,
            productName: row.cells[1].innerText,
            productLink: row.cells[2].innerText,
            price: row.cells[3].innerText
        };
        products.push(product);
    }

    fetch('/api/import-products', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(products)
    })
        .then(response => response.text())
        .then(data => {
            document.getElementById('importResponse').innerText = data;
        })
        .catch(error => {
            console.error('Error:', error);
            document.getElementById('importResponse').innerText = 'Error: ' + error;
        });
}