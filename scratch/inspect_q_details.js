const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://brainly.com.br/tarefa/62535142', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const questionDetails = await page.evaluate(() => {
    // Sometimes there is an extra description below the title
    // Let's grab all text from the main question container to see if there's more.
    const container = document.querySelector('[data-testid="question_box"]');
    return container ? container.innerText : null;
  });
  
  console.log("Question Details:", questionDetails);
  
  await browser.close();
}
run();
