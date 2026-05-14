const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://brainly.com.br/tarefa/59934958', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const questionHtml = await page.evaluate(() => {
    const qBox = document.querySelector('[data-testid="question_box_text"]');
    if (qBox) return qBox.innerHTML;
    
    const h1 = document.querySelector('h1');
    if (h1) return h1.innerHTML;
    
    return null;
  });
  
  console.log("Question HTML:", questionHtml);
  
  await browser.close();
}
run();
