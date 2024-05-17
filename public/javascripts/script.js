document.addEventListener('DOMContentLoaded', function() {
    // 綁定 productForm 提交事件
    document.getElementById('productForm').addEventListener('submit', function (e) {
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
        // 綁定 fetchCrawlerData 按鈕點擊事件
        const fetchCrawlerDataButton = document.getElementById('fetchCrawlerData');
        if (fetchCrawlerDataButton) {
            fetchCrawlerDataButton.addEventListener('click', function (e) {
                e.preventDefault();
                fetchCrawlerData();
            });
        }
    });

    // 只有當 search 元素存在時才加載價格記錄
    if (document.getElementById('search')) {
        loadPriceRecords();
    }

    // 綁定 fetchCrawlerData 按鈕點擊事件
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
    fetch('/api/fetch-products')
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
        })
        .catch(error => {
            console.error('Error:', error);
        });
}