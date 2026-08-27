const mongoose = require('mongoose');

let memoryServer = null;

const connectDB = async () => {
  try {
    let uri = process.env.MONGODB_URI;

    if (!uri) {
      console.log('⚡ No MONGODB_URI detected in environment. Starting MongoDB Memory Server for instant local development...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      uri = memoryServer.getUri();
      console.log(`📦 In-Memory MongoDB running at: ${uri}`);
    }

    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    console.log(`✅ MongoDB Connected successfully: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`❌ Direct MongoDB connection failed (${error.message}).`);
    try {
      console.log('🔄 Launching automatic In-Memory MongoDB fallback...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      memoryServer = await MongoMemoryServer.create();
      const uri = memoryServer.getUri();
      const conn = await mongoose.connect(uri);
      console.log(`✅ Fallback In-Memory MongoDB Connected: ${conn.connection.host}`);
      return conn;
    } catch (fallbackError) {
      console.error(`❌ Fallback failed: ${fallbackError.message}`);
      process.exit(1);
    }
  }
};

const disconnectDB = async () => {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
  }
};

module.exports = { connectDB, disconnectDB };
