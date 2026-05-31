const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/student_security_db';
    
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
    };

    const conn = await mongoose.connect(mongoURI, options);

    console.log(`
🗄️  MongoDB Connected Successfully!
📍 Host: ${conn.connection.host}
🔢 Port: ${conn.connection.port}
🏷️  Database: ${conn.connection.name}
🔗 Connection State: ${conn.connection.readyState === 1 ? 'Connected' : 'Disconnected'}
    `);

    // Connection event listeners
    mongoose.connection.on('connected', () => {
      console.log('✅ Mongoose connected to MongoDB');
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.log('⚠️  Mongoose disconnected from MongoDB');
    });

    // If the Node process ends, close the Mongoose connection
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('🔚 Mongoose connection closed due to app termination');
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    
    // Different handling for different environments
    if (process.env.NODE_ENV === 'production') {
      // In production, exit the process if DB connection fails
      console.error('🚨 Exiting process due to database connection failure in production');
      process.exit(1);
    } else {
      // In development, just log the error and continue
      console.error('⚠️  Continuing in development mode without database connection');
    }
  }
};

// Graceful shutdown function
const disconnectDB = async () => {
  try {
    await mongoose.connection.close();
    console.log('📴 Database connection closed successfully');
  } catch (error) {
    console.error('❌ Error closing database connection:', error);
  }
};

// Health check function
const checkDBHealth = async () => {
  try {
    const state = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    
    return {
      status: states[state] || 'unknown',
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      database: mongoose.connection.name,
      connected: state === 1
    };
  } catch (error) {
    return {
      status: 'error',
      error: error.message,
      connected: false
    };
  }
};

// Clear all collections (for testing)
const clearDatabase = async () => {
  try {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Cannot clear database in production environment');
    }
    
    const collections = mongoose.connection.collections;
    
    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
    
    console.log('🧹 Database cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Error clearing database:', error);
    throw error;
  }
};

module.exports = {
  connectDB,
  disconnectDB,
  checkDBHealth,
  clearDatabase
};