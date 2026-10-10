import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
const example = `Photosynthesis is the process by which plants convert light energy into chemical energy stored in glucose. Chlorophyll is a green pigment that absorbs light energy, mainly red and blue wavelengths. The light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH while releasing oxygen from water. The Calvin cycle occurs in the stroma and uses ATP and NADPH to fix carbon dioxide into sugars. Stomata are small pores in leaves that allow carbon dioxide to enter and water vapor to exit. When stomata close to conserve water, carbon dioxide uptake decreases and photosynthesis can slow down. Cellular respiration breaks down glucose to release energy as ATP. Mitochondria are the organelles where most ATP is produced during aerobic cellular respiration.`;
async function request(url, options) { const res = await fetch(url, options); const data = await res.json(); if (!res.ok) throw new Error(data.error || 'Something went wrong. Please retry.'); return data; }
function App() {
  const [editing, setEditing] = useState(false);
  const [notes, setNotes] = useState(''); const [count, setCount] = useState(10); const [variations, setVariations] = useState(3); const [ai, setAi] = useState(false); const [mode, setMode] = useState('local'); const [busy, setBusy] = useState(''); const [error, setError] = useState(''); const [file, setFile] = useState(''); const [deck, setDeck] = useState(null); const [tab, setTab] = useState('cards'); const [index, setIndex] = useState(0); const [flipped, setFlipped] = useState(false); const [known, setKnown] = useState({}); const [answers, setAnswers] = useState({}); const [variant, setVariant] = useState(0);
  useEffect(() => { request('/api/status').then(d => { setAi(d.aiAvailable); if (d.aiAvailable) setMode('ai'); }).catch(() => setError('Cannot connect to the server. Start the app and reload.')); }, []);
  async function loadPDF(e) { const f = e.target.files?.[0]; if (!f) return; setBusy('Reading PDF'); setError(''); const body = new FormData(); body.append('file', f); try { const d = await request('/api/pdf', { method: 'POST', body }); setNotes(d.text); setFile(`${f.name} · ${d.pages} pages${d.partial ? ' · first 100 pages imported' : ''}`); } catch (e) { setError(e.message); } finally { setBusy(''); e.target.value = ''; } }
  async function generate(e) { e.preventDefault(); setBusy('Building your study set'); setError(''); try { const d = await request('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: notes, count, variations, mode }) }); setDeck(d); setEditing(false); setIndex(0); setVariant(0); setFlipped(false); setKnown({}); setAnswers({}); setTab('cards'); } catch (e) { setError(e.message); } finally { setBusy(''); } }
  function move(delta) { setIndex(i => (i + delta + (tab === 'cards' ? deck.cards.length : deck.quizzes.length)) % (tab === 'cards' ? deck.cards.length : deck.quizzes.length)); setFlipped(false); setVariant(0); }
  function switchTab(t) { setTab(t); setIndex(0); setVariant(0); setFlipped(false); }
  function download() { const blob = new Blob([JSON.stringify(deck, null, 2)], { type: 'application/json' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = 'lecture-lab-study-set.json'; a.click(); URL.revokeObjectURL(url); }
  const q = deck?.quizzes[index]?.variations[variant]; const answerKey = `${index}-${variant}`; const selected = answers[answerKey]; const totalQuestions = deck?.quizzes.reduce((sum, quiz) => sum + quiz.variations.length, 0); const correct = Object.entries(answers).filter(([key, value]) => { const [i, v] = key.split('-').map(Number); return deck.quizzes[i].variations[v].answer === value; }).length;
  return <main>
    <header><h1>Lecture Lab</h1><p>Turn your notes into flashcards and quizzes.</p></header>
    {!deck || editing ? <section className="panel">
      <form onSubmit={generate}>
        <div className="panel-heading"><label htmlFor="notes">Your notes</label><label className="upload">Upload PDF<input type="file" accept="application/pdf,.pdf" onChange={loadPDF} disabled={!!busy}/></label></div>
        {file && <p className="file-name">{file}</p>}
        <textarea id="notes" value={notes} disabled={!!busy} onChange={e => setNotes(e.target.value)} maxLength={60000} placeholder="Paste your lecture notes here…"/>
        <div className="text-meta"><button type="button" className="text-button" disabled={!!busy} onClick={() => { setNotes(example); setFile(''); }}>Try example notes</button><span>{notes.length.toLocaleString()} / 60,000</span></div>
        <details className="settings"><summary>Options</summary><div className="settings-fields">
          <label htmlFor="count">Study set size<select id="count" value={count} disabled={!!busy} onChange={e => setCount(Number(e.target.value))}><option value={6}>Up to 6 concepts</option><option value={10}>Up to 10 concepts</option><option value={15}>Up to 15 concepts</option></select></label>
          <label htmlFor="variations">Question variations<select id="variations" value={variations} disabled={!!busy} onChange={e => setVariations(Number(e.target.value))}><option value={2}>2 per concept</option><option value={3}>3 per concept</option></select></label>
          <label htmlFor="mode">Generation mode<select id="mode" value={mode} disabled={!!busy} onChange={e => setMode(e.target.value)}><option value="local">Local recall practice</option><option value="ai" disabled={!ai}>AI understanding{!ai ? ' (key required)' : ''}</option></select></label>
        </div></details>
        <p className="hint">{mode === 'local' ? 'Local mode makes recall questions. AI mode adds application and misconception questions.' : 'AI mode sends your notes to OpenAI to generate your study set.'}</p>
        {error && <div className="error" role="alert">{error}</div>}
        <div className="actions"><button className="primary" disabled={!!busy || notes.trim().length < 80}>{busy ? `${busy}…` : 'Create study set'}</button>{deck && <button type="button" disabled={!!busy} onClick={() => { setEditing(false); setError(''); }}>Back to study</button>}</div>
      </form>
    </section> : <section className="panel">
      <div className="panel-heading"><div className="tabs"><button className={tab === 'cards' ? 'active' : ''} aria-pressed={tab === 'cards'} onClick={() => switchTab('cards')}>Flashcards</button><button className={tab === 'quiz' ? 'active' : ''} aria-pressed={tab === 'quiz'} onClick={() => switchTab('quiz')}>Quiz</button></div><button className="text-button" onClick={() => setEditing(true)}>Edit notes</button></div>
      <p className="hint">{deck.mode === 'ai' ? 'AI understanding' : 'Local recall practice'}</p>
      {tab === 'cards' ? <>
        <button className={'flashcard ' + (flipped ? 'flipped' : '')} aria-label={flipped ? 'Show question' : 'Reveal answer'} onClick={() => setFlipped(!flipped)}><span>{flipped ? 'Answer' : 'Question'}</span><h2>{flipped ? deck.cards[index].back : deck.cards[index].front}</h2><small>{flipped ? 'Click to see question' : 'Click to reveal answer'}</small></button>
        {flipped && <details className="evidence"><summary>Source in your notes</summary><p>{deck.cards[index].evidence}</p></details>}
        <div className="rating"><button onClick={() => { setKnown({ ...known, [index]: false }); move(1); }}>Practice again</button><button onClick={() => { setKnown({ ...known, [index]: true }); move(1); }}>Got it</button></div>
        <p className="progress">{Object.values(known).filter(Boolean).length} of {deck.cards.length} understood</p>
      </> : <>
        <div className="variants" aria-label="Question variation">{deck.quizzes[index].variations.map((v, i) => <button key={i} aria-pressed={variant === i} className={variant === i ? 'active' : ''} onClick={() => setVariant(i)}>Variation {i + 1}{deck.mode === 'ai' ? ` · ${v.type}` : ''}</button>)}</div>
        <h2 className="question">{q.question}</h2>
        <div className="options">{q.options.map((option, i) => <button key={i} disabled={selected !== undefined} onClick={() => setAnswers({ ...answers, [answerKey]: i })} className={selected !== undefined ? i === q.answer ? 'correct' : selected === i ? 'incorrect' : '' : ''}><span>{'ABCD'[i]}.</span>{option}{selected !== undefined && i === q.answer && <b>✓</b>}</button>)}</div>
        {selected !== undefined && <div className="explanation" role="status"><strong>{selected === q.answer ? 'Correct' : 'Incorrect — review the explanation'}</strong><p>{q.explanation}</p></div>}
        <p className="progress">{correct} correct · {Object.keys(answers).length} of {totalQuestions} answered</p>
      </>}
      <div className="navigation"><button onClick={() => move(-1)}>Previous</button><span>{index + 1} / {tab === 'cards' ? deck.cards.length : deck.quizzes.length}</span><button onClick={() => move(1)}>Next</button></div>
      {tab === 'quiz' && Object.keys(answers).length === totalQuestions && <div className="complete"><strong>Round complete · {Math.round(correct / totalQuestions * 100)}%</strong><button className="text-button" onClick={() => { setAnswers({}); setIndex(0); setVariant(0); }}>Try again</button></div>}
      <div className="export"><button className="text-button" onClick={download}>Export study set</button></div>
    </section>}
  </main>;
}
createRoot(document.getElementById('root')).render(<App/>);
