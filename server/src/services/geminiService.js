import "dotenv/config"; 

const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"; 

export async function generateMediaVerdict({ 
  title, 
  type = "movie", 
  genres = "", 
  year = "", 
  synopsis = "", 
}) { 
  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY; 
  if (!apiKey) { 
    const err = new Error("GEMINI_API_KEY is not configured"); 
    err.code = "MISSING_KEY"; 
    throw err; 
  } 

  const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite"; 
  const isPrintMedia = ["manga", "manhwa", "manhua", "book", "books"].includes( 
    String(type).toLowerCase() 
  ); 
  const mediumAction = isPrintMedia ? "read" : "watch"; 
  const mediumNoun = isPrintMedia ? "book/series" : "movie/series"; 

  const promptText = `You are a sharp, tasteful cultural critic providing a quick verdict for a ${mediumNoun}.
Title: ${title}
Type: ${type}
Year: ${year}
Genres: ${genres}
Synopsis: ${synopsis}

Analyze this title and generate an editorial quick verdict formatted strictly as JSON with this schema:
{
  "worthItHeadline": "Worth your time?",
  "verdict": "One punchy, elegant sentence capturing whether it's worth it and its core payoff.",
  "enjoyIf": "Specific tastes, themes, or tropes that will love this (e.g. You like puzzle-box mysteries...)",
  "skipIf": "Specific pacing, tropes, or flaws that might frustrate someone (e.g. You dislike cliffhangers...)",
  "experience": "What it actually feels like to ${mediumAction} (1-2 sentences on structure, atmosphere, and rhythm)",
  "keyNote": "One practical thing to know before diving in (e.g. pacing advice, viewing/reading order, tonal shift)"
}`; 

  const url = `${GEMINI_API_BASE}/${model}:generateContent?key=${apiKey}`; 
  const response = await fetch(url, { 
    method: "POST", 
    headers: { 
      "Content-Type": "application/json", 
    }, 
    body: JSON.stringify({ 
      contents: [ 
        { 
          role: "user", 
          parts: [{ text: promptText }], 
        }, 
      ], 
      generationConfig: { 
        responseMimeType: "application/json", 
        temperature: 0.7, 
      }, 
    }), 
  }); 

  if (!response.ok) { 
    const errBody = await response.text().catch(() => ""); 
    const error = new Error(`Gemini API error: ${response.status} ${response.statusText}`); 
    error.status = response.status; 
    error.details = errBody; 
    throw error; 
  } 

  const data = await response.json(); 
  const rawJson = data?.candidates?.[0]?.content?.parts?.[0]?.text; 
  if (!rawJson) { 
    throw new Error("No content received from Gemini model"); 
  } 

  const parsed = JSON.parse(rawJson); 
  return { 
    worthItHeadline: parsed.worthItHeadline || "Worth your time?", 
    verdict: parsed.verdict || "", 
    enjoyIf: parsed.enjoyIf || "", 
    skipIf: parsed.skipIf || "", 
    experience: parsed.experience || "", 
    keyNote: parsed.keyNote || "", 
  }; 
} 
