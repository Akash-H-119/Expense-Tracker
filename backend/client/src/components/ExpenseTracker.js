import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getExpenses, addExpense, deleteExpense } from '../services/expenseService';
import ExpenseForm from './ExpenseForm';
import ExpenseList from './ExpenseList';

const ExpenseTracker = () => {
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const expensesData = await getExpenses();
      setExpenses(expensesData);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const newExpense = await addExpense(expenseData);
      setExpenses([...expenses, newExpense]);
    } catch (error) {
      console.error('Error adding expense:', error);
      alert('Failed to add expense');
    }
  };

  const handleDeleteExpense = async (id) => {
    try {
      await deleteExpense(id);
      setExpenses(expenses.filter(expense => expense._id !== id));
    } catch (error) {
      console.error('Error deleting expense:', error);
      alert('Failed to delete expense');
    }
  };

  const handleLogout = () => {
    logout();
  };

  if (loading) {
    return <div>Loading expenses...</div>;
  }

  return (
    <div className="expense-tracker">
      <div className="header">
        <h1>Expense Tracker</h1>
        <div className="user-info">
          <span>Welcome, {user.username}!</span>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      </div>

      <ExpenseForm onExpenseAdded={handleAddExpense} />
      <ExpenseList 
        expenses={expenses} 
        onDeleteExpense={handleDeleteExpense} 
      />
    </div>
  );
};

export default ExpenseTracker;
