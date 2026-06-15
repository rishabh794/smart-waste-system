import express from 'express';
import cors from 'cors';
import * as dotenv from 'dotenv';
import apiRoutes from './routes/api.js';
import './queues/aiQueue.js'; // Initialize BullMQ workers

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/api', apiRoutes);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});