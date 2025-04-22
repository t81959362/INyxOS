// Utility to route queries to free public APIs or HF fallback
let lastIntent: 'weather' | 'time' | 'image' | null = null;
// store last location for follow-up queries
let lastLocation: string | null = null;
import { addEvent, getEvents } from './calendar';

export async function askAI(q: string): Promise<string> {
  q = q.trim();
  // normalize: strip surrounding quotes (including curly)
  q = q.replace(/^[“”"'`]+|[“”"'`]+$/g, '').trim();

  // 0.x Image intent: match and capture term for image/picture/photo queries
  // Supports verbs: show/give/get/display and nouns: image(s), picture(s), photo(s), pic(s)
  let imageMatch = q.match(/(?:show|give|get|display)(?: me)? (?:an|some)? (?:images?|pictures?|photos?|pics?)(?: of)? (.+)/i);
  if (!imageMatch) {
    const alt = q.match(/^(.+?) (?:images?|pictures?|photos?|pics?)$/i);
    if (alt) imageMatch = alt;
  }
  if (imageMatch) {
    const term = imageMatch[1].trim();
    try {
      const summary: any = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}`
      ).then(r => r.json());
      const original = summary.originalimage?.source;
      const thumbnail = summary.thumbnail?.source;
      let imgUrl = original || thumbnail;
      if (!original && thumbnail) {
        const m = thumbnail.match(/^(https:\/\/upload\.wikimedia\.org\/wikipedia\/commons)\/thumb\/(.+?)\/\d+px-.*$/);
        if (m) imgUrl = `${m[1]}/${m[2]}`;
      }
      if (imgUrl) {
        lastIntent = 'image';
        return imgUrl;
      }
    } catch {} 
    // Fallback to Pexels if Wikipedia yields no image
    const pexelsKey = import.meta.env.REACT_APP_PEXELS_API_KEY || import.meta.env.VITE_PEXELS_API_KEY;
    if (pexelsKey) {
      try {
        const pexelsRes: any = await fetch(
          `https://api.pexels.com/v1/search?query=${encodeURIComponent(term)}&per_page=1`,
          { headers: { Authorization: pexelsKey } }
        ).then(r => r.json());
        const photo = pexelsRes.photos?.[0];
        const url = photo?.src?.original || photo?.src?.large;
        if (url) {
          lastIntent = 'image';
          return url;
        }
      } catch {}
    }
    return `Sorry, I couldn't find an image for "${term}".`;
  }

  // 0.3 Pronoun resolution for weather: use lastLocation
  if (/weather/i.test(q) && /\b(there|here|it)\b/i.test(q) && lastLocation) {
    const city = lastLocation;
    try {
      const geo: any = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(city)}&format=json&limit=1`
      ).then(r => r.json());
      if (Array.isArray(geo) && geo.length > 0) {
        const { lat, lon } = geo[0];
        const w: any = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
        ).then(r => r.json());
        const cw = w.current_weather;
        lastIntent = 'weather';
        return `Current in ${city}: ${cw.temperature}°C, wind ${cw.windspeed} km/h.`;
      }
    } catch {}
    return `Sorry, I couldn't find location "${city}".`;
  }
  // 0.4 Pronoun resolution for time: use lastLocation
  if (/time/i.test(q) && /\b(there|here|it)\b/i.test(q) && lastLocation) {
    const place = lastLocation;
    try {
      const geo: any = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json&limit=1`
      ).then(r => r.json());
      if (Array.isArray(geo) && geo.length > 0) {
        const { lat, lon } = geo[0];
        const wt: any = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
        ).then(r => r.json());
        const tz = wt.timezone;
        const dt = new Date().toLocaleTimeString([], { hour: 'numeric', hour12: true, timeZone: tz });
        lastIntent = 'time';
        return `It’s ${dt} in ${place}.`;
      }
    } catch {}
    return `Sorry, I couldn't determine time for "${place}".`;
  }

  // 0.5 Follow-up: if user just replies with a location and previous intent was weather/time
  if (!q.includes(' ') && /^[A-Za-z\s]+$/.test(q) && lastIntent) {
    const locQuery = q;
    if (lastIntent === 'weather') {
      // replicate weather logic using locQuery
      try {
        const geo: any = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=1`
        ).then(r => r.json());
        if (Array.isArray(geo) && geo.length > 0) {
          const { lat, lon } = geo[0];
          const w: any = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`
          ).then(r => r.json());
          const cw = w.current_weather;
          lastIntent = 'weather';
          lastLocation = locQuery;
          return `Current in ${locQuery}: ${cw.temperature}°C, wind ${cw.windspeed} km/h.`;
        }
      } catch {}
      return `Sorry, I couldn't find location "${locQuery}".`;
    }
    if (lastIntent === 'time') {
      // replicate time logic using locQuery
      try {
        const geo: any = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(locQuery)}&format=json&limit=1`
        ).then(r => r.json());
        if (Array.isArray(geo) && geo.length > 0) {
          const { lat, lon } = geo[0];
          const wt: any = await fetch(
            `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
          ).then(r => r.json());
          const tz = wt.timezone;
          const dt = new Date().toLocaleTimeString([], { hour: 'numeric', hour12: true, timeZone: tz });
          lastIntent = 'time';
          lastLocation = locQuery;
          return `It’s ${dt} in ${locQuery}.`;
        }
      } catch {}
      return `Sorry, I couldn't determine time for "${locQuery}".`;
    }
  }

  // Calendar: add event via natural language
  const addMatch = q.match(/^add\s+['"](.+?)['"]/i);
  if (addMatch) {
    const ev = addEvent(q);
    window.dispatchEvent(new CustomEvent('os-notification', { detail: { title: 'Calendar', message: `${ev.title} @ ${new Date(ev.datetime).toLocaleString()}` } }));
    return `✔️ Added "${addMatch[1]}" on ${new Date(ev.datetime).toLocaleDateString()} at ${new Date(ev.datetime).toLocaleTimeString()}`;
  }
  // Calendar: list events due this week
  if (/what(?:'s| is) due (?:this|) week\?/i.test(q)) {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const start = new Date(now.setDate(diff)); start.setHours(0,0,0,0);
    const end = new Date(start); end.setDate(start.getDate() + 6);
    const eventsList = getEvents(start, end);
    if (!eventsList.length) return 'No events this week.';
    return eventsList.map(e => `${new Date(e.datetime).toLocaleDateString()}: ${e.title}`).join('\n');
  }

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
    lastIntent = 'weather';
    lastLocation = city;
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
    lastIntent = 'time';
    lastLocation = placeRaw;
    try {
      const geo: any = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(placeRaw)}&format=json&limit=1`
      ).then(r => r.json());
      if (Array.isArray(geo) && geo.length > 0) {
        const { lat, lon } = geo[0];
        const wt: any = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
        ).then(r => r.json());
        const tz = wt.timezone;
        const dt = new Date().toLocaleTimeString([], { hour: 'numeric', hour12: true, timeZone: tz });
        return `It’s ${dt} in ${placeRaw}.`;
      }
    } catch {}
    const fallbackTime = new Date().toLocaleTimeString([], { hour: 'numeric', hour12: true });
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

  // Word definitions & synonyms
  const defineMatch2 = q.match(/define\s+(\w+)/i);
  if (defineMatch2) {
    const word = defineMatch2[1];
    try {
      const defRes: any = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${word}`)
        .then(r => r.json());
      const first = Array.isArray(defRes) ? defRes[0] : defRes;
      const defs = first.meanings.flatMap((m: any) => m.definitions.map((d: any) => d.definition));
      const syns = first.meanings.flatMap((m: any) => m.definitions.flatMap((d: any) => d.synonyms || []));
      return `Definition of ${word}: ${defs[0]}.` + (syns.length ? ` Synonyms: ${syns.slice(0,5).join(', ')}.` : '');
    } catch {}
  }
  // Bitcoin price
  if (/bitcoin price|btc price/i.test(q)) {
    try {
      const priceRes: any = await fetch('https://api.coindesk.com/v1/bpi/currentprice.json').then(r => r.json());
      const rate = priceRes.bpi.USD.rate;
      return `Bitcoin is currently trading at $${rate} USD.`;
    } catch {}
  }
  // Country info (capital, population, flag)
  const countryMatch2 = q.match(/(capital|population|flag) of (.+)/i);
  if (countryMatch2) {
    const field = countryMatch2[1].toLowerCase();
    const countryName = countryMatch2[2];
    try {
      const cRes: any = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(countryName)}?fullText=true`).then(r => r.json());
      const c = cRes[0];
      if (field === 'capital') return `${c.name.common}'s capital is ${c.capital?.[0]}.`;
      if (field === 'population') return `${c.name.common} has a population of ${c.population.toLocaleString()}.`;
      if (field === 'flag') return `Flag of ${c.name.common}: ${c.flags.png}`;
    } catch {}
  }
  // Geocoding: where is place
  const geoMatch2 = q.match(/where is (.+)/i);
  if (geoMatch2) {
    try {
      const place = geoMatch2[1];
      const geoRes: any = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(place)}&format=json`).then(r => r.json());
      if (geoRes.length) {
        const p = geoRes[0];
        return `${p.display_name} (lat: ${p.lat}, lon: ${p.lon})`;
      }
    } catch {}
  }
  // Pokémon lookup
  const pokeMatch2 = q.match(/tell me about (.+)/i);
  if (pokeMatch2) {
    const name = pokeMatch2[1].toLowerCase();
    try {
      const poke: any = await fetch(`https://pokeapi.co/api/v2/pokemon/${name}`).then(r => r.json());
      const types = poke.types.map((t: any) => t.type.name).join(', ');
      const abilities = poke.abilities.map((a: any) => a.ability.name).join(', ');
      return `${poke.name.charAt(0).toUpperCase()+poke.name.slice(1)} (#${poke.id}) is a ${types} type Pokémon. Abilities: ${abilities}.`;
    } catch {}
  }

  // Image intent: "show me an image of X" or "picture of X"
  const imageOf = q.match(/^(?:show me an? (?:image|picture) of |(?:image|picture) of )(.+)/i);
  if (imageOf) {
    const title = imageOf[1].trim();
    try {
      const page: any = await fetch(
        `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
      ).then(r => r.json());
      const imgUrl = page.originalimage?.source || page.thumbnail?.source;
      if (imgUrl) return imgUrl;
    } catch {}
    return `Sorry, I couldn't find an image for ${title}.`;
  }

  // 5. Wikipedia concise summary via REST API
  try {
    const page: any = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(q)}`)
      .then(r => r.json());
    if (page.extract) {
      const sentences = page.extract.split('. ');
      const summary = sentences[0] + '.';
      // include thumbnail if available for preview
      if (page.thumbnail?.source) {
        return `${summary} ${page.thumbnail.source}`;
      }
      return summary;
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

  // Direct Thinking Model: "flash thinking <question>" or "thinking model <question>"
  const thinkingMatch = q.match(/^(?:flash thinking|thinking model)\s+([\s\S]+)/i);
  if (thinkingMatch) {
    const prompt = thinkingMatch[1];
    const key = import.meta.env.VITE_OPENROUTER_API_KEY;
    if (key) {
      try {
        const thought: any = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-thinking-exp-1219:free',
            messages: [{ role: 'user', content: prompt }],
          }),
        }).then(r => r.json());
        const cm = thought.choices?.[0]?.message?.content;
        if (cm) return cm;
      } catch {}
    }
  }

  // Inline override for OpenRouter model: "use model <model> <question>"
  let inlineMatch = q.match(/^(?:use|set) model\s+(\S+)\s+([\s\S]+)/i);
  let finalQuery = q;
  let inlineModel: string | undefined;
  if (inlineMatch) {
    inlineModel = inlineMatch[1];
    finalQuery = inlineMatch[2];
  }

  // External API handlers
  // 1a. Random dog picture
  if (/random dog|dog picture/i.test(q)) {
    try {
      const d: any = await fetch('https://dog.ceo/api/breeds/image/random').then(r => r.json());
      return d.message;
    } catch {}
    return "Sorry, I couldn't fetch a dog picture.";
  }
  // 1b. Bitcoin price
  if (/bitcoin price|btc price|btc ticker/i.test(q)) {
    try {
      const g: any = await fetch('https://api.gemini.com/v2/ticker/btcusd').then(r => r.json());
      return `BTC last price: ${g.last} USD`;
    } catch {}
    return "Sorry, I couldn't fetch BTC price.";
  }
  // 1c. Recipe search
  const recipeMatch = q.match(/recipe for (.+)/i);
  if (recipeMatch) {
    const term = recipeMatch[1].trim();
    const key = import.meta.env.VITE_SPOONACULAR_KEY;
    if (!key) return 'Spoonacular API key not configured.';
    try {
      const s: any = await fetch(
        `https://api.spoonacular.com/recipes/complexSearch?query=${encodeURIComponent(term)}&apiKey=${key}`
      ).then(r => r.json());
      const title = s.results?.[0]?.title;
      return title ? `Top recipe: ${title}` : 'No recipes found.';
    } catch {}
    return "Sorry, I couldn't fetch recipes.";
  }
  // 1d. Random cat fact
  if (/cat fact/i.test(q)) {
    try {
      const c: any = await fetch('https://cat-fact.herokuapp.com/facts/random').then(r => r.json());
      return c.text || c.fact || JSON.stringify(c);
    } catch {}
    return "Sorry, I couldn't fetch a cat fact.";
  }
  // 1e. senseBox data from openSenseMap
  if (/sensebox|open sensebox|weather station/i.test(q)) {
    try {
      const os: any = await fetch(
        'https://api.opensensemap.org/boxes/57000b8745fd40c8196ad04c?format=json'
      ).then(r => r.json());
      return `senseBox: ${os.name}, sensors: ${os.sensors.length}`;
    } catch {}
    return "Sorry, I couldn't fetch senseBox data.";
  }
  // 1f. NASA NEO browse
  if (/near earth objects|nasa neo/i.test(q)) {
    try {
      const n: any = await fetch(
        'https://api.nasa.gov/neo/rest/v1/neo/browse?api_key=DEMO_KEY'
      ).then(r => r.json());
      const first = n.near_earth_objects?.[0];
      return first
        ? `1st NEO: ${first.name}, hazardous: ${first.is_potentially_hazardous_asteroid}`
        : 'No NEO data.';
    } catch {}
    return "Sorry, I couldn't fetch NEO data.";
  }
  // 1g. Wayback Machine availability
  if (/wayback machine|archive available/i.test(q)) {
    try {
      const w: any = await fetch(
        'https://archive.org/wayback/available?url=google.com'
      ).then(r => r.json());
      const cs = w.archived_snapshots?.closest;
      return cs?.available
        ? `Snapshot at ${cs.timestamp}`
        : 'No snapshot available.';
    } catch {}
    return "Sorry, I couldn't check Wayback availability.";
  }
  // 1h. MusicBrainz artist lookup
  if (/musicbrainz artist/i.test(q)) {
    try {
      const m: any = await fetch(
        'http://musicbrainz.org/ws/2/artist/5b11f4ce-a62d-471e-81fc-a69a8278c7da?fmt=json'
      ).then(r => r.json());
      return `Artist: ${m.name}, info: ${m.disambiguation || 'n/a'}`;
    } catch {}
    return "Sorry, I couldn't fetch MusicBrainz data.";
  }
  // 1i. Openwhyd hot electro playlist
  if (/openwhyd|hot electro/i.test(q)) {
    try {
      const p: any = await fetch(
        'https://openwhyd.org/hot/electro?format=json'
      ).then(r => r.json());
      return p?.[0]?.title
        ? `Top track: ${p[0].title}`
        : 'No playlist data.';
    } catch {}
    return "Sorry, I couldn't fetch playlist data.";
  }
  // 1j. Archive.org metadata
  if (/archive\.org|archive metadata/i.test(q)) {
    try {
      const a: any = await fetch(
        'https://archive.org/metadata/TheAdventuresOfTomSawyer_201303'
      ).then(r => r.json());
      return a.metadata
        ? `Title: ${a.metadata.title}, creator: ${a.metadata.creator}`
        : 'No metadata.';
    } catch {}
    return "Sorry, I couldn't fetch archive metadata.";
  }
  // 1k. OMDB movie details (requires key)
  const movieMatch = q.match(/movie (.+)/i);
  if (movieMatch) {
    const term = movieMatch[1].trim();
    const omdbKey = import.meta.env.VITE_OMDB_KEY;
    if (!omdbKey) return 'OMDB API key not configured.';
    try {
      const o: any = await fetch(
        `https://www.omdbapi.com/?t=${encodeURIComponent(term)}&apikey=${omdbKey}`
      ).then(r => r.json());
      return o.Title
        ? `Movie: ${o.Title} (${o.Year}), IMDb: ${o.imdbRating}`
        : 'Movie not found.';
    } catch {}
    return "Sorry, I couldn't fetch movie data.";
  }

  // GitHub user lookup
  const ghMatch = q.match(/github user (\S+)/i);
  if (ghMatch) {
    try {
      const user: any = await fetch(`https://api.github.com/users/${ghMatch[1]}`).then(r => r.json());
      return `GitHub user ${user.login}: ${user.public_repos} repos, ${user.followers} followers.`;
    } catch {}
    return `Sorry, couldn't fetch GitHub user ${ghMatch[1]}.`;
  }

  // Open Library: search by title
  if (/open library (?:search|info) (.+)/i.test(q)) {
    const match = q.match(/open library (?:search|info) (.+)/i);
    if (match) {
      const title = match[1].trim();
      try {
        const res: any = await fetch(`https://openlibrary.org/search.json?title=${encodeURIComponent(title)}&limit=1`).then(r => r.json());
        const doc = res.docs?.[0];
        if (doc) {
          return `📚 ${doc.title} by ${doc.author_name?.[0] || 'unknown'} (${doc.first_publish_year})`;
        }
      } catch {}
    }
    return "Sorry, could not fetch from Open Library.";
  }

  // ExchangeRates: latest rates or currency conversion
  if (/exchange rate|currency convert/i.test(q)) {
    try {
      const rdata: any = await fetch('https://api.exchangerate.host/latest').then(r => r.json());
      const base = rdata.base;
      const rates = rdata.rates;
      const parts = q.match(/convert ([A-Za-z]{3}) to ([A-Za-z]{3})/i);
      if (parts) {
        const from = parts[1].toUpperCase(), to = parts[2].toUpperCase();
        const rate = rates[to] / rates[from];
        return `1 ${from} = ${rate.toFixed(4)} ${to}`;
      }
      return `Base: ${base}, 1 ${base} = ${rates['USD']} USD`;
    } catch {}
    return "Sorry, I couldn't fetch exchange rates.";
  }

  // SpaceX: latest launch
  if (/spacex.*latest launch/i.test(q)) {
    try {
      const s: any = await fetch('https://api.spacexdata.com/v4/launches/latest').then(r => r.json());
      return `🚀 ${s.name} on ${new Date(s.date_utc).toLocaleDateString()}`;
    } catch {}
    return "Sorry, I couldn't fetch SpaceX data.";
  }

  // TV Maze: show info
  const tvMatch = q.match(/tv show (\d+)/i);
  if (tvMatch) {
    try {
      const show: any = await fetch(`https://api.tvmaze.com/shows/${tvMatch[1]}`).then(r => r.json());
      return `TV Show: ${show.name} (${show.premiered}), Rating: ${show.rating?.average || 'n/a'}`;
    } catch {}
    return "Sorry, I couldn't fetch TV show info.";
  }

  // Open Food Facts: product barcode
  const foodMatch = q.match(/product (\d+)/i);
  if (foodMatch) {
    try {
      const fo: any = await fetch(`https://world.openfoodfacts.org/api/v0/product/${foodMatch[1]}.json`).then(r => r.json());
      const prod = fo.product;
      return `🧀 ${prod.product_name || prod.generic_name} by ${prod.brands}`;
    } catch {}
    return "Sorry, I couldn't fetch product info.";
  }

  // Public Holidays: country/year
  if (/public holiday/i.test(q)) {
    const phMatch = q.match(/public holidays? (?:in )?([A-Za-z]{2})(?: (\d{4}))?/i);
    const country = phMatch?.[1] || 'US';
    const year = phMatch?.[2] || new Date().getFullYear();
    try {
      const ph: any = await fetch(`https://date.nager.at/api/v3/PublicHolidays/${year}/${country.toUpperCase()}`).then(r => r.json());
      const sample = ph[0];
      return sample
        ? `First holiday: ${sample.localName} on ${sample.date}`
        : 'No holidays found.';
    } catch {}
    return "Sorry, I couldn't fetch public holidays.";
  }

  // 6. Fallback via OpenRouter
  const openrouterKey = import.meta.env.VITE_OPENROUTER_API_KEY;
  const openrouterModel = inlineModel || import.meta.env.VITE_OPENROUTER_MODEL || 'google/gemini-2.5-pro-exp-03-25:free';
  if (openrouterKey) {
    try {
      const or: any = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${openrouterKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ model: openrouterModel, messages: [{ role: 'user', content: finalQuery }] }),
      }).then(r => r.json());
      const msg = or.choices?.[0]?.message?.content;
      if (msg) {
        // Remove markdown bold
        const cleaned = msg.replace(/\*\*(.+?)\*\*/g, '$1');
        return cleaned;
      }
    } catch {}
  }
  return `I'm sorry, I don't have an answer for that.`;
}
