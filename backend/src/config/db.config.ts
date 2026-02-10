import mongoose from 'mongoose';
import { env } from './env';

class Database {
    private static instance: Database;

    private constructor() {
        this.connect();
    }

    public static getInstance(): Database {
        if (!Database.instance) {
            Database.instance = new Database();
        }
        return Database.instance;
    }

    private async connect() {
        try {
            await mongoose.connect(env.MONGODB_URI);
            console.log('✅ MongoDB connected successfully');
        } catch (error) {
            console.error('❌ MongoDB connection error:', error);
            process.exit(1);
        }
    }
}

export default Database;
