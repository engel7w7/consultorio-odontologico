import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import patientRoutes from './routes/patient.routes.js';

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

const app = express();

const port = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (_req, res) => {
  res.status(200).json({
    message: 'API Consultorio Odontológico',
    status: 'online',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get(['/health', '/api/health'], (_req, res) => {
  res.status(200).json({ status: 'ok' });
});

app.use('/api/patients', patientRoutes);

app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port} [Mode: ${process.env.NODE_ENV || 'development'}]`);
});

export default app;
