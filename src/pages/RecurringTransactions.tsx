import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { RecurringTransactionDialog } from "@/components/RecurringTransactionDialog";
import { useToast } from "@/hooks/use-toast";

const CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Salary",
  "Other",
];

interface RecurringTransaction {
  id: string;
  title: string;
  amount: number;
  type: "income" | "expense";
  category: string;
  day_of_month: number;
  active: boolean;
}

export default function RecurringTransactions() {
  const { toast } = useToast();
  const [data, setData] = useState<RecurringTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchRecurring();
  }, []);

  const fetchRecurring = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("recurring_transactions")
      .select("*")
      .order("day_of_month", { ascending: true });

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setData(data || []);
    }

    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from("recurring_transactions")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Deleted",
        description: "Recurring transaction deleted",
      });
      fetchRecurring();
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center items-center h-64">
          Loading recurring transactions...
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Recurring Transactions</h1>

        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Recurring
        </Button>
      </div>

      {data.length === 0 && (
        <p className="text-muted-foreground">No recurring transactions found.</p>
      )}

      {data.map((r) => (
        <Card key={r.id} className="mb-3">
          <CardContent className="flex justify-between items-center py-4">
            <div>
              <p className="font-semibold">{r.title}</p>
              <p className="text-sm text-muted-foreground">
                {r.type.toUpperCase()} • {r.category} • Day {r.day_of_month}
              </p>
            </div>

            <Button
              size="icon"
              variant="ghost"
              onClick={() => handleDelete(r.id)}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </CardContent>
        </Card>
      ))}

      <RecurringTransactionDialog
        open={dialogOpen}
        onOpenChange={() => {
          setDialogOpen(false);
          fetchRecurring();
        }}
        categories={CATEGORIES}
      />
    </DashboardLayout>
  );
}
