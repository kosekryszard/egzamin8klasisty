import React, { useState } from 'react'
import AdminPanel from './AdminPanel.jsx'
import StudentView from './StudentView.jsx'

function App() {
  const [view, setView] = useState('login')
  const [password, setPassword] = useState('')

  const STUDENT_PASSWORD = 'uczen123'
  const ADMIN_PASSWORD = 'admin123'

  const handleLogin = () => {
    if (password === STUDENT_PASSWORD) {
      setView('student')
    } else if (password === ADMIN_PASSWORD) {
      setView('admin')
    } else {
      alert('Złe hasło')
    }
  }

  if (view === 'login') {
    return (
      <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto' }}>
        <h2>Trener Matematyczny</h2>
        <input 
          type="password" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Hasło"
          style={{ width: '100%', padding: '10px', marginBottom: '10px' }}
        />
        <button onClick={handleLogin} style={{ width: '100%', padding: '10px' }}>
          Zaloguj
        </button>
      </div>
    )
  }

  if (view === 'student') {
    return <StudentView onLogout={() => setView('login')} />
  }

  if (view === 'admin') {
    return <AdminPanel onLogout={() => setView('login')} />
  }
}

export default App