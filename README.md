# 💰 Expense Tracker Web Application

A full-stack **Expense Tracker** web application built using **React**, **TypeScript**, and **Supabase**.  
This application helps users manage their income, expenses, budgets, and recurring transactions in a secure and user-friendly way.

---

## 📌 Features

- 🔐 User Authentication (Sign Up / Sign In)
- 💵 Add, edit, and delete income & expense transactions
- 📊 Monthly budget management with progress tracking
- 🔁 Recurring transactions (monthly bills / salary)
- 📂 Category-wise expense tracking
- 📈 Budget vs spent visualization
- 📤 Export transactions to CSV
- 🔒 Secure data access using Supabase Row Level Security (RLS)

---

## 🛠️ Tech Stack
Expense-Tracker
### Frontend
- **React (Vite)**
- **TypeScript**
- **Tailwind CSS**
- **ShadCN UI**
- **Lucide Icons**

### Backend / Database
- **Supabase**
  - PostgreSQL database
  - Authentication
  - Row Level Security (RLS)

---

## 🧱 Project Structure

```text
expense-tracker/
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── BudgetDialog.tsx
│   │   ├── DashboardLayout.tsx
│   │   ├── Navbar.tsx
│   │   ├── RecurringTransactionDialog.tsx
│   │   ├── TransactionDialog.tsx
│   │   └── ui/                  # ShadCN UI components
│   │
│   ├── pages/
│   │   ├── Auth.tsx
│   │   ├── Dashboard.tsx
│   │   ├── Transactions.tsx
│   │   ├── Budgets.tsx
│   │   └── RecurringTransactions.tsx
│   │
│   ├── lib/
│   │   ├── supabase.ts           # Supabase client configuration
│   │   ├── auth.ts               # Authentication logic
│   │   └── exportCSV.ts          # CSV export utility
│   │
│   ├── hooks/
│   │   └── use-toast.ts
│   │
│   ├── integrations/
│   │   └── supabase/             # Legacy / optional
│   │
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
│
├── .env.example                  # Environment variables template
├── .gitignore
├── package.json
├── tsconfig.json
├── vite.config.ts
└── README.md
