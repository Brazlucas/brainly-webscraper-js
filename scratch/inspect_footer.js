const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://brainly.com.br/tarefa/59934958', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const footers = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('[data-testid="answer_box"]'));
    return boxes.map(box => {
      // Find buttons or spans that might contain hearts/stars
      const allText = box.innerText;
      
      // Let's grab all data-testids
      const testids = Array.from(box.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid') + ': ' + el.innerText.substring(0,20).replace(/\n/g, ' '));
      
      // Let's also grab SVG aria-labels or button aria-labels
      const arias = Array.from(box.querySelectorAll('[aria-label]')).map(el => el.getAttribute('aria-label') + ': ' + el.innerText.substring(0,20).replace(/\n/g, ' '));
      
      return { text: allText.substring(allText.length - 150).replace(/\n/g, ' '), testids, arias };
    });
  });
  
  console.log(JSON.stringify(footers, null, 2));
  
  await browser.close();
}
run();
