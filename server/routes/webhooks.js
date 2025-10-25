import { Router } from 'express';
import fetch from 'node-fetch';

const router = Router();

const N8N_BASE = process.env.N8N_BASE_URL || '';

async function postToN8n(path, payload) {
  if (!N8N_BASE) return { ok: true, skipped: true };
  const res = await fetch(`${N8N_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

// Script generation trigger
router.post('/script-generate', async (req, res) => {
  const payload = req.body;
  try {
    const out = await postToN8n('/webhook-test/script-generate', payload);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'n8n_error', detail: e.message });
  }
});

// Video generation trigger
router.post('/video-generate', async (req, res) => {
  const payload = req.body;
  try {
    const out = await postToN8n('/webhook-test/video-generate', payload);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'n8n_error', detail: e.message });
  }
});

// Title generation
router.post('/title-generate', async (req, res) => {
  const payload = req.body;
  try {
    const out = await postToN8n('/webhook-test/title-generate', payload);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'n8n_error', detail: e.message });
  }
});

// Description generation
router.post('/description-generate', async (req, res) => {
  const payload = req.body;
  try {
    const out = await postToN8n('/webhook-test/description-generate', payload);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'n8n_error', detail: e.message });
  }
});

// Upload trigger
router.post('/upload-video', async (req, res) => {
  const payload = req.body;
  try {
    const out = await postToN8n('/webhook-test/upload-video', payload);
    res.json(out);
  } catch (e) {
    res.status(500).json({ error: 'n8n_error', detail: e.message });
  }
});

export default router;


