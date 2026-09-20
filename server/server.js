const app = require('./app');
const connectDB = require('./config/db');
const config = require('./config/env');

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start server
    const server = app.listen(config.PORT, () => {
      console.log(`\n🚀 Server running in ${config.NODE_ENV} mode on port ${config.PORT}`);
      console.log(`📡 API: http://localhost:${config.PORT}/api`);
      console.log(`❤️  Health: http://localhost:${config.PORT}/api/health\n`);
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (err) => {
      console.error(`Unhandled Rejection: ${err.message}`);
      server.close(() => process.exit(1));
    });

    // Handle uncaught exceptions
    process.on('uncaughtException', (err) => {
      console.error(`Uncaught Exception: ${err.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
};

startServer();
