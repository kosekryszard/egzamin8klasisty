import React from 'react'
import 'katex/dist/katex.min.css'
import { InlineMath, BlockMath } from 'react-katex'

function MathDisplay({ text, block = false }) {
  // Wykryj czy tekst zawiera LaTeX (zaczyna się od $ lub $$)
  if (text.includes('$$') || text.includes('$')) {
    // Claude może zwrócić LaTeX
    const cleanText = text.replace(/\$\$/g, '').replace(/\$/g, '')
    return block ? <BlockMath math={cleanText} /> : <InlineMath math={cleanText} />
  }
  
  // Lub przekształć prosty format na LaTeX
  let formatted = text
  
  // Ułamki: 1/2 → \frac{1}{2}
  formatted = formatted.replace(/(\d+)\/(\d+)/g, '\\frac{$1}{$2}')
  
  // Potęgi: 2^3 → 2^{3}
  formatted = formatted.replace(/(\d+)\^(\d+)/g, '$1^{$2}')
  
  // Pierwiastki: sqrt(9) → \sqrt{9}
  formatted = formatted.replace(/sqrt\((\d+)\)/g, '\\sqrt{$1}')
  
  // Stopnie: 90° lub 90 stopni → 90^{\circ}
  formatted = formatted.replace(/(\d+)°/g, '$1^{\\circ}')
  formatted = formatted.replace(/(\d+)\s*stopni/g, '$1^{\\circ}')
  
  return block ? <BlockMath math={formatted} /> : <InlineMath math={formatted} />
}

export default MathDisplay