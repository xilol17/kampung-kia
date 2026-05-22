import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';

import { logger } from './utils/logger';


dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;


app.use(cors());
app.use(express.json()); 
app.use(express.urlencoded({ extended: true }));


app.use('/api', apiRoutes);

// 全局 404 拦截
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});


app.listen(PORT, () => {
  logger.info(`===========================================`);
  logger.info(`Ai Course Registration Backend is LIVE!`);
  logger.info(`API is listening on port ${PORT}`);
  logger.info(`===========================================`);
});