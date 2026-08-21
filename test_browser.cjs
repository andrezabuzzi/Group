const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('APP CRASH') || text.includes('Error')) {
      console.log('PAGE ERROR LOG:', text);
    }
  });
  page.on('pageerror', error => console.log('PAGE EXCEPTION:', error.message));
  
  await page.goto('http://localhost:3000/confeccao/dashboard', { waitUntil: 'networkidle0' });
  
  const html = await page.content();
  if (html.includes("Global Error")) {
    console.log("Found Global Error!");
    console.log(await page.evaluate(() => document.body.innerText));
  }
  
  await browser.close();
})();
