const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/expense-tracker', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('✅ MongoDB connected successfully'))
.catch(err => console.log('❌ MongoDB connection error:', err));

// Import routes
const authRoutes = require('./routes/auth');
const expenseRoutes = require('./routes/expenses');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/expenses', expenseRoutes);

// Basic health check route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Expense Tracker API is running!',
    database: 'MongoDB',
    status: 'Connected'
  });
});

// Handle undefined routes
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Expense Tracker Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
});
