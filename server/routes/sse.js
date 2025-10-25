import { Router } from 'express';

const router = Router();

// Store active SSE connections
const clients = new Map();

// Helper function to send SSE notification to all clients
export function notifyClients(eventType, data) {
  const message = `data: ${JSON.stringify({ type: eventType, data, timestamp: Date.now() })}\n\n`;
  
  // Send to all connected clients
  clients.forEach((client, clientId) => {
    try {
      client.write(message);
    } catch (error) {
      console.error(`Error sending SSE to client ${clientId}:`, error);
      clients.delete(clientId);
    }
  });
}

// SSE endpoint for real-time updates
router.get('/stream', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Cache-Control'
  });

  // Generate unique client ID
  const clientId = Date.now() + Math.random();
  
  // Store client connection
  clients.set(clientId, res);
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ 
    type: 'connected', 
    clientId, 
    timestamp: Date.now() 
  })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    clients.delete(clientId);
  });

  req.on('error', (error) => {
    console.error(`SSE client ${clientId} error:`, error);
    clients.delete(clientId);
  });
});

export default router;
