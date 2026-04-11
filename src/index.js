require('dotenv').config();
const express = require('express');
const cors = require('cors');
const graphRouter   = require('./routes/graph');
const analyseRouter = require('./routes/analyse');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.ALLOWED_ORIGIN }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/graph', graphRouter);
app.use('/api/analyse', analyseRouter);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
