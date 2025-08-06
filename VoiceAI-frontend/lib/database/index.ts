import mongoose from 'mongoose';

const { MONGODB_URI } = process.env;

const cached = (global as any).mongoose || { conn: null, promise: null };

export const connectToDatabase = async () => {
  if (cached.conn) return cached.conn;

  if (!MONGODB_URI) throw new Error('MONGODB_URI is missing');

  if (!cached.promise) {
    cached.promise = mongoose
      .connect(MONGODB_URI, {
        bufferCommands: false,
      })
      .catch((error) => {
        cached.promise = null; // Reset the promise cache if the connection fails
        console.error('Database connection failed:', error);
        throw error;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    throw new Error('Database connection failed');
  }

  return cached.conn;
};
