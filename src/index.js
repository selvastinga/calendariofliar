import 'dotenv/config';
import express from 'express';
import path from 'node:path';
import eventsRouter from './routes/events.js';
import { startWhatsApp } from './whatsapp.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/api', eventsRouter);
app.use(express.static(path.resolve('public')));

app.listen(PORT, () => {
  console.log(`🌐 Calendario disponible en http://localhost:${PORT}`);
});

startWhatsApp().catch((err) => {
  console.error('Error iniciando WhatsApp:', err);
});
