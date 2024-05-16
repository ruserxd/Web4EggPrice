document.addEventListener('DOMContentLoaded', function() {
    // 綁定 productForm 提交事件
    document.getElementById('productForm').addEventListener('submit', function (e) {
        e.preventDefault();

        let productName = document.getElementById('productName').value;
        let price = document.getElementById('price').value;
        let date = document.getElementById('date').value;

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
                loadPriceRecords();  // 插入後重新加載價格記錄
            })
            .catch(error => {
                console.error('Error:', error);
                document.getElementById('response').innerText = 'Error: ' + error;
            });
    });

    // 頁面加載時加載價格記錄
    loadPriceRecords();

    // 綁定 fetchCrawlerData 按鈕點擊事件
    document.getElementById('fetchCrawlerData').addEventListener('click', function (e) {
        e.preventDefault(); // 阻止按鈕預設行為
        fetchCrawlerData(); // 調用爬蟲數據獲取函數
    });
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
            let resultsDiv = document.getElementById('crawlerResults');
            resultsDiv.innerHTML = '<h2>Crawler Results</h2>';
            data.forEach(product => {
                let productDiv = document.createElement('div');
                productDiv.innerHTML = `<p>ID: ${product.productId}<br>Name: ${product.productName}<br>Link: <a href="${product.productLink}" target="_blank">${product.productLink}</a><br>Price: ${product.price}</p>`;
                resultsDiv.appendChild(productDiv);
            });
        })
        .catch(error => {
            console.error('Error:', error);
        });
}
