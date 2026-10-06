import express from 'express';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Initialize Gemini Client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Helper for safe JSON parsing from LLM output
function safeJsonParse(text: string | undefined, fallback: any = {}) {
  if (!text) return fallback;
  try {
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    try {
      const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
      if (match) return JSON.parse(match[0]);
    } catch {}
    return fallback;
  }
}

// Helper for fallback if API key is not yet set or fails
function fallbackGeminiResponse(type: string, payload: any) {
  if (type === 'copilot') {
    return {
      reply: "Sugiero romper la rima continua con un verso quebrado para generar vacío lírico:",
      suggestedVerses: [
        "El mar desaprende su nombre",
        "frente a la piedra que no espera nada."
      ],
      metricInfo: "Endecasílabo con cesura (11 sílabas)",
      tonalAffinity: {
        score: "92.4%",
        poets: "Neruda & Cernuda"
      }
    };
  } else if (type === 'metaphors') {
    return {
      word: payload.word || "sombra tibia",
      suggestions: ["velo de cobre", "rescoldo fugaz", "marea dormida", "penumbra tibia"]
    };
  } else if (type === 'rhymes') {
    return {
      word: payload.word || "tibia",
      ending: "-ibia",
      rhymes: ["lascivia", "alivia", "anfibia", "alivia"]
    };
  } else if (type === 'continuation') {
    return {
      ghostText: "...despierta un río que olvidó su cauce"
    };
  } else if (type === 'sentiment') {
    return {
      calidez: 0.78,
      melancolia: 0.64,
      penumbra: 0.32,
      quietud: 0.88,
      moodName: "Ámbar Atardecer",
      debounce: "1.5s"
    };
  }
  return {};
}

// 1. Co-Pilot AI Chat / Guidance
app.post('/api/copilot', async (req, res) => {
  try {
    const { prompt, poemContext, selectedText, tone } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackGeminiResponse('copilot', req.body));
    }

    const systemInstruction = `Eres VerseScape Co-Piloto Poético, un asesor literario de alta sensibilidad para poesía en español.
Tu tono es reflexivo, elegante, sutil y erudito (estilística de Cernuda, Lorca, Borges, Paz, Storni).
Devuelve SIEMPRE una respuesta JSON estructurada con estas propiedades:
- "reply": Explicación breve o consejo sobre el ritmo, métrica o tono.
- "suggestedVerses": Un arreglo con 1 a 3 versos sugeridos para insertar.
- "metricInfo": Descripción breve de la métrica (ej. "Endecasílabo armónico en 2-6-10").
- "tonalAffinity": Un objeto { "score": "94.2%", "poets": "Lorca & Cernuda" }.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Contexto del poema:\n${poemContext || ''}\n\nTexto seleccionado: "${selectedText || ''}"\n\nPetición del usuario: ${prompt}\nTono deseado: ${tone || 'Melancólico y meditativo'}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeJsonParse(response.text, fallbackGeminiResponse('copilot', req.body));
    res.json(parsed);
  } catch (error: any) {
    console.error('Copilot API error:', error);
    res.json(fallbackGeminiResponse('copilot', req.body));
  }
});

// 2. Metaphor Alternatives
app.post('/api/metaphors', async (req, res) => {
  try {
    const { word, context } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackGeminiResponse('metaphors', req.body));
    }

    const systemInstruction = `Eres un motor de metáforas poéticas. Genera 4 alternativas poéticas innovadoras para la frase o palabra dada en español. Responde en JSON con la clave "suggestions" que contenga un arreglo de cadenas de texto.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Frase original: "${word}"\nContexto: "${context || ''}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeJsonParse(response.text, fallbackGeminiResponse('metaphors', req.body));
    res.json({
      word,
      suggestions: parsed.suggestions || ["velo de cobre", "rescoldo fugaz", "marea de humo", "penumbra tibia"]
    });
  } catch (error) {
    res.json(fallbackGeminiResponse('metaphors', req.body));
  }
});

// 3. Rhyme Suggestions
app.post('/api/rhymes', async (req, res) => {
  try {
    const { word } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackGeminiResponse('rhymes', req.body));
    }

    const systemInstruction = `Eres un diccionario de rimas poéticas. Genera rimas consonantes y asonantes en español para la palabra dada. Devuelve JSON con "ending" (terminación de la rima, ej. "-ibia") y "rhymes" (arreglo de 5 a 8 palabras).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Palabra a rimar: "${word}"`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeJsonParse(response.text, fallbackGeminiResponse('rhymes', req.body));
    res.json(parsed);
  } catch (error) {
    res.json(fallbackGeminiResponse('rhymes', req.body));
  }
});

// 4. Ghost Text Continuation (Tab to accept)
app.post('/api/continuation', async (req, res) => {
  try {
    const { poemText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackGeminiResponse('continuation', req.body));
    }

    const systemInstruction = `Eres un generador de versos fantasma en tiempo real para un poeta escribiendo.
Analiza los versos anteriores y proporciona exactamente UN verso siguiente (8 a 12 palabras) que continúe el ritmo y la métrica (preferentemente endecasílabo o alejandrino).
Devuelve un JSON con la propiedad "ghostText" (empezando con "..." si es continuación de línea o directamente el verso).`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Poema en progreso:\n${poemText}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeJsonParse(response.text, fallbackGeminiResponse('continuation', req.body));
    res.json(parsed);
  } catch (error) {
    res.json(fallbackGeminiResponse('continuation', req.body));
  }
});

// 5. Real-time Sentiment Analysis
app.post('/api/sentiment', async (req, res) => {
  try {
    const { poemText } = req.body;
    if (!process.env.GEMINI_API_KEY) {
      return res.json(fallbackGeminiResponse('sentiment', req.body));
    }

    const systemInstruction = `Analiza el espectro emocional y vectorial de este texto poético.
Devuelve un JSON con:
- "calidez": número entre 0.0 y 1.0
- "melancolia": número entre 0.0 y 1.0
- "penumbra": número entre 0.0 y 1.0
- "quietud": número entre 0.0 y 1.0
- "moodName": Etiqueta sugerida (ej. "Ámbar Atardecer", "Noche Índigo", "Niebla Sepia", "Alba Pálida")`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: `Texto:\n${poemText}`,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
      },
    });

    const parsed = safeJsonParse(response.text, fallbackGeminiResponse('sentiment', req.body));
    res.json(parsed);
  } catch (error) {
    res.json(fallbackGeminiResponse('sentiment', req.body));
  }
});

// Mount Vite Dev Server Middlewares or serve static dist
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { middlewareMode: true },
    appType: 'custom',
  });
  app.use(vite.middlewares);

  app.use('*', async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const indexHtmlPath = path.resolve(__dirname, 'index.html');
      let template = fs.readFileSync(indexHtmlPath, 'utf-8');
      template = await vite.transformIndexHtml(url, template);
      res.status(200).set({ 'Content-Type': 'text/html' }).end(template);
    } catch (e: any) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`VerseScape server running on http://localhost:${PORT}`);
});
