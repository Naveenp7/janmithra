import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import classifyHandler from './api/classify-complaint.js';
import healthHandler from './api/health.js';

// Load environment variables from .env
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Mount API routes
app.all('/api/classify-complaint', (req, res) => {
  dotenv.config({ override: true });
  classifyHandler(req, res);
});

app.all('/api/health', (req, res) => {
  dotenv.config({ override: true });
  healthHandler(req, res);
});

// Root ping
app.get('/', (req, res) => {
  res.send('JanMithra Civic AI API Server is running.');
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 JanMithra Local API Server active on http://localhost:${PORT}`);
  console.log(`🤖 NVIDIA NIM Key status: ${process.env.NIM_API_KEY ? 'Present' : 'Not set (using heuristic fallback)'}`);
  console.log(`======================================================\n`);
});
