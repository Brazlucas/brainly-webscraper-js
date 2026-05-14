const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const query = "De acordo com a Encyclopedia of World History (Enciclopédia da História Mundial), uma organização sem fins lucrativos que tem como objetivo melhorar a educação histórica em todo o mundo, o que se sabe sobre Pitágoras vem de escritores posteriores que compilaram fragmentos de sua vida relatados por seus contemporâneos e alunos. Um teorema bem conhecido é aquele que relaciona os lados de um triângulo retângulo, o chamado Teorema de Pitágoras. Com base nesse teorema, resolva a questão a seguir: Um triângulo retângulo tem catetos medindo x cm e 12 cm. Ainda, a hipotenusa desse triângulo é 20 cm. Assinale a alternativa que indica o valor de x.";
  let cleanQuestion = query.split('Alternativas:')[0].split('Alternativa 1:')[0].trim();
  cleanQuestion = cleanQuestion.substring(0, 300).trim();
  
  const searchUrl = `https://brainly.com.br/app/ask?q=${encodeURIComponent(cleanQuestion)}`;
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto(searchUrl, {waitUntil: 'domcontentloaded'});
  await new Promise(r => setTimeout(r, 3000));
  
  const brainlyUrl = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/tarefa/"]');
    for (let link of links) {
      if (link.href && link.href.includes('/tarefa/')) {
        return link.href.split('?')[0]; 
      }
    }
    return null;
  });
  
  console.log("Extracted URL:", brainlyUrl);
  
  await browser.close();
}
run();
