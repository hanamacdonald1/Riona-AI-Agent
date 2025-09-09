import mongoose from 'mongoose';
import logger from './logger';

export const connectDB = async () => {
  // Check if MongoDB URI is provided
  if (!process.env.MONGODB_URI) {
    logger.warn('No MongoDB URI provided. Running in standalone mode without database.');
    return false;
  }

  const connectWithRetry = async (retries = 3, delay = 3000) => {
    try {
      await mongoose.connect(process.env.MONGODB_URI || '', {
        connectTimeoutMS: 10000, // Reduce connection timeout to 10 seconds
        serverSelectionTimeoutMS: 10000 // Reduce server selection timeout
      });
      logger.info('MongoDB connected successfully');
      return true;
    } catch (error) {
      if (retries <= 0) {
        logger.warn('MongoDB connection failed after multiple attempts. Continuing without database:', error);
        return false;
      }

      logger.warn(`MongoDB connection attempt failed. Retrying in ${delay / 1000} seconds... (${retries} attempts remaining)`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return connectWithRetry(retries - 1, delay);
    }
  };

  return connectWithRetry();
};
