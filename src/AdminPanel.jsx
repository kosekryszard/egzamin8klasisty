import React, { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'

function AdminPanel({ onLogout }) {
  const [config, setConfig] = useState({ required_correct_tasks: 4, examples_per_task: 5 })
  const [topics, setTopics] = useState([])

  // Załaduj config i tematy
  useEffect(() => {
    loadConfig()
    loadTopics()
  }, [])

  const loadConfig = async () => {
    const { data } = await supabase.from('config').select('*').single()
    if (data) setConfig(data)
  }

  const loadTopics = async () => {
    const { data } = await supabase.from('topics').select('*').order('id')
    if (data) setTopics(data)
  }

  const saveConfig = async () => {
    await supabase.from('config').update(config).eq('id', 1)
    alert('Zapisano konfigurację')
  }

  const toggleTopic = async (topicId, currentActive) => {
    await supabase.from('topics').update({ active: !currentActive }).eq('id', topicId)
    loadTopics()
  }

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <button onClick={onLogout} style={{ marginBottom: '20px' }}>Wyloguj</button>
      
      <h2>Panel Admina</h2>

      <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #ddd' }}>
        <h3>Konfiguracja</h3>
        <label>
          Wymagana liczba poprawnych zadań:
          <input 
            type="number" 
            value={config.required_correct_tasks}
            onChange={(e) => setConfig({...config, required_correct_tasks: parseInt(e.target.value)})}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
        <br/><br/>
        <label>
          Przykładów na zadanie:
          <input 
            type="number" 
            value={config.examples_per_task}
            onChange={(e) => setConfig({...config, examples_per_task: parseInt(e.target.value)})}
            style={{ marginLeft: '10px', padding: '5px' }}
          />
        </label>
        <br/><br/>
        <button onClick={saveConfig} style={{ padding: '10px 20px' }}>Zapisz konfigurację</button>
      </div>

      <div style={{ padding: '15px', border: '1px solid #ddd' }}>
        <h3>Tematy (włącz/wyłącz)</h3>
        {topics.map(topic => (
          <div key={topic.id} style={{ marginBottom: '10px' }}>
            <label>
              <input 
                type="checkbox" 
                checked={topic.active}
                onChange={() => toggleTopic(topic.id, topic.active)}
              />
              <span style={{ marginLeft: '10px' }}>{topic.name}</span>
            </label>
          </div>
        ))}
      </div>
    </div>
  )
}

export default AdminPanel