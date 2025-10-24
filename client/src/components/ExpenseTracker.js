import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';
import axios from 'axios';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchExpenses();
    }
  }, [user]);

  const fetchExpenses = async () => {
    try {
      const res = await axios.get('/api/expenses');
      setExpenses(res.data);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const handleExpenseAdded = (newExpense) => {
    setExpenses([...expenses, newExpense]);
  };

  const handleExpenseDeleted = (id) => {
    setExpenses(expenses.filter(expense => expense._id !== id));
  };

  return (
    <div className="expense-tracker">
      <h1>Expense Tracker</h1>
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
      <ExpenseList 
        expenses={expenses} 
        onExpenseDeleted={handleExpenseDeleted} 
      />
    </div>
  );
};

export default ExpenseTracker;
