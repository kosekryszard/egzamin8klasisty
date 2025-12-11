import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import MathDisplay from './MathDisplay.jsx'
import MathKeyboard from './MathKeyboard.jsx'

function StudentView({ onLogout }) {
  const [config, setConfig] = useState(null)
  const [allTopics, setAllTopics] = useState([])
  const [selectedTopics, setSelectedTopics] = useState([])
  const [session, setSession] = useState(null)
  const [currentTopicIndex, setCurrentTopicIndex] = useState(0)
  const [currentTask, setCurrentTask] = useState(0)
  const [question, setQuestion] = useState(null)
  const [examples, setExamples] = useState([])
  const [currentExample, setCurrentExample] = useState(0)
  const [userAnswer, setUserAnswer] = useState('')
  const [loading, setLoading] = useState(false)
  const [phase, setPhase] = useState('select') // 'select', 'solving'

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    const { data: cfg } = await supabase.from('config').select('*').single()
    setConfig(cfg)

    const { data: topics } = await supabase.from('topics').select('*').eq('active', true).order('id')
    setAllTopics(topics || [])
  }

  const toggleTopicSelection = (topicId) => {
    if (selectedTopics.includes(topicId)) {
      setSelectedTopics(selectedTopics.filter(id => id !== topicId))
    } else if (selectedTopics.length < 4) {
      setSelectedTopics([...selectedTopics, topicId])
    }
  }

  const startSession = async () => {
    if (selectedTopics.length !== 4) {
      alert('Wybierz dokładnie 4 działy!')
      return
    }

    const { data: newSession } = await supabase
      .from('sessions')
      .insert({})
      .select()
      .single()

    setSession(newSession)
    
    for (const topicId of selectedTopics) {
      await supabase.from('session_topics').insert({
        session_id: newSession.id,
        topic_id: topicId
      })
      await supabase.from('cycle_state').update({ used: true }).eq('topic_id', topicId)
    }

    setPhase('solving')
    setCurrentTopicIndex(0)
    setCurrentTask(1)
    await generateQuestion(selectedTopics[0])
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
    
    // Normalizuj obie odpowiedzi
    const normalizeAnswer = (answer) => {
      return answer
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')  // usuń spacje
        .replace(/[,:]/g, '.')  // zamień : i , na .
        .replace(/^0+/, '')  // usuń leading zeros
    }
    
    const userAnswerNorm = normalizeAnswer(userAnswer)
    const correctAnswerNorm = normalizeAnswer(correct.answer)
    
    // Sprawdź różne warianty
    const isCorrect = 
      userAnswerNorm === correctAnswerNorm ||
      userAnswer.trim() === correct.answer.trim() ||
      // Dla godzin: 9:12 = 9.12 = 912
      userAnswerNorm.replace(/[.:]/g, '') === correctAnswerNorm.replace(/[.:]/g, '')
    
    if (isCorrect) {
      if (currentExample < examples.length - 1) {
        setCurrentExample(currentExample + 1)
        setUserAnswer('')
      } else {
        if (currentTopicIndex < selectedTopics.length - 1) {
          setCurrentTopicIndex(currentTopicIndex + 1)
          setCurrentTask(currentTask + 1)
          generateQuestion(selectedTopics[currentTopicIndex + 1])
        } else {
          finishSession(true)
        }
      }
    } else {
      alert(`Błędna odpowiedź! Prawidłowa: ${correct.answer}\nZaczynasz od początku.`)
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
    setPhase('select')
    setSelectedTopics([])
    setCurrentTopicIndex(0)
    setCurrentTask(0)
    loadInitialData()
  }

  if (!config) return <div>Ładowanie...</div>

  if (phase === 'select') {
    return (
      <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
        <button onClick={onLogout} style={{ marginBottom: '20px' }}>Wyloguj</button>
        <h2>Wybierz 4 działy do ćwiczenia</h2>
        <p>Wybrano: {selectedTopics.length}/4</p>
        
        <div style={{ display: 'grid', gap: '10px', marginBottom: '20px' }}>
          {allTopics.map(topic => (
            <button 
              key={topic.id}
              onClick={() => toggleTopicSelection(topic.id)}
              style={{ 
                padding: '15px', 
                fontSize: '16px',
                background: selectedTopics.includes(topic.id) ? '#4CAF50' : 'white',
                color: selectedTopics.includes(topic.id) ? 'white' : 'black',
                border: '2px solid #ddd',
                borderRadius: '8px',
                cursor: 'pointer',
                textAlign: 'left'
              }}
            >
              {topic.name}
            </button>
          ))}
        </div>

        <button 
          onClick={startSession}
          disabled={selectedTopics.length !== 4}
          style={{ 
            width: '100%', 
            padding: '15px', 
            fontSize: '18px',
            background: selectedTopics.length === 4 ? '#4CAF50' : '#ccc',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: selectedTopics.length === 4 ? 'pointer' : 'not-allowed',
            fontWeight: 'bold'
          }}
        >
          Rozpocznij sesję
        </button>
      </div>
    )
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <div style={{ marginBottom: '20px' }}>
        <strong>Zadanie {currentTask} / 4</strong>
        <br/>
        <strong>Przykład {currentExample + 1} / {examples.length}</strong>
      </div>

      {loading ? (
        <p>Generuję pytanie...</p>
      ) : (
        <>
          <div style={{ 
            marginBottom: '20px', 
            padding: '15px', 
            background: '#f5f5f5',
            borderRadius: '8px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>
              <MathDisplay text={question} />
            </h3>
            <p style={{ fontSize: '16px' }}>
              <strong>Przykład:</strong> <MathDisplay text={examples[currentExample]?.problem} />
            </p>
          </div>

          <input 
            type="text"
            value={userAnswer}
            readOnly
            placeholder="Twoja odpowiedź"
            style={{ 
              width: '100%', 
              padding: '15px', 
              marginBottom: '10px', 
              fontSize: '20px',
              textAlign: 'center',
              border: '2px solid #ddd',
              borderRadius: '8px'
            }}
          />

          <MathKeyboard
            onInput={(value) => setUserAnswer(userAnswer + value)}
            onDelete={() => setUserAnswer(userAnswer.slice(0, -1))}
            onClear={() => setUserAnswer('')}
          />

          <button 
            onClick={checkAnswer}
            style={{ 
              width: '100%', 
              padding: '15px', 
              fontSize: '18px',
              marginTop: '15px',
              background: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: 'bold'
            }}
          >
            Sprawdź odpowiedź
          </button>
        </>
      )}
    </div>
  )
}

export default StudentView