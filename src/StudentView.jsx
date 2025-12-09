import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function StudentView({ onLogout }) {
  const [config, setConfig] = useState(null)
  const [availableTopics, setAvailableTopics] = useState([])
  const [selectedTopic, setSelectedTopic] = useState(null)
  const [session, setSession] = useState(null)
  const [currentTask, setCurrentTask] = useState(0) // 0 = wybór tematu, 1-N = zadania
  const [question, setQuestion] = useState(null)
  const [examples, setExamples] = useState([])
  const [currentExample, setCurrentExample] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    // Załaduj config
    const { data: cfg } = await supabase.from('config').select('*').single()
    setConfig(cfg)

    // Załaduj dostępne tematy (aktywne i nieużyte w tym cyklu)
    const { data: usedTopics } = await supabase.from('cycle_state').select('topic_id').eq('used', true)
    const usedIds = usedTopics.map(t => t.topic_id)
    
    const { data: allTopics } = await supabase.from('topics').select('*').eq('active', true)
    const available = allTopics.filter(t => !usedIds.includes(t.id))
    
    setAvailableTopics(available)

    // Jeśli wszystkie użyte - resetuj cykl
    if (available.length === 0) {
      await supabase.from('cycle_state').update({ used: false }).neq('id', 0)
      const { data: resetTopics } = await supabase.from('topics').select('*').eq('active', true)
      setAvailableTopics(resetTopics)
    }
  }

  const startSession = async (topicId) => {
    // Utwórz sesję
    const { data: newSession } = await supabase
      .from('sessions')
      .insert({})
      .select()
      .single()

    setSession(newSession)
    setSelectedTopic(topicId)
    
    // Oznacz temat jako użyty w cyklu
    await supabase.from('cycle_state').update({ used: true }).eq('topic_id', topicId)

    // Dodaj temat do sesji
    await supabase.from('session_topics').insert({
      session_id: newSession.id,
      topic_id: topicId
    })

    setCurrentTask(1)
    await generateQuestion(topicId)
  }

  const generateQuestion = async (topicId) => {
    setLoading(true)
    
    try {
      const { data: topic } = await supabase.from('topics').select('name').eq('id', topicId).single()
      
      const ANTHROPIC_API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY
      
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `Jesteś ekspertem od matematyki dla 8 klasy szkoły podstawowej w Polsce. 
  
  Wygeneruj jedno zadanie egzaminacyjne z tematu: ${topic.name}
  
  Zadanie powinno zawierać:
  1. Treść głównego pytania/polecenia
  2. ${config.examples_per_task} konkretnych przykładów do rozwiązania z odpowiedziami
  
  Format JSON:
  {
    "question": "treść głównego pytania",
    "examples": [
      {"problem": "konkretny przykład 1", "answer": "odpowiedź"},
      {"problem": "konkretny przykład 2", "answer": "odpowiedź"}
    ]
  }
  
  Odpowiedzi powinny być w formie prostej (liczby, ułamki jak 1/2, potęgi jak 2^3, pierwiastki jak sqrt(9)).
  Zadania na poziomie egzaminu ósmoklasisty - średnia trudność.
  
  WAŻNE: Odpowiedz TYLKO samym JSONem, bez żadnego dodatkowego tekstu.`
          }]
        })
      })
  
      const data = await response.json()
      let content = data.content[0].text
      
      // Wyciągnij JSON z odpowiedzi
      try {
        const parsed = JSON.parse(content)
        setQuestion(parsed.question)
        setExamples(parsed.examples)
      } catch (e) {
        // Jeśli Claude dodał markdown ```json
        const match = content.match(/\{[\s\S]*\}/)
        const parsed = JSON.parse(match[0])
        setQuestion(parsed.question)
        setExamples(parsed.examples)
      }
  
      setCurrentExample(0)
      setUserAnswer('')
    } catch (error) {
      console.error('Błąd generowania:', error)
      alert('Błąd generowania pytania. Sprawdź konsolę.')
    } finally {
      setLoading(false)
    }
  }

  const checkAnswer = () => {
    const correct = examples[currentExample]
    
    if (userAnswer.trim() === correct.answer) {
      // Poprawna odpowiedź
      if (currentExample < examples.length - 1) {
        // Następny przykład
        setCurrentExample(currentExample + 1)
        setUserAnswer('')
      } else {
        // Koniec przykładów - następne zadanie
        if (currentTask < config.required_correct_tasks) {
          setCurrentTask(currentTask + 1)
          generateQuestion(selectedTopic)
        } else {
          // Sukces!
          finishSession(true)
        }
      }
    } else {
      // Błąd - restart
      alert('Błędna odpowiedź! Zaczynasz od początku.')
      finishSession(false)
    }
  }

  const finishSession = async (completed) => {
    await supabase
      .from('sessions')
      .update({ completed, completed_at: new Date().toISOString() })
      .eq('id', session.id)

    if (completed) {
      alert('Gratulacje! Ukończyłaś sesję!')
    }
    
    // Reset
    setSession(null)
    setCurrentTask(0)
    setSelectedTopic(null)
    loadInitialData()
  }

  if (!config) return <div>Ładowanie...</div>

  if (currentTask === 0) {
    // Wybór tematu
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={onLogout}>Wyloguj</button>
        <h2>Wybierz temat</h2>
        {availableTopics.length === 0 && <p>Wszystkie tematy zostały użyte. Odśwież stronę.</p>}
        <div style={{ display: 'grid', gap: '10px' }}>
          {availableTopics.map(topic => (
            <button 
              key={topic.id}
              onClick={() => startSession(topic.id)}
              style={{ padding: '15px', fontSize: '16px' }}
            >
              {topic.name}
            </button>
          ))}
        </div>
      </div>
    )
  }

  // Rozwiązywanie zadań
  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <strong>Zadanie {currentTask} / {config.required_correct_tasks}</strong>
        <br/>
        <strong>Przykład {currentExample + 1} / {config.examples_per_task}</strong>
      </div>

      {loading ? (
        <p>Generuję pytanie...</p>
      ) : (
        <>
          <div style={{ marginBottom: '20px', padding: '15px', background: '#f5f5f5' }}>
            <h3>{question}</h3>
            <p><strong>Przykład:</strong> {examples[currentExample]?.problem}</p>
          </div>

          <input 
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Twoja odpowiedź"
            style={{ width: '100%', padding: '10px', marginBottom: '10px', fontSize: '16px' }}
            onKeyPress={(e) => e.key === 'Enter' && checkAnswer()}
          />

          <button 
            onClick={checkAnswer}
            style={{ width: '100%', padding: '15px', fontSize: '18px' }}
          >
            Sprawdź
          </button>
        </>
      )}
    </div>
  )
}

export default StudentView