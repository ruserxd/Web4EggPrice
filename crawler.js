const puppeteer = require('puppeteer');

const PCHOME_SEARCH_URL = 'https://24h.pchome.com.tw/search/?q=%E6%B3%A1%E9%BA%B5&scope=all';

async function fetchPChomeData() {
    const browser = await puppeteer.launch({ headless: false }); // 打開瀏覽器窗口以便調試
    const page = await browser.newPage();
    await page.goto(PCHOME_SEARCH_URL, { waitUntil: 'networkidle2' });

    // 等待頁面加載完成，特別是商品列表部分
    await page.waitForSelector('.col3f');

    // 抓取商品名稱、連結、ID和價格
    const products = await page.evaluate(() => {
        const items = [];
        document.querySelectorAll('h5.prod_name').forEach((item) => {
            const productNameElement = item.querySelector('a');
            const spanElement = item.previousElementSibling;
            if (productNameElement && spanElement && spanElement.classList.contains('prod_marketingText')) {
                const productName = productNameElement.innerText.trim();
                const productLink = productNameElement.getAttribute('href');
                const productId = spanElement.getAttribute('id').split('_')[0];
                const priceElement = document.querySelector(`#price_${productId}.value`);
                const price = priceElement ? parseInt(priceElement.innerText.replace(/[^0-9]/g, ''), 10) : null;
                if (productName && productLink && productId && price) {
                    items.push({ productId, productName, productLink, price });
                }
            }
        });
        return items;
    });

    await browser.close();
    return products;
}

async function main() {
    const products = await fetchPChomeData();
    console.log(products); // 輸出抓取到的商品ID、名稱、連結和價格
    return products;
}

module.exports = {
    main,
    fetchPChomeData
};
