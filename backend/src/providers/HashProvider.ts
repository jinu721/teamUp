import bcrypt from 'bcryptjs';

export class HashProvider {
    async hash(payload: string): Promise<string> {
        return await bcrypt.hash(payload, 10);
    }

    async compare(payload: string, hashed: string): Promise<boolean> {
        return await bcrypt.compare(payload, hashed);
    }
}
