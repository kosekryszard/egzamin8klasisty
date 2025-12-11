import React from 'react'

function MathKeyboard({ onInput, onDelete, onClear }) {
  const buttons = [
    ['7', '8', '9', '/', '←'],
    ['4', '5', '6', '^', 'C'],
    ['1', '2', '3', '√', '∛'],
    ['0', '.', '-', '(', ')'],
    ['+', '=', 'x', ':', '✓']
  ]

  const handleClick = (value) => {
    if (value === '←') {
      onDelete()
    } else if (value === 'C') {
      onClear()
    } else if (value === '√') {
      onInput('sqrt(')
    } else if (value === '∛') {
      onInput('cbrt(')
    } else if (value === '°') {
      onInput('°')
    } else if (value === '✓') {
      return
    } else {
      onInput(value)
    }
  }

  return (
    <div style={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(5, 1fr)', 
      gap: '8px',
      marginTop: '15px',
      maxWidth: '400px',
      margin: '15px auto 0'
    }}>
      {buttons.flat().map((btn, idx) => (
        <button
          key={idx}
          onClick={() => handleClick(btn)}
          style={{
            padding: '15px',
            fontSize: '18px',
            fontWeight: 'bold',
            border: '2px solid #ddd',
            borderRadius: '8px',
            background: btn === '✓' ? '#4CAF50' : btn === 'C' || btn === '←' ? '#ff9800' : 'white',
            color: btn === '✓' || btn === 'C' || btn === '←' ? 'white' : 'black',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.2s'
          }}
          onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.95)'}
          onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          {btn}
        </button>
      ))}
    </div>
  )
}

export default MathKeyboard