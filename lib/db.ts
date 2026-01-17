import mongoose from "mongoose";

type Cached = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalForMongoose = global as typeof global & {
  mongoose: Cached | undefined;
};

const cached: Cached = globalForMongoose.mongoose ?? {
  conn: null,
  promise: null
};

globalForMongoose.mongoose = cached;

export async function connectDb() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
      throw new Error("MONGODB_URI is not set");
    }

    cached.promise = mongoose.connect(uri, {
      bufferCommands: false
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
