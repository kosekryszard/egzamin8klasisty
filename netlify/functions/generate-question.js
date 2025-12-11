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
        content: `Jesteś ekspertem od egzaminu ósmoklasisty z matematyki w Polsce.

TEMAT: ${topic_name}

ZASADY TWORZENIA ZADAŃ:
1. Zadania na poziomie rzeczywistego egzaminu ósmoklasisty
2. Wymagają myślenia i wieloetapowych obliczeń
3. Kontekst życiowy (zakupy, podróże, geometria praktyczna)
4. NIE twórz infantylnych zadań typu "oblicz 2+3"

FORMATY ODPOWIEDZI:
- Liczby całkowite: 15, 42
- Ułamki: zapisz w LaTeX jako \\\\frac{3}{4} (odpowiedź: \\\\frac{3}{4})
- Ułamki dziesiętne: 2.5, 3.75
- Godziny: w formacie 9:12 lub 14:30
- Jednostki: dołącz jednostkę jeśli potrzebna, np. "23m2" lub "15cm"
- Procent: jako liczba bez symbolu %, np. "15" dla 15%

PRZYKŁADY ZADAŃ RÓŻNYCH TYPÓW:

NWW/NWD:
"Autobus A odjeżdża co 12 minut, autobus B co 18 minut. Oba odjechały o 8:00. Kiedy ponownie odjadą jednocześnie?"
Odpowiedź: "8:36" (lub "8.36")

Geometria:
"Prostokątna działka ma wymiary 24m × 18m. Oblicz długość przekątnej (zaokrąglij do całości)."
Odpowiedź: "30"

Równania:
"Rozwiąż równanie: 3(x-4) = 2x + 5"
Odpowiedź: "17"

Procenty:
"Cena 2400zł obniżona o 15%. Ile wynosi nowa cena?"
Odpowiedź: "2040"

FORMATOWANIE MATEMATYCZNE:
- Ułamki: \\\\frac{3}{4}
- Potęgi: 2^{3}
- Pierwiastki: \\\\sqrt{16}
- Stopnie: 45^{\\\\circ}

Wygeneruj ${examples_count} przykładów podobnego poziomu.

Format JSON:
{
  "question": "Jasne polecenie co obliczyć",
  "examples": [
    {
      "problem": "Szczegółowy opis z danymi", 
      "answer": "wynik_w_odpowiednim_formacie"
    }
  ]
}

KRYTYCZNE: Odpowiedzi muszą być w PROSTYM formacie który uczeń może wpisać na klawiaturze.
Dla godzin używaj formatu HH:MM (np. 9:12, 14:30).
Dla ułamków używaj LaTeX tylko jeśli nie da się podać jako dziesiętny.

Odpowiedz TYLKO JSONem.`
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