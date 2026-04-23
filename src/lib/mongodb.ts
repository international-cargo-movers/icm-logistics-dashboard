import mongoose, { Connection } from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI!;
if(!MONGODB_URI){
    throw new Error("Please define the MONGODB_URI environment variable inside .env");
}

/**
 * Global is used here to maintain a cached connection across hot reloads
 * in development. This prevents connections from growing exponentially
 * during API Route usage.
 */
let cached = (global as any).mongoose;

if(!cached){
    cached = (global as any).mongoose = { conn: null, promise: null };
}

async function dbConnect(): Promise<Connection> {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        // mongoose.connect returns the mongoose singleton
        cached.promise = mongoose.connect(MONGODB_URI, opts).then((m) => {
            return m.connection;
        });
    }

    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

/**
 * Returns a connection to a specific tenant database.
 * Uses the main connection and switches database using useDb.
 */
export async function getTenantDb(dbName: string): Promise<Connection> {
    const conn = await dbConnect();
    
    // Safety check to ensure we have a valid connection object with useDb
    if (!conn || typeof conn.useDb !== 'function') {
        console.error("Connection object is invalid or missing useDb:", !!conn);
        // Fallback to the default connection if useDb is somehow missing
        if (mongoose.connection && typeof mongoose.connection.useDb === 'function') {
            return mongoose.connection.useDb(dbName, { useCache: true });
        }
        throw new Error("Mongoose connection does not support useDb");
    }

    return conn.useDb(dbName, { useCache: true });
}

export default dbConnect;
