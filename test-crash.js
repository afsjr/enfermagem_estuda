import puppeteer from 'puppeteer';

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', err => console.log('PAGE ERROR:', err.toString()));
  
  await page.goto('http://localhost:5173');
  // Wait for the app to load
  await new Promise(r => setTimeout(r, 3000));
  
  // Click something to generate a mindmap?
  // We can just render the component manually if we want, or evaluate it.
  
  await browser.close();
})();
