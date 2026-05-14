const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://brainly.com.br/tarefa/62535142', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const attachments = await page.evaluate(() => {
    const qBox = document.querySelector('[data-testid="question_box"]');
    if (!qBox) return "No qBox";
    const imgs = Array.from(qBox.querySelectorAll('img'));
    return imgs.map(img => img.src);
  });
  
  console.log("Attachments:", attachments);
  
  await browser.close();
}
run();
