// Formato esperado: /evento Titulo | DD/MM/AAAA HH:MM | Lugar | Descripcion
// Lugar y Descripcion son opcionales. La hora es opcional (por defecto 09:00).
const FECHA_REGEX = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/;

export function parseFechaHora(texto) {
  const match = texto.trim().match(FECHA_REGEX);
  if (!match) return null;

  const [, dia, mes, anio, hora = '9', min = '00'] = match;
  const fecha = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
    Number(hora),
    Number(min),
    0,
    0
  );

  if (Number.isNaN(fecha.getTime())) return null;
  return fecha;
}

export function parseEventoCommand(text) {
  const body = text.trim().replace(/^\/evento\s+/i, '');
  const partes = body.split('|').map((p) => p.trim());
  const [title, fechaTexto, location, description] = partes;

  if (!title) {
    return { error: 'Falta el título del evento.' };
  }
  if (!fechaTexto) {
    return { error: 'Falta la fecha. Formato: DD/MM/AAAA HH:MM' };
  }

  const fecha = parseFechaHora(fechaTexto);
  if (!fecha) {
    return { error: 'No entendí la fecha. Usá el formato DD/MM/AAAA HH:MM (ej: 15/10/2026 18:00).' };
  }

  return {
    title,
    eventDate: fecha.toISOString(),
    location: location || null,
    description: description || null,
  };
}

export function parseBorrarCommand(text) {
  const match = text.trim().match(/^\/borrar\s+(\d+)/i);
  if (!match) return { error: 'Usá: /borrar ID (el ID que te mostró /eventos)' };
  return { id: Number(match[1]) };
}
