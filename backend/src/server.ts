import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import patientRoutes from './routes/patient.routes.js';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/api/patients', patientRoutes);

app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'API Consultorio Odontológico' });
});

app.get(['/health', '/api/health'], (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(Number(port), '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

export default app;
