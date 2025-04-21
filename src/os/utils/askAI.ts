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
    const place = timeMatch[1].trim();
    // Try WorldTimeAPI by area format or fallback to local time
    try {
      const t = await fetch(
        `http://worldtimeapi.org/api/timezone/${encodeURIComponent(place)}`
      ).then(r => r.json());
      return `Local time in ${place}: ${new Date(t.datetime).toLocaleTimeString()}.`;
    } catch {
      return `Local time: ${new Date().toLocaleTimeString()}.`;
    }
  }

  // 3. Quick facts via DuckDuckGo Instant Answer
  const ddg = await fetch(
    `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json`
  ).then(r => r.json());
  if (ddg.AbstractText) {
    return ddg.AbstractText;
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
    return `I'm sorry, I don't know.`;
  } catch {
    return `I'm sorry, something went wrong.`;
  }
}
