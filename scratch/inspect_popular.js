const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://brainly.com.br/tarefa/414528', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const answersData = await page.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('[data-testid="answer_box"]'));
    return boxes.length;
  });
  
  console.log("Number of answers for 414528:", answersData);
  
  const page2 = await browser.newPage();
  await page2.goto('https://brainly.com.br/tarefa/62535142', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const answersData2 = await page2.evaluate(() => {
    const boxes = Array.from(document.querySelectorAll('[data-testid="answer_box"]'));
    return boxes.length;
  });
  console.log("Number of answers for 62535142:", answersData2);
  
  await browser.close();
}
run();
