require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const rateLimit = require('express-rate-limit');
const metaRoutes = require('./routes/meta');

const app  = express();
const PORT = process.env.PORT || 4001;

app.use(cors());
app.use(express.json());

app.use(rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
}));

app.get('/health', (req, res) =>
  res.json({ status: 'ok', service: 'cpa-meta-service', ts: new Date().toISOString() })
);

app.use('/api', metaRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => console.log(`cpa-meta-service running on port ${PORT}`));
