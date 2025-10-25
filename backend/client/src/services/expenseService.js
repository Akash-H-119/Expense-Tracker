import axios from 'axios';

const API_URL = '/api/expenses';

// Get all expenses for logged-in user
export const getExpenses = async () => {
  const response = await axios.get(API_URL);
  return response.data;
};

// Add new expense
export const addExpense = async (expenseData) => {
  const response = await axios.post(API_URL, expenseData);
  return response.data;
};

// Update expense
export const updateExpense = async (id, expenseData) => {
  const response = await axios.put(`${API_URL}/${id}`, expenseData);
  return response.data;
};

// Delete expense
export const deleteExpense = async (id) => {
  const response = await axios.delete(`${API_URL}/${id}`);
  return response.data;
};
