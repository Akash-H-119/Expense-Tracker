import React, { useState, useContext } from 'react';
import { useAuth } from '../context/AuthContext';

const ExpenseForm = ({ onExpenseAdded }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="expense-form">
        <p>Please login to add expenses</p>
      </div>
    );
  }

  // ... rest of your existing form logic
};
