import React, { useState, useEffect } from 'react';
import { useNLP } from '../../hooks/useNLP';

export const NLPPage = () => {
  const { analyze, result, status, isAnalyzing, error } = useNLP();

  // États locaux
  const [inputText, setInputText] = useState('');
  const [history, setHistory] = useState([]);

  // Ajouter à l'historique quand un résultat arrive
  useEffect(() => {
    if (result) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setHistory((prev) => [result, ...prev.slice(0, 4)]); // Garder les 5 derniers
      setInputText(''); // Réinitialiser le textarea
    }
  }, [result]);

  // Gérer le clic sur Analyser
  const handleAnalyze = async () => {
    if (inputText.trim()) {
      await analyze(inputText);
    }
  };

  // Gérer l'appui sur Entrée + Ctrl/Cmd
  const handleKeyDown = (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleAnalyze();
    }
  };

  return (
    <div style={{ padding: '40px', maxWidth: '1000px', margin: '0 auto' }}>
      <h1>🧠 Analyse de Sentiment NLP</h1>
      <p style={{ color: '#666', marginBottom: '30px' }}>
        Entrez un texte pour obtenir son embedding USE et analyser le sentiment
      </p>

      {/* ========== ZONE DE SAISIE ========== */}
      <section style={{ marginBottom: '40px' }}>
        <h2>Entrez votre feedback</h2>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Entrez un feedback client, un avis, une phrase..."
          disabled={status !== 'ready'}
          style={{
            width: '100%',
            minHeight: '100px',
            padding: '12px',
            borderRadius: '8px',
            border: `2px solid ${status === 'ready' ? '#ddd' : '#eee'}`,
            fontFamily: 'system-ui',
            fontSize: '14px',
            backgroundColor: status === 'ready' ? '#fff' : '#f9f9f9',
            cursor: status === 'ready' ? 'text' : 'not-allowed',
            transition: 'all 0.3s',
          }}
        />
        <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
          <button
            onClick={handleAnalyze}
            disabled={status !== 'ready' || !inputText.trim() || isAnalyzing}
            style={{
              padding: '10px 20px',
              backgroundColor: status === 'ready' && !isAnalyzing ? '#007bff' : '#ccc',
              color: '#fff',
              border: 'none',
              borderRadius: '6px',
              cursor: status === 'ready' && !isAnalyzing ? 'pointer' : 'not-allowed',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'background-color 0.3s',
            }}
          >
            {isAnalyzing ? '⏳ Analyse en cours...' : '▶️ Analyser'}
          </button>
          {status !== 'ready' && (
            <span style={{ color: '#ff6b6b', alignSelf: 'center', fontSize: '14px' }}>
              ⏳ Chargement des modèles...
            </span>
          )}
        </div>
      </section>

      {/* ========== AFFICHAGE ERREUR ========== */}
      {error && (
        <div
          style={{
            backgroundColor: '#ffe0e0',
            border: '1px solid #ff6b6b',
            borderRadius: '6px',
            padding: '12px',
            marginBottom: '30px',
            color: '#d32f2f',
          }}
        >
          ❌ {error}
        </div>
      )}

      {/* ========== AFFICHAGE RÉSULTATS ========== */}
      {result && (
        <div style={{ marginBottom: '40px' }}>
          {/* ===== BADGE SENTIMENT ===== */}
          <section style={{ marginBottom: '30px' }}>
            <h2>Résultat</h2>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              <div
                style={{
                  padding: '20px',
                  borderRadius: '12px',
                  backgroundColor:
                    result.sentiment === 'POSITIF'
                      ? '#d4edda'
                      : result.sentiment === 'NÉGATIF'
                        ? '#f8d7da'
                        : '#e2e3e5',
                  color:
                    result.sentiment === 'POSITIF'
                      ? '#155724'
                      : result.sentiment === 'NÉGATIF'
                        ? '#721c24'
                        : '#383d41',
                  fontSize: '24px',
                  fontWeight: 'bold',
                  minWidth: '200px',
                  textAlign: 'center',
                }}
              >
                <div>
                  {result.sentiment === 'POSITIF'
                    ? '✅'
                    : result.sentiment === 'NÉGATIF'
                      ? '❌'
                      : '➖'}
                </div>
                <div>{result.sentiment}</div>
                <div style={{ fontSize: '18px', marginTop: '8px' }}>
                  {result.score}%
                </div>
              </div>

              {/* ===== BARRES DE PROGRESSION ===== */}
              <div style={{ flex: 1 }}>
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    POSITIF: {result.scores.positif}%
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${result.scores.positif}%`,
                        height: '100%',
                        backgroundColor: '#28a745',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    NÉGATIF: {result.scores.négatif}%
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${result.scores.négatif}%`,
                        height: '100%',
                        backgroundColor: '#dc3545',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', color: '#666', marginBottom: '4px' }}>
                    NEUTRE: {result.scores.neutre}%
                  </div>
                  <div
                    style={{
                      width: '100%',
                      height: '8px',
                      backgroundColor: '#e0e0e0',
                      borderRadius: '4px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${result.scores.neutre}%`,
                        height: '100%',
                        backgroundColor: '#6c757d',
                        transition: 'width 0.3s',
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ===== EMBEDDING VISUALISATION ===== */}
          <section style={{ marginBottom: '30px' }}>
            <h2>Vecteur Embedding USE (20 premières valeurs)</h2>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(10, 1fr)',
                gap: '6px',
                padding: '16px',
                backgroundColor: '#f5f5f5',
                borderRadius: '8px',
              }}
            >
              {Array.from(result.embedding.slice(0, 20)).map((value, i) => (
                <div
                  key={i}
                  style={{
                    height: '40px',
                    backgroundColor: value > 0 ? '#b3e5fc' : '#ffccbc',
                    borderRadius: '4px',
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'center',
                    borderBottom: `${Math.abs(value) * 30}px solid ${
                      value > 0 ? '#0288d1' : '#ff6f00'
                    }`,
                    fontSize: '10px',
                    color: '#666',
                    cursor: 'default',
                    title: `[${i}]: ${value.toFixed(3)}`,
                  }}
                >
                  {i}
                </div>
              ))}
            </div>
            <p style={{ color: '#666', fontSize: '12px', marginTop: '8px' }}>
              💡 Les vecteurs USE ont 512 dimensions — on affiche les 20 premiers pour visualiser.
              Bleu = positif, Orange = négatif
            </p>
          </section>
        </div>
      )}

      {/* ========== HISTORIQUE ========== */}
      {history.length > 0 && (
        <section>
          <h2>Historique des analyses ({history.length})</h2>
          <div style={{ overflowX: 'auto' }}>
            <table
              style={{
                width: '100%',
                borderCollapse: 'collapse',
                backgroundColor: '#f9f9f9',
              }}
            >
              <thead>
                <tr style={{ backgroundColor: '#f0f0f0', borderBottom: '2px solid #ddd' }}>
                  <th style={{ padding: '10px', textAlign: 'left' }}>Texte</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Sentiment</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Score</th>
                  <th style={{ padding: '10px', textAlign: 'center' }}>Heure</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, i) => (
                  <tr
                    key={i}
                    style={{
                      borderBottom: '1px solid #eee',
                      backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
                    }}
                  >
                    <td style={{ padding: '10px' }}>
                      <span style={{ color: '#666', fontSize: '13px' }}>
                        {item.text.substring(0, 50)}
                        {item.text.length > 50 ? '...' : ''}
                      </span>
                    </td>
                    <td
                      style={{
                        padding: '10px',
                        textAlign: 'center',
                        color:
                          item.sentiment === 'POSITIF'
                            ? '#28a745'
                            : item.sentiment === 'NÉGATIF'
                              ? '#dc3545'
                              : '#6c757d',
                        fontWeight: 'bold',
                      }}
                    >
                      {item.sentiment === 'POSITIF'
                        ? '✅'
                        : item.sentiment === 'NÉGATIF'
                          ? '❌'
                          : '➖'}{' '}
                      {item.sentiment}
                    </td>
                    <td style={{ padding: '10px', textAlign: 'center' }}>{item.score}%</td>
                    <td style={{ padding: '10px', textAlign: 'center', fontSize: '12px', color: '#999' }}>
                      {new Date(item.timestamp).toLocaleTimeString('fr-FR')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
};