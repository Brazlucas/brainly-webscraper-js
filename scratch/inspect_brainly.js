const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
  
  await page.goto('https://brainly.com.br/tarefa/62535142', {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 2000));
  
  const answersData = await page.evaluate(() => {
    // Attempt to find answer wrappers. Brainly often uses generic data-testids.
    // Let's try to get all answer_box_text and their closest relative containing ratings
    const boxes = Array.from(document.querySelectorAll('[data-testid="answer_box"]'));
    if (boxes.length > 0) {
        return boxes.map(box => {
           const textEl = box.querySelector('[data-testid="answer_box_text"]');
           const ratingEl = box.querySelector('[data-testid="answer_rating"]');
           const thanksEl = box.querySelector('[data-testid="thanks_count"]');
           const verifiedEl = box.querySelector('[data-testid="answer_box_expert_verified"]');
           return {
               html: textEl ? textEl.innerHTML : null,
               rating: ratingEl ? ratingEl.innerText : null,
               thanks: thanksEl ? thanksEl.innerText : null,
               isVerified: !!verifiedEl
           };
        });
    }
    
    // Fallback if data-testid="answer_box" doesn't exist
    const texts = Array.from(document.querySelectorAll('[data-testid="answer_box_text"]'));
    return texts.map(el => {
      // Find parent container to search for rating inside
      let parent = el.parentElement;
      while (parent && !parent.innerHTML.includes('data-testid="answer_rating"') && parent.tagName !== 'BODY') {
        parent = parent.parentElement;
      }
      const ratingEl = parent ? parent.querySelector('[data-testid="answer_rating"]') : null;
      return { html: el.innerHTML, rating: ratingEl ? ratingEl.innerText : null };
    });
  });
  
  console.log(JSON.stringify(answersData, null, 2));
  await browser.close();
}
run();
