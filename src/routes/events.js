import { Router } from 'express';
import { listEvents, deleteEvent, updateEvent, insertEvent } from '../db.js';

const router = Router();

router.get('/events', (req, res) => {
  const { from, to } = req.query;
  const events = listEvents(from && to ? { from, to } : undefined);
  res.json(events);
});

router.post('/events', (req, res) => {
  const { title, eventDate, location, description, person } = req.body;
  if (!title || !eventDate) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (title, eventDate)' });
  }
  const id = insertEvent({ title, eventDate, location, description, person });
  res.status(201).json({ id, ok: true });
});

router.put('/events/:id', (req, res) => {
  const { title, eventDate, location, description, person } = req.body;
  if (!title || !eventDate) {
    return res.status(400).json({ error: 'Faltan campos obligatorios (title, eventDate)' });
  }
  const ok = updateEvent(Number(req.params.id), { title, eventDate, location, description, person });
  if (!ok) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ ok: true });
});

router.delete('/events/:id', (req, res) => {
  const ok = deleteEvent(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ ok: true });
});

export default router;
