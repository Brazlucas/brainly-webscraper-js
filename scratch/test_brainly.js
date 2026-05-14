const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
puppeteer.use(StealthPlugin());

async function run() {
  const q1 = "A aplicação de algoritmos de aprendizado de máquina e inteligência artificial (IA) na otimização dos serviços de manutenção revolucionou a forma como as organizações gerem os seus ativos. Algoritmos de aprendizado de máquina podem analisar grandes quantidades de dados históricos de manutenção para identificar padrões, correlações e indicadores preditivos de falhas de equipamentos. Associe os itens da primeira lista com os itens da segunda lista, de acordo com a aplicação de algoritmos de a.";
  const query = `https://brainly.com.br/app/ask?q=${encodeURIComponent(q1)}`;
  
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  
  await page.goto(query, {waitUntil: 'domcontentloaded'});
  // Wait a bit for React to render search results
  await new Promise(r => setTimeout(r, 3000));
  
  // The search results on Brainly are usually anchor tags with href like /tarefa/...
  const url = await page.evaluate(() => {
    const links = document.querySelectorAll('a[href*="/tarefa/"]');
    for (let link of links) {
      if (link.href && link.href.includes('/tarefa/')) {
        return link.href;
      }
    }
    return null;
  });
  console.log("Brainly direct search URL:", url);
  
  await browser.close();
}
run();
