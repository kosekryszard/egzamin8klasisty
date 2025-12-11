import React from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

function MathDisplay({ text, block = false }) {
  if (!text) return null

  // Sprawdź czy tekst zawiera LaTeX
  const hasLatex = text.includes('\\frac') || text.includes('\\sqrt') || text.includes('^{') || text.includes('\\circ')
  
  if (hasLatex) {
    // Jeśli jest LaTeX, renderuj z KaTeX
    return (
      <span style={{ 
        display: 'inline-block', 
        wordWrap: 'break-word',
        whiteSpace: 'normal',
        maxWidth: '100%'
      }}>
        {block ? <BlockMath math={text} /> : <InlineMath math={text} />}
      </span>
    )
  }
  
  // Jeśli nie ma LaTeX, zwykły tekst ze stylami
  return (
    <span style={{ 
      wordWrap: 'break-word',
      overflowWrap: 'break-word',
      wordBreak: 'break-word',
      whiteSpace: 'normal',
      display: 'inline'
    }}>
      {text}
    </span>
  )
}

export default MathDisplay