const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://brainly.com.br/tarefa/62535142', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const questionHtml = await page.evaluate(() => {
    // Check multiple possible selectors
    const test1 = document.querySelector('[data-testid="question_box_text"]');
    const test2 = document.querySelector('.brn-qpage-next-question-box-content');
    const test3 = document.querySelector('[data-testid="question_box_content"]');
    return {
       test1: test1 ? test1.innerText : null,
       test2: test2 ? test2.innerText : null,
       test3: test3 ? test3.innerText : null,
       h1: document.querySelector('h1') ? document.querySelector('h1').innerText : null
    };
  });
  
  console.log("Question Extractions:", questionHtml);
  
  await browser.close();
}
run();
