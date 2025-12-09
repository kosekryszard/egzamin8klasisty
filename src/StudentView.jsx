import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import MathDisplay from './MathDisplay.jsx'

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
        const { data: topic } = await supabase.from('topics').select('*').eq('id', topicId).single()

        const response = await fetch('/.netlify/functions/generate-question', {
          method: 'POST',
          body: JSON.stringify({
            topic_name: topic.name,
            examples_count: topic.examples_per_task || 5
          })
        })
  
      const data = await response.json()
      
      setQuestion(data.question)
      setExamples(data.examples)
      setCurrentExample(0)
      setUserAnswer('')
    } catch (error) {
      console.error('Błąd generowania:', error)
      alert('Błąd generowania pytania')
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
  <h3><MathDisplay text={question} /></h3>
  <p><strong>Przykład:</strong> <MathDisplay text={examples[currentExample]?.problem} /></p>
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