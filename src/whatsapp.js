import { makeWASocket, useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';
import { insertEvent, listUpcomingEvents, deleteEvent } from './db.js';
import { parseEventoCommand, parseBorrarCommand } from './eventParser.js';

const logger = pino({ level: 'silent' });

const HELP_TEXT = `*Comandos disponibles*

📅 Cargar un evento:
/evento Título | DD/MM/AAAA HH:MM | Lugar | Descripción
(Lugar y Descripción son opcionales)
Ej: /evento Cumple de Juan | 15/10/2026 18:00 | Casa de la abuela

📋 Ver próximos eventos:
/eventos

🗑️ Borrar un evento:
/borrar ID

❓ Ver esta ayuda:
/ayuda`;

function formatEventoLine(ev) {
  const fecha = new Date(ev.event_date);
  const fechaTexto = fecha.toLocaleString('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
  const lugar = ev.location ? ` @ ${ev.location}` : '';
  return `#${ev.id} - ${ev.title} - ${fechaTexto}${lugar}`;
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

  const sock = makeWASocket({
    auth: state,
    logger,
    printQRInTerminal: false,
  });

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      console.log('\nEscaneá este código QR desde WhatsApp > Dispositivos vinculados:\n');
      qrcode.generate(qr, { small: true });
    }

    if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      console.log('Conexión cerrada.', statusCode, 'Reconectar:', shouldReconnect);
      if (shouldReconnect) startWhatsApp();
    } else if (connection === 'open') {
      console.log('✅ Conectado a WhatsApp.');
    }
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('messages.upsert', async ({ messages }) => {
    for (const msg of messages) {
      try {
        await handleMessage(sock, msg);
      } catch (err) {
        console.error('Error procesando mensaje:', err);
      }
    }
  });

  return sock;
}

async function handleMessage(sock, msg) {
  if (!msg.message || msg.key.fromMe) return;

  const remoteJid = msg.key.remoteJid;
  const isGroup = remoteJid?.endsWith('@g.us');
  if (!isGroup) return;

  const text =
    msg.message.conversation ||
    msg.message.extendedTextMessage?.text ||
    '';
  if (!text.startsWith('/')) return;

  const configuredGroup = process.env.GROUP_ID;
  if (!configuredGroup) {
    console.log(`📌 Mensaje recibido en grupo sin configurar. GROUP_ID = ${remoteJid}`);
    console.log('   Copiá ese valor en tu archivo .env como GROUP_ID y reiniciá el bot.');
    return;
  }
  if (remoteJid !== configuredGroup) return;

  const sender = msg.pushName || msg.key.participant || 'desconocido';

  if (/^\/ayuda/i.test(text)) {
    await sock.sendMessage(remoteJid, { text: HELP_TEXT });
    return;
  }

  if (/^\/evento\b/i.test(text)) {
    const parsed = parseEventoCommand(text);
    if (parsed.error) {
      await sock.sendMessage(remoteJid, { text: `⚠️ ${parsed.error}` });
      return;
    }
    const id = insertEvent({ ...parsed, createdBy: sender });
    await sock.sendMessage(remoteJid, {
      text: `✅ Evento cargado (#${id}): *${parsed.title}*`,
    });
    return;
  }

  if (/^\/eventos\b/i.test(text)) {
    const eventos = listUpcomingEvents(10);
    if (eventos.length === 0) {
      await sock.sendMessage(remoteJid, { text: 'No hay eventos próximos cargados.' });
      return;
    }
    const lista = eventos.map(formatEventoLine).join('\n');
    await sock.sendMessage(remoteJid, { text: `*Próximos eventos:*\n${lista}` });
    return;
  }

  if (/^\/borrar\b/i.test(text)) {
    const parsed = parseBorrarCommand(text);
    if (parsed.error) {
      await sock.sendMessage(remoteJid, { text: `⚠️ ${parsed.error}` });
      return;
    }
    const ok = deleteEvent(parsed.id);
    await sock.sendMessage(remoteJid, {
      text: ok ? `🗑️ Evento #${parsed.id} borrado.` : `No encontré el evento #${parsed.id}.`,
    });
    return;
  }
}
