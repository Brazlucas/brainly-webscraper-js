const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto('https://brainly.com.br/tarefa/59934958', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const questionHtml = await page.evaluate(() => {
    const qBoxText = document.querySelector('[data-testid="question_box_text"]');
    const sgText = document.querySelectorAll('.sg-text');
    let h1Text = '';
    const h1 = document.querySelector('h1');
    if(h1) h1Text = h1.innerText;
    
    // Sometimes there is an extra description
    const qBox = document.querySelector('[data-testid="question_box"]');
    
    return {
      qBoxText: qBoxText ? qBoxText.innerText : null,
      h1Text: h1Text,
      qBoxHTML: qBox ? qBox.innerHTML : null
    };
  });
  
  console.log("Question HTML:", questionHtml.qBoxText);
  console.log("H1 text:", questionHtml.h1Text);
  
  await browser.close();
}
run();
