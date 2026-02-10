const mongoose = require('mongoose');

const connectDB = async () => {
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/titoubarz';
  const isLocal = /localhost|127\.0\.0\.1/.test(mongoURI);

  try {
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      process.exit(0);
    });
  } catch (error) {
    console.error('Error connecting to MongoDB:', error.message);
    if (isLocal) {
      console.error('\n→ To run MongoDB locally: install MongoDB and start the service, or use MongoDB Atlas.');
      console.error('→ With Atlas: set MONGODB_URI in Backend/.env to your cluster connection string.\n');
    } else {
      console.error('\n→ Check MONGODB_URI in Backend/.env (network, firewall, correct Atlas URL).\n');
    }
    process.exit(1);
  }
};

module.exports = connectDB;
