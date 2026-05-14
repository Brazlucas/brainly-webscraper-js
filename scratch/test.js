const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const q1 = "A aplicação de algoritmos de aprendizado de máquina e inteligência artificial (IA) na otimização dos serviços de manutenção revolucionou a forma como as organizações gerem os seus ativos. Algoritmos de aprendizado de máquina podem analisar grandes quantidades de dados históricos de manutenção para identificar padrões, correlações e indicadores preditivos de falhas de equipamentos. Associe os itens da primeira lista com os itens da segunda lista, de acordo com a aplicação de algoritmos de a.";
  const query = `https://duckduckgo.com/html/?q=site:brainly.com.br ${encodeURIComponent(q1.substring(0, 200))}`;
  const query2 = `https://duckduckgo.com/html/?q=site:brainly.com.br ${encodeURIComponent(q1)}`;
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto(query, {waitUntil: 'domcontentloaded'});
  const url1 = await page.evaluate(() => {
    const a = document.querySelector('.result__url');
    return a ? a.href : null;
  });
  console.log("Q1 (200 chars):", url1);

  await page.goto(query2, {waitUntil: 'domcontentloaded'});
  const url2 = await page.evaluate(() => {
    const a = document.querySelector('.result__url');
    return a ? a.href : null;
  });
  console.log("Q2 (Full):", url2);
  
  await browser.close();
}
run();
