const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-3.8-flash';
const UTC_OFFSET = process.env.UTC_OFFSET || '-03:00';
const PERSONAS = ['Ariel', 'Selva', 'Ema'];

// Fecha/hora actual en huso horario de Argentina, para resolver fechas relativas ("mañana", "el sábado").
function nowEnArgentina() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Argentina/Buenos_Aires' }));
}

function buildPrompt(texto) {
  const ahora = nowEnArgentina();
  const fechaHoy = ahora.toISOString().slice(0, 10);
  const diaSemana = ahora.toLocaleDateString('es-AR', { weekday: 'long' });

  return `Sos un asistente que extrae datos de eventos de calendario a partir de mensajes de WhatsApp en español rioplatense.
Hoy es ${diaSemana} ${fechaHoy} (huso horario Argentina, UTC-3).
Los integrantes de la familia son: ${PERSONAS.join(', ')}.
Interpretá el siguiente mensaje y devolvé SOLO un JSON con esta forma exacta, sin texto adicional ni markdown:
{"title": string, "date": "YYYY-MM-DD", "time": "HH:MM" o null, "location": string o null, "description": string o null, "person": "Ariel" | "Selva" | "Ema" | null, "error": string o null}

Reglas:
- Si el mensaje no describe un evento con fecha identificable, devolvé {"error": "no pude entender el evento"} y el resto de los campos en null.
- Si no menciona hora, "time" debe ser null.
- Resolvé fechas relativas ("mañana", "el sábado", "el 15") usando la fecha de hoy de arriba.
- "title" tiene que ser un resumen corto (máximo 60 caracteres) del evento.
- "description" solo si hay detalles extra que no entran en el título; si no, null.
- "person" solo si el mensaje menciona explícitamente que el evento es de Ariel, Selva o Ema (ej: "turno de Ema", "evento de Ariel"); si no se menciona a ninguno, dejalo en null.

Mensaje: "${texto}"`;
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Reintenta cuando Gemini está temporalmente saturado (503) o con límite de uso (429).
const REINTENTOS = 2;
const ESPERA_MS = 1500;

export async function parseEventoConIA(texto) {
  if (!GEMINI_API_KEY) {
    return { error: 'Falta configurar GEMINI_API_KEY en el servidor (ver README).' };
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;
  const body = JSON.stringify({
    contents: [{ parts: [{ text: buildPrompt(texto) }] }],
    generationConfig: { responseMimeType: 'application/json' },
  });

  let res;
  for (let intento = 0; intento <= REINTENTOS; intento++) {
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
      });
    } catch (err) {
      console.error('Error de red contactando a Gemini:', err);
      return { error: 'No se pudo contactar al servicio de IA.' };
    }

    if (res.ok) break;
    if ((res.status === 503 || res.status === 429) && intento < REINTENTOS) {
      console.warn(`Gemini respondió ${res.status}, reintentando (${intento + 1}/${REINTENTOS})...`);
      await sleep(ESPERA_MS);
      continue;
    }
    console.error('Error de Gemini:', res.status, await res.text());
    return {
      error:
        res.status === 503
          ? 'El servicio de IA está saturado en este momento, probá de nuevo en un minuto.'
          : 'El servicio de IA no respondió correctamente.',
    };
  }

  const data = await res.json();
  const textoRespuesta = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!textoRespuesta) return { error: 'La IA no devolvió una respuesta válida.' };

  let parsed;
  try {
    parsed = JSON.parse(textoRespuesta);
  } catch {
    return { error: 'La IA devolvió un formato inesperado.' };
  }

  if (parsed.error) return { error: parsed.error };
  if (!parsed.title || !parsed.date) {
    return { error: 'No pude identificar el título o la fecha del evento.' };
  }

  const hora = parsed.time || '09:00';
  const iso = `${parsed.date}T${hora}:00${UTC_OFFSET}`;
  const fecha = new Date(iso);
  if (Number.isNaN(fecha.getTime())) {
    return { error: 'La IA devolvió una fecha inválida.' };
  }

  return {
    title: parsed.title,
    eventDate: fecha.toISOString(),
    location: parsed.location || null,
    description: parsed.description || null,
    person: PERSONAS.includes(parsed.person) ? parsed.person : null,
  };
}
