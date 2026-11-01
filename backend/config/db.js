const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/expenseai';
    const conn = await mongoose.connect(mongoURI, {
      autoIndex: true,
    });
    console.log(`[ExpenseAI] MongoDB Connected: ${conn.connection.host}/${conn.connection.name}`);
  } catch (error) {
    console.error(`[ExpenseAI] MongoDB Connection Error: ${error.message}`);
    // Don't exit immediately so tests or fallback setups can provide clear error
  }
};

module.exports = connectDB;
