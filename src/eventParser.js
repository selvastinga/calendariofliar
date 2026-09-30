export function parseBorrarCommand(text) {
  const match = text.trim().match(/^\/borrar\s+(\d+)/i);
  if (!match) return { error: 'Usá: /borrar ID (el ID que te mostró /eventos)' };
  return { id: Number(match[1]) };
}
