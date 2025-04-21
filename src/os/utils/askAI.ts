// Utility to route queries to free public APIs or HF fallback
export async function askAI(q: string): Promise<string> {
  // 0. Chatty control intents
  const lower = q.toLowerCase().trim();
  if (/^(hi|hello|hey)\b/.test(lower)) {
    return 'Hello there! How can I assist you today?';
  }
  if (/thank(s| you)/i.test(q)) {
    return 'My pleasure!';
  }
  if (/\b(retry|try again)\b/i.test(lower)) {
    return 'Sure—what would you like me to retry?';
  }
  if (/help|what can you do/i.test(lower)) {
    return 'I can provide weather, time, definitions, sports updates, Wikipedia summaries, jokes, quotes, and more.';
  }
  if (/\b(joke)\b/i.test(lower)) {
    try {
      const j: any = await fetch('https://official-joke-api.appspot.com/jokes/random').then(r => r.json());
      return `${j.setup} — ${j.punchline}`;
    } catch {
    }
    return 'Sorry, I don’t have a joke right now.';
  }
  if (/\b(quote|inspire me)\b/i.test(lower)) {
    try {
      const qd: any = await fetch('https://api.quotable.io/random').then(r => r.json());
      return `${qd.content} —${qd.author}`;
    } catch {
    }
    return 'Sorry, I can’t fetch a quote right now.';
  }

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
  const timeMatch = q.match(/time\s+(?:is\s+it\s+)?(?:in|at)\s+(.+)/i);
  if (timeMatch) {
    const placeRaw = timeMatch[1].trim().replace(/[?.!]+$/, '');
    try {
      const geo: any = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeRaw)}&format=json&limit=1`
      ).then(r => r.json());
      if (Array.isArray(geo) && geo.length > 0) {
        const { lat, lon } = geo[0];
        const wt: any = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
        ).then(r => r.json());
        // Fetch actual local time via WorldTimeAPI using timezone from Open-Meteo
        const tz = wt.timezone;
        try {
          const tt: any = await fetch(
            `http://worldtimeapi.org/api/timezone/${encodeURIComponent(tz)}`
          ).then(r => r.json());
          if (tt.datetime) {
            const dt = new Date(tt.datetime);
            const pretty = dt.toLocaleTimeString([], { hour: 'numeric', minute: 'numeric', hour12: true });
            return `It’s ${pretty} in ${placeRaw}.`;
          }
        } catch {}
        // Fallback: parse Open-Meteo timestamp
        const [datePart, timePart] = wt.current_weather.time.split('T');
        const [hh, mm] = timePart.split(':');
        const hourNum = parseInt(hh, 10);
        const period = hourNum >= 12 ? 'PM' : 'AM';
        const hour12 = hourNum % 12 || 12;
        return `It’s ${hour12}:${mm} ${period} in ${placeRaw}.`;
      }
    } catch {}
    // fallback to local time
    const fallbackTime = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: 'numeric', hour12: true });
    return `It’s ${fallbackTime} right now.`;
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

  // 3. Spelling and grammar (LanguageTool)
  const grammarMatch = q.match(/(?:check grammar of|grammar check) (.+)/i);
  if (grammarMatch) {
    const text = grammarMatch[1];
    try {
      const res: any = await fetch('https://api.languagetool.org/v2/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `language=en-US&text=${encodeURIComponent(text)}`
      }).then(r => r.json());
      if (res.matches?.length) {
        const suggestions = res.matches.map((m: any) =>
          `${text.substr(m.offset, m.length)} → ${m.replacements[0]?.value}`
        ).join('; ');
        return `Suggestions: ${suggestions}`;
      }
    } catch {}
    return 'No issues found in grammar or spelling.';
  }

  // 4. Math evaluation via Math.js
  const mathMatch = q.match(/what (?:is|'s) ([0-9+\-*/^()%.,\s]+)\?*$/i);
  if (mathMatch) {
    const expr = mathMatch[1];
    try {
      const result = await fetch(
        `https://api.mathjs.org/v4/?expr=${encodeURIComponent(expr)}`
      ).then(r => r.text());
      return `${expr.trim()} = ${result}`;
    } catch {}
  }

  // 5. Unit conversion (no key)
  const unitMatch = q.match(/convert\s+([\d.]+)\s*(km|kilometers|m|mi|miles|kg|kilograms|lbs|pounds|°c|c|°f|f)\s+to\s+(km|kilometers|m|mi|miles|kg|kilograms|lbs|pounds|°c|c|°f|f)/i);
  if (unitMatch) {
    const val = parseFloat(unitMatch[1]); const from = unitMatch[2].toLowerCase(); const to = unitMatch[3].toLowerCase(); let res;
    if ((/km|kilometers/.test(from))&&(/mi|miles/.test(to))) res = val/1.60934;
    else if ((/mi|miles/.test(from))&&(/km|kilometers/.test(to))) res = val*1.60934;
    else if ((/kg|kilograms/.test(from))&&(/lbs|pounds/.test(to))) res = val*2.20462;
    else if ((/lbs|pounds/.test(from))&&(/kg|kilograms/.test(to))) res = val/2.20462;
    else if ((/°?c/.test(from))&&(/°?f/.test(to))) res = val*9/5+32;
    else if ((/°?f/.test(from))&&(/°?c/.test(to))) res = (val-32)*5/9;
    else return `Cannot convert from ${from} to ${to}.`;
    return `${val} ${unitMatch[2]} = ${parseFloat(res.toFixed(4))} ${unitMatch[3]}`;
  }

  // 6. Currency conversion (no key)
  const currMatch = q.match(/convert\s+([\d.]+)\s+([A-Za-z]{3})\s+to\s+([A-Za-z]{3})/i);
  if (currMatch) {
    const amt = currMatch[1]; const fromC = currMatch[2].toUpperCase(); const toC = currMatch[3].toUpperCase();
    try {
      const cr: any = await fetch(
        `https://api.exchangerate.host/convert?from=${fromC}&to=${toC}&amount=${amt}`
      ).then(r=>r.json());
      if (cr.result!=null) return `${amt} ${fromC} = ${cr.result} ${toC}`;
    } catch {}
  }

  // 7. Number trivia & date facts (NumbersAPI)
  if (/random number fact/.test(q)) {
    try { return await fetch('http://numbersapi.com/random/trivia').then(r=>r.text()); } catch {}
  }
  const dateFact = q.match(/what happened on\s+([A-Za-z]+)\s+(\d{1,2})/i);
  if (dateFact) {
    const m = dateFact[1]; const d = dateFact[2];
    try { return await fetch(`http://numbersapi.com/${m}/${d}/date`).then(r=>r.text()); } catch {}
  }

  // 8. Date arithmetic
  const daysMatch = q.match(/how many days between\s+(.+)\s+and\s+(.+)\?/i);
  if (daysMatch) {
    const d1 = new Date(daysMatch[1]); const d2 = new Date(daysMatch[2]);
    if (!isNaN(d1.getTime()) && !isNaN(d2.getTime())) {
      const diff = Math.abs(d2.getTime()-d1.getTime());
      const days = Math.round(diff/(1000*60*60*24));
      return `${days} days between ${d1.toDateString()} and ${d2.toDateString()}.`;
    }
  }

  // 9. Text transforms: base64, rot13, reverse
  const b64e = q.match(/base64 encode (.+)/i);
  if (b64e) return btoa(b64e[1]);
  const b64d = q.match(/base64 decode (.+)/i);
  if (b64d) try { return atob(b64d[1]); } catch {}
  const rot = q.match(/rot13 (.+)/i);
  if (rot) {
    return rot[1].replace(/[A-Za-z]/g, (c: string) => {
      const code = c.charCodeAt(0);
      const base = code >= 97 ? 97 : 65;
      return String.fromCharCode(((code - base + 13) % 26) + base);
    });
  }
  const rev = q.match(/reverse text (.+)/i);
  if (rev) return rev[1].split('').reverse().join('');

  // 11. Translation: "how do you say X in Y"
  const translateMatch = q.match(/how (?:do you )?say ['"]?(.+?)['"]? in ([A-Za-z]+)\??/i);
  if (translateMatch) {
    const [, textToTranslate, langName] = translateMatch;
    const lang = langName.toLowerCase();
    const codeMap: Record<string,string> = { french:'fr', spanish:'es', german:'de', italian:'it', portuguese:'pt' };
    const target = codeMap[lang] || lang.slice(0,2);
    try {
      const tr: any = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${target}`
      ).then(r => r.json());
      const out = tr.responseData.translatedText;
      return `"${textToTranslate}" in ${langName} is "${out}"`;
    } catch {}
  }
  // 12. Translation: "translate X to Y"
  const translate2 = q.match(/translate\s+['"]?(.+?)['"]?\s+(?:in|to)\s+([A-Za-z]+)\??/i);
  if (translate2) {
    const [, textToTranslate, langName] = translate2;
    const lang = langName.toLowerCase();
    const codeMap: Record<string,string> = { french:'fr', spanish:'es', german:'de', italian:'it', portuguese:'pt' };
    const target = codeMap[lang] || lang.slice(0,2);
    try {
      const tr: any = await fetch(
        `https://api.mymemory.translated.net/get?q=${encodeURIComponent(textToTranslate)}&langpair=en|${target}`
      ).then(r => r.json());
      const out = tr.responseData.translatedText;
      return `"${textToTranslate}" in ${langName} is "${out}"`;
    } catch {}
  }

  // 13. Current US President (Wiki)
  const presMatch = q.match(/who is (?:the )?current (?:us )?president\??/i);
  if (presMatch) {
    try {
      const sum: any = await fetch(
        'https://en.wikipedia.org/api/rest_v1/page/summary/President_of_the_United_States'
      ).then(r => r.json());
      if (sum.extract) {
        const sentences = sum.extract.split('. ');
        const line = sentences.find((s: string) => /current officeholder is/i.test(s));
        if (line) {
          return line.replace(/.*is/i, 'The current President is') + '.';
        }
        return sentences[1] + '.';
      }
    } catch {}
  }

  // 5. Wikipedia concise summary via REST API
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

  // 6. Fallback via OpenRouter
  const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const openrouterModel = import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.0-flash-thinking-exp-1219:free';
  if (openrouterKey) {
    try {
      const or: any = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: openrouterModel, messages: [{ role: 'user', content: q }] }),
      }).then(r => r.json());
      const msg = or.choices?.[0]?.message?.content;
      if (msg) return msg;
    } catch {}
  }
  return `I'm sorry, I don't have an answer for that.`;
}
