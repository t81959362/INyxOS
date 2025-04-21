// Utility to route queries to free public APIs or HF fallback
export async function askAI(q: string): Promise<string> {
  // 1. Weather intent: "weather in <city>"
  const weatherMatch = q.match(/weather in (.+)/i);
  if (weatherMatch) {
    const city = weatherMatch[1];
    // Geocode via Nominatim
    const loc = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json`
    ).then(r => r.json());
    if (loc && loc.length > 0) {
      const { lat, lon } = loc[0];
      const w = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
      ).then(r => r.json());
      const cw = w.current_weather;
      return `Current in ${city}: ${cw.temperature}°C, wind ${cw.windspeed} km/h.`;
    }
    return `Sorry, I couldn't find location "${city}".`;
  }

  // 2. Time intent: "time in <place>"
  const timeMatch = q.match(/time in (.+)/i);
  if (timeMatch) {
    // Strip trailing punctuation and map common names
    let place = timeMatch[1].trim().replace(/[?.!]+$/, '');
    const timezoneMap: Record<string, string> = {
      uk: 'Europe/London',
      'the uk': 'Europe/London',
      'united kingdom': 'Europe/London'
    };
    const zone = timezoneMap[place.toLowerCase()] || place;
    try {
      const t = await fetch(
        `http://worldtimeapi.org/api/timezone/${encodeURIComponent(zone)}`
      ).then(r => r.json());
      return `Local time in ${place}: ${new Date(t.datetime).toLocaleTimeString()}.`;
    } catch {
      return `Local time: ${new Date().toLocaleTimeString()}.`;
    }
  }

  // Dictionary definitions & thesaurus via dictionaryapi.dev
  const defineMatch = q.match(/^define (.+)/i);
  if (defineMatch) {
    const word = defineMatch[1];
    try {
      const dictRes: any = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        .then(r => r.json());
      if (Array.isArray(dictRes) && dictRes[0].meanings?.length) {
        const def = dictRes[0].meanings[0].definitions[0].definition;
        return `Definition of ${word}: ${def}`;
      }
    } catch {}
    return `Sorry, no definition found for "${word}".`;
  }
  const synonymMatch = q.match(/(?:synonyms? of|thesaurus) (.+)/i);
  if (synonymMatch) {
    const word = synonymMatch[1];
    try {
      const dictRes: any = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`)
        .then(r => r.json());
      const synonyms = dictRes[0]?.meanings?.[0]?.definitions?.[0]?.synonyms;
      if (synonyms?.length) {
        return `Synonyms of ${word}: ${synonyms.join(', ')}`;
      }
    } catch {}
    return `Sorry, no synonyms found for "${word}".`;
  }

  // 3. Quick facts via DuckDuckGo Instant Answer
  const ddg = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`
  ).then(r => r.json());
  if (ddg.AbstractText) {
    return ddg.AbstractText;
  }

  // Wikipedia summary via REST API
  try {
    const page: any = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`)
      .then(r => r.json());
    if (page.extract) {
      return page.extract;
    }
  } catch {}
  // Sports next match via TheSportsDB (Premier League id=4328)
  if (/next match/i.test(q)) {
    try {
      const sports: any = await fetch(
        'https://www.thesportsdb.com/api/v1/json/1/eventsnextleague.php?id=4328'
      ).then(r => r.json());
      const ev = sports.events?.[0];
      if (ev) {
        return `Next match: ${ev.strEvent} on ${ev.dateEvent} at ${ev.strTime}.`;
      }
    } catch {}
  }

  // 4. Fallback to Hugging Face Inference API
  try {
    const resp = await fetch(
      'https://api-inference.huggingface.co/models/google/flan-t5-small',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_HF_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ inputs: q }),
      }
    ).then(r => r.json());
    if (Array.isArray(resp) && resp[0].generated_text) {
      return resp[0].generated_text;
    }
    return `I'm sorry, I don't know the answer you are looking for.`;
  } catch {
    return `I'm sorry, something went wrong.`;
  }
}
