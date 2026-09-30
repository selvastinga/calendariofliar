import { Router } from 'express';
import { listEvents, deleteEvent } from '../db.js';

const router = Router();

router.get('/events', (req, res) => {
  const { from, to } = req.query;
  const events = listEvents(from && to ? { from, to } : undefined);
  res.json(events);
});

router.delete('/events/:id', (req, res) => {
  const ok = deleteEvent(Number(req.params.id));
  if (!ok) return res.status(404).json({ error: 'Evento no encontrado' });
  res.json({ ok: true });
});

export default router;
