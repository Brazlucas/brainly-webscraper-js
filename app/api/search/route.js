import { NextResponse } from "next/server";
import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";

puppeteer.use(StealthPlugin());

export async function POST(request) {
  try {
    const { question, alternatives } = await request.json();
    
    if (!question) {
      return NextResponse.json({ error: "A pergunta é obrigatória." }, { status: 400 });
    }

    // Extract direct URL if the user pasted it
    let brainlyUrl = null;
    const urlRegex = /(https?:\/\/brainly\.com\.br\/tarefa\/\d+)/i;
    const urlMatch = question.match(urlRegex);
    
    if (urlMatch) {
      brainlyUrl = urlMatch[1];
    }

    // Clean up question to be a good search query
    // Remove "Alternativas:", "Alternativa 1", etc. to make search cleaner
    let cleanQuestion = question.split('Alternativas:')[0].split('Alternativa 1:')[0].trim();
    // Brainly search handles long queries well, but let's cap it at a reasonable size
    cleanQuestion = cleanQuestion.substring(0, 300).trim();
    
    // Search directly on Brainly to get the best accuracy
    const searchUrl = `https://brainly.com.br/app/ask?q=${encodeURIComponent(cleanQuestion)}`;
    
    let browser;
    try {
      browser = await puppeteer.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox'] 
      });
      const page = await browser.newPage();
      
      // Set a generic user agent
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36');
      
      // Navigate to Brainly search ONLY if we don't have a URL
      if (!brainlyUrl) {
        await page.goto(searchUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
        
        // Wait a little bit for Brainly's React app to render the search results
        await new Promise(r => setTimeout(r, 2000));
        
        // Extract the first brainly URL from the search results
        brainlyUrl = await page.evaluate(() => {
          const links = document.querySelectorAll('a[href*="/tarefa/"]');
          for (let link of links) {
            if (link.href && link.href.includes('/tarefa/')) {
              return link.href.split('?')[0]; // Return clean URL without tracking params
            }
          }
          return null;
        });
      }

      let bestAnswer = null;

      if (brainlyUrl) {
        // Now let's try to visit the Brainly URL
        // Cloudflare might block this, but we'll try with stealth plugin
        await page.goto(brainlyUrl, { waitUntil: 'domcontentloaded', timeout: 20000 });
        
        bestAnswer = await page.evaluate(() => {
          // Brainly usually puts the verified answer in a specific div
          // Looking for elements that look like the answer text
          const answerElements = document.querySelectorAll('[data-testid="answer_box_text"], .js-answer-content');
          if (answerElements && answerElements.length > 0) {
            // Retorna o innerHTML para manter negritos (b, strong) e quebras de linha (br, p)
            return answerElements[0].innerHTML;
          }
          return null;
        });
      }

      await browser.close();

      if (!bestAnswer) {
        return NextResponse.json({ 
          success: true, 
          message: "Não conseguimos extrair a resposta. O Brainly pode estar bloqueando a consulta ou a pergunta não foi encontrada.",
          bestAnswer: null 
        });
      }

      return NextResponse.json({ 
        success: true, 
        bestAnswer: bestAnswer,
        questionUrl: brainlyUrl || null
      });

    } catch (e) {
      if (browser) await browser.close();
      console.error("Puppeteer Error:", e);
      return NextResponse.json({ error: `Erro na extração com navegador: ${e.message}` }, { status: 500 });
    }

  } catch (error) {
    console.error("Erro interno:", error);
    return NextResponse.json({ error: error.message || "Erro interno no servidor" }, { status: 500 });
  }
}
