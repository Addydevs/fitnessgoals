import dotenv from 'dotenv';
import express from 'express';
import mongoose from 'mongoose';
import { setRoutes } from './routes/index';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection
const MONGO_URI = process.env.MONGO_URI || '';

mongoose.connect(MONGO_URI)
  .then(() => console.log('Connected to MongoDB Atlas'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Middleware
app.use(express.json({ limit: '20mb' }));

// Set up routes
setRoutes(app);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});