import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/chat_app');
  } catch (error: any) {
    console.error(`Помилка підключення до MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;