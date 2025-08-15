import { Express } from 'express';
import authRoutes from './auth';

export function setRoutes(app: Express) {
    app.use('/auth', authRoutes);
}