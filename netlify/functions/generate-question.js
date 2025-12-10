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
        content: `Jesteś ekspertem od egzaminu ósmoklasisty z matematyki w Polsce. Twoje zadania MUSZĄ być na poziomie rzeczywistego egzaminu.

TEMAT: ${topic_name}

WYMAGANIA:
1. Zadania muszą być REALISTYCZNE - takie jak na prawdziwym egzaminie
2. Nie twórz infantylnych zadań typu "oblicz 15" czy "podaj wynik 2+3"
3. Zadania powinny wymagać MYŚLENIA i wieloetapowych obliczeń
4. Używaj kontekstu rzeczywistych sytuacji (zakupy, budowa, podróże, geometria praktyczna)
5. Dla geometrii - opisuj figury z konkretnymi wymiarami
6. Dla równań - niech będą wieloetapowe z niewiadomą po obu stronach
7. Dla procentów - zadania z życia (VAT, rabaty, odsetki)
8. Dla prawdopodobieństwa - realne scenariusze z wieloma możliwościami

PRZYKŁADY DOBRYCH ZADAŃ:

Równania:
- "Rozwiąż równanie: 3(x-4) + 5 = 2x + 7"
- "W pudełku jest x cukierków. Ania zjadła 1/3, potem Bartek 5 sztuk. Zostało 13. Ile było na początku?"

Geometria:
- "Prostokątna działka ma wymiary 24m × 18m. Oblicz długość przekątnej."
- "W graniastosłupie prawidłowym czworokątnym krawędź podstawy wynosi 6cm, wysokość 10cm. Oblicz pole powierzchni całkowitej."

Procenty:
- "Telewizor kosztował 2400zł. Po obniżce o 15% i podwyżce o 10% wynosi teraz X. Oblicz X."

FORMATOWANIE:
- Ułamki: \\\\frac{3}{4}
- Potęgi: 2^{3}
- Pierwiastki: \\\\sqrt{16}
- Stopnie: 45^{\\\\circ}

Wygeneruj ${examples_count} przykładów podobnego poziomu trudności.

Format JSON:
{
  "question": "Precyzyjne polecenie co uczeń ma obliczyć",
  "examples": [
    {"problem": "Szczegółowy opis zadania z danymi", "answer": "wynik_liczbowy_lub_uproszczone_wyrażenie"}
  ]
}

ODPOWIEDZI to TYLKO FINALNE WYNIKI (liczby, ułamki w LaTeX, uproszczone wyrażenia).

Odpowiedz TYLKO JSONem, bez żadnego tekstu poza JSONem.`
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