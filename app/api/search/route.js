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
        
        // Extract the top 2 brainly URLs from the search results
        let extractedUrls = await page.evaluate(() => {
          const links = document.querySelectorAll('a[href*="/tarefa/"]');
          let urls = [];
          for (let link of links) {
            if (link.href && link.href.includes('/tarefa/')) {
              urls.push(link.href.split('?')[0]);
            }
          }
          // Remove duplicates and take top 2
          return [...new Set(urls)].slice(0, 2);
        });
        
        if (extractedUrls.length > 0) {
          brainlyUrl = extractedUrls; // Now an array
        } else {
          brainlyUrl = null;
        }
      } else {
        brainlyUrl = [brainlyUrl]; // Make it an array for consistency
      }

      let allAnswers = [];
      let bestAnswer = null;

      if (brainlyUrl && brainlyUrl.length > 0) {
        for (const url of brainlyUrl) {
          try {
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
            
            let extractedAnswers = await page.evaluate(() => {
              const boxes = Array.from(document.querySelectorAll('[data-testid="answer_box"]'));
              if (boxes.length > 0) {
                return boxes.map(box => {
                  const textEl = box.querySelector('[data-testid="answer_box_text"]');
                  const ratingEl = box.querySelector('[data-testid="answer_rating"]');
                  const thanksEl = box.querySelector('[data-testid="thanks_count"]');
                  const verifiedEl = box.querySelector('[data-testid="answer_box_expert_verified"], [data-testid="answer_box_verified_badge"]');
                  
                  const fallbackThanks = box.querySelector('.js-thanks-button, [aria-label*="obrigado"]');
                  let thanksText = thanksEl ? thanksEl.innerText : (fallbackThanks ? fallbackThanks.innerText : "0");
                  const thanksMatch = thanksText.match(/\d+/);
                  
                  return {
                    html: textEl ? textEl.innerHTML : null,
                    rating: ratingEl ? parseFloat(ratingEl.innerText.replace(',', '.')) : 0,
                    thanks: thanksMatch ? parseInt(thanksMatch[0]) : 0,
                    isVerified: !!verifiedEl
                  };
                });
              }
              
              const texts = Array.from(document.querySelectorAll('[data-testid="answer_box_text"], .js-answer-content'));
              return texts.map(el => ({ 
                html: el.innerHTML, 
                rating: 0,
                thanks: 0,
                isVerified: false
              }));
            });
            
            extractedAnswers = extractedAnswers.filter(a => a.html);
            allAnswers.push(...extractedAnswers);
          } catch (err) {
            console.error(`Erro ao extrair da url ${url}:`, err.message);
          }
        }
        
        if (allAnswers.length > 0) {
          // Remove exact duplicate answers by comparing a snippet of HTML
          const uniqueAnswers = [];
          const seen = new Set();
          for (const ans of allAnswers) {
            const cleanSnippet = ans.html.substring(0, 100).replace(/\s+/g, ' ');
            if (!seen.has(cleanSnippet)) {
              seen.add(cleanSnippet);
              uniqueAnswers.push(ans);
            }
          }
          
          // Sort by Verified first, then rating, then thanks
          uniqueAnswers.sort((a, b) => {
            if (a.isVerified !== b.isVerified) return a.isVerified ? -1 : 1;
            if (a.rating !== b.rating) return b.rating - a.rating;
            return b.thanks - a.thanks;
          });
          
          allAnswers = uniqueAnswers.slice(0, 3);
          bestAnswer = allAnswers[0].html;
        }
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
        allAnswers: allAnswers,
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
