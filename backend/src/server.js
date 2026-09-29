import express from 'express';
import cors from 'cors';
import 'dotenv/config';

import identityRoutes from './routes/identity.js';
import assetRoutes from './routes/assets.js';
import accessRoutes from './routes/access.js';
import { closeConnection } from './gateway/connection.js';

const app = express();

// Only the frontend origin may call this API (defense-sector system: no
// wildcard CORS). Override with CORS_ORIGIN in .env.
const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',').map((o) => o.trim()).filter(Boolean);
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '100kb' }));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/identity', identityRoutes);
app.use('/assets', assetRoutes);
app.use('/access', accessRoutes);

const PORT = process.env.PORT || 4000;
const server = app.listen(PORT, () => console.log(`ChainGuard backend running on port ${PORT}`));

for (const sig of ['SIGINT', 'SIGTERM']) {
  process.on(sig, () => {
    closeConnection();
    server.close(() => process.exit(0));
  });
}
