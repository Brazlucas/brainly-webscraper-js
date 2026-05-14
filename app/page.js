"use client";

import { useState } from "react";

export default function Home() {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async () => {
    if (!inputText.trim()) {
      setError("Por favor, cole a pergunta e as alternativas.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/search", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: inputText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Ocorreu um erro ao buscar no Brainly.");
      }

      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <header>
        <h1>Brainly Helper</h1>
      </header>

      <main className="card">
        <div className="input-group">
          <label htmlFor="question">Enunciado e Alternativas</label>
          <textarea
            id="question"
            placeholder="Exemplo: Conforme mencionado no artigo...&#10;&#10;Alternativas:&#10;Alternativa 1: ...&#10;Alternativa 2: ..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
          />

          <button
            onClick={handleSearch}
            disabled={loading || !inputText.trim()}
          >
            {loading ? (
              <>
                <div className="spinner"></div>
                Buscando...
              </>
            ) : (
              "Encontrar Resposta Correta"
            )}
          </button>
        </div>

        {error && (
          <div className="error-card">
            <p>⚠️ {error}</p>
          </div>
        )}

        {result && (
          <div className="result-card">
            <h3>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                <polyline points="22 4 12 14.01 9 11.01"></polyline>
              </svg>
              Melhor Resposta Encontrada
            </h3>
            
            {result.questionHtml && (
              <details className="question-details">
                <summary>Ver pergunta original do Brainly (Clique para expandir)</summary>
                <div 
                  className="question-content"
                  dangerouslySetInnerHTML={{ __html: result.questionHtml }}
                />
              </details>
            )}

            {result.allAnswers && result.allAnswers.length > 0 ? (
              <div className="answers-list">
                {result.allAnswers.map((answer, index) => (
                  <div key={index} className={`result-content ${index === 0 ? 'primary-answer' : 'secondary-answer'}`}>
                    <div className="answer-header">
                      <span className="answer-badge">{index === 0 ? 'Melhor Resposta' : `Resposta ${index + 1}`}</span>
                      {answer.isVerified && <span className="verified-badge">✓ Verificada</span>}
                      {answer.rating > 0 && <span className="rating-badge">⭐ {answer.rating}</span>}
                      <span className="thanks-badge">❤️ {answer.thanks} avaliações</span>
                    </div>
                    <div
                      dangerouslySetInnerHTML={{ __html: answer.html }}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <p>{result.message}</p>
            )}
            {result.questionUrl && (
              <a
                href={result.questionUrl}
                target="_blank"
                rel="noreferrer"
                style={{ display: 'inline-block', marginTop: '1rem', color: '#38bdf8', textDecoration: 'none', fontSize: '0.9rem' }}
              >
                Ver questão original no Brainly ↗
              </a>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
