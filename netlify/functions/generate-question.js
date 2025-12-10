exports.handler = async (event) => {
    const { topic_name, examples_count } = JSON.parse(event.body)
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: `Jesteś ekspertem od matematyki dla 8 klasy szkoły podstawowej w Polsce. 
  
  Wygeneruj jedno zadanie egzaminacyjne z tematu: ${topic_name}
  
  WAŻNE zasady:
  - Jeśli to równania/algebra - pytaj o ROZWIĄZANIE (wartość x), NIE o przepisanie równania
  - Przykłady powinny wymagać OBLICZEŃ, nie przepisywania
  - Odpowiedzi to LICZBY lub PROSTE WYRAŻENIA
  
  Zadanie powinno zawierać:
  1. Treść głównego pytania/polecenia
  2. ${examples_count} konkretnych przykładów do rozwiązania z odpowiedziami
  
  WAŻNE dla formatowania matematycznego:
  - Ułamki zapisuj w LaTeX: \\\\frac{1}{2}
  - Potęgi zapisuj w LaTeX: 2^{3}
  - Pierwiastki zapisuj w LaTeX: \\\\sqrt{9}
  - Stopnie zapisuj: 90^{\\\\circ}
  
  Format JSON:
  {
    "question": "treść głównego pytania - np. 'Rozwiąż równanie i podaj wartość x'",
    "examples": [
      {"problem": "3x + 7 = 22", "answer": "5"},
      {"problem": "2x - 4 = 10", "answer": "7"}
    ]
  }
  
  Odpowiedzi to WYNIKI OBLICZEŃ (liczby, ułamki w LaTeX).
  WAŻNE: Odpowiedz TYLKO JSONem.`
        }]
      })
    })
  
    const data = await response.json()
    let content = data.content[0].text
    
    try {
      const parsed = JSON.parse(content)
      return {
        statusCode: 200,
        body: JSON.stringify(parsed)
      }
    } catch (e) {
      const match = content.match(/\{[\s\S]*\}/)
      const parsed = JSON.parse(match[0])
      return {
        statusCode: 200,
        body: JSON.stringify(parsed)
      }
    }
  }