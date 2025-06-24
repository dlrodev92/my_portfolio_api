import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Simple hello world route
app.get('/', (req, res) => {
  res.json({ message: 'Hello World from Portfolio API! 🚀' });
});

// API route
app.get('/api', (req, res) => {
  res.json({ message: 'API is working!' });
});

export default app;