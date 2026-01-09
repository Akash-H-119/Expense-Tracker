import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip, LineChart, Line, XAxis, YAxis, CartesianGrid, Legend } from "recharts";
import { DashboardLayout } from "@/components/DashboardLayout";
import { format, subMonths } from "date-fns";

interface Transaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  date: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("date", { ascending: false });

      if (error) throw error;
      const txns = (data || []) as Transaction[];
      setTransactions(txns);

      // Calculate trend data for last 6 months
      const monthlyData: Record<string, { income: number; expenses: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const monthDate = subMonths(new Date(), i);
        const monthKey = format(monthDate, "MMM yyyy");
        monthlyData[monthKey] = { income: 0, expenses: 0 };
      }

      txns.forEach((t) => {
        const monthKey = format(new Date(t.date), "MMM yyyy");
        if (monthlyData[monthKey]) {
          if (t.type === "income") {
            monthlyData[monthKey].income += Number(t.amount);
          } else {
            monthlyData[monthKey].expenses += Number(t.amount);
          }
        }
      });

      const trend = Object.entries(monthlyData).map(([month, data]) => ({
        month,
        income: data.income,
        expenses: data.expenses,
      }));

      setTrendData(trend);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const balance = totalIncome - totalExpenses;

  // Category breakdown for expenses
  const expensesByCategory = transactions
    .filter((t) => t.type === "expense")
    .reduce((acc, t) => {
      acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
      return acc;
    }, {} as Record<string, number>);

  const chartData = Object.entries(expensesByCategory).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ["#0ea5e9", "#8b5cf6", "#ec4899", "#f59e0b", "#10b981", "#ef4444"];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">Overview of your financial status</p>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card className="shadow-md transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Balance</CardTitle>
              <Wallet className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${balance >= 0 ? "text-income" : "text-expense"}`}>
                ${balance.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Current financial position
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-5 w-5 text-income" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-income">
                ${totalIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time earnings
              </p>
            </CardContent>
          </Card>

          <Card className="shadow-md transition-shadow hover:shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-5 w-5 text-expense" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-expense">
                ${totalExpenses.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                All time spending
              </p>
            </CardContent>
          </Card>
        </div>

        {trendData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Spending Trend (Last 6 Months)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip formatter={(value) => `$${Number(value).toFixed(2)}`} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="income"
                    stroke="hsl(var(--income))"
                    strokeWidth={2}
                    name="Income"
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    stroke="hsl(var(--expense))"
                    strokeWidth={2}
                    name="Expenses"
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {chartData.length > 0 && (
          <Card className="shadow-md">
            <CardHeader>
              <CardTitle>Expenses by Category</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {transactions.length === 0 && (
          <Card className="shadow-md">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Receipt className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No transactions yet</h3>
              <p className="text-muted-foreground text-center">
                Start tracking your finances by adding your first transaction
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
