import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { BudgetDialog } from "@/components/BudgetDialog";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";

interface Budget {
  id: string;
  category: string;
  amount: number;
  month: number;
  year: number;
}

interface BudgetWithSpent extends Budget {
  spent: number;
}

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

export default function Budgets() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [budgets, setBudgets] = useState<BudgetWithSpent[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<Budget | undefined>();

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  useEffect(() => {
    if (user) fetchBudgets();
  }, [user]);

  const fetchBudgets = async () => {
    setLoading(true);

    const startDate = `${currentYear}-${String(currentMonth).padStart(2, "0")}-01`;
    const nextMonth = new Date(currentYear, currentMonth, 1);
    const endDate = `${nextMonth.getFullYear()}-${String(
      nextMonth.getMonth() + 1
    ).padStart(2, "0")}-01`;

    try {
      const { data: budgetsData, error: budgetsError } = await supabase
        .from("budgets")
        .select("*")
        .eq("month", currentMonth)
        .eq("year", currentYear);

      if (budgetsError) throw budgetsError;

      const { data: transactionsData, error: transactionsError } = await supabase
        .from("transactions")
        .select("category, amount")
        .eq("type", "expense")
        .gte("date", startDate)
        .lt("date", endDate);

      if (transactionsError) throw transactionsError;

      const spentByCategory = (transactionsData || []).reduce(
        (acc, t) => {
          acc[t.category] = (acc[t.category] || 0) + Number(t.amount);
          return acc;
        },
        {} as Record<string, number>
      );

      const merged = (budgetsData || []).map((b) => ({
        ...b,
        spent: spentByCategory[b.category] || 0,
      })) as BudgetWithSpent[];

      setBudgets(merged);
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to load budgets",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("budgets").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
      return;
    }
    fetchBudgets();
  };

  const handleEdit = (budget: Budget) => {
    setEditingBudget(budget);
    setDialogOpen(true);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    setEditingBudget(undefined);
    fetchBudgets();
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex h-96 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Budget Goals</h1>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Add Budget
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {budgets.map((b) => {
            const percentage = (b.spent / b.amount) * 100;
            return (
              <Card key={b.id}>
                <CardHeader className="flex flex-row justify-between pb-2">
                  <CardTitle>{b.category}</CardTitle>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => handleEdit(b)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(b.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Progress value={Math.min(percentage, 100)} />
                  <p className="text-sm mt-2">
                    ₹{b.spent.toFixed(2)} / ₹{b.amount.toFixed(2)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      <BudgetDialog
        open={dialogOpen}
        onOpenChange={handleDialogClose}
        budget={editingBudget}
        categories={CATEGORIES}
      />
    </DashboardLayout>
  );
}
