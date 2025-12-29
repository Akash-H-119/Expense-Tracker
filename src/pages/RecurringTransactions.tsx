import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { RecurringTransactionDialog } from "@/components/RecurringTransactionDialog";
import { useToast } from "@/hooks/use-toast";

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
      .order("day_of_month");

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setData(data || []);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("recurring_transactions").delete().eq("id", id);
    fetchRecurring();
  };

  if (loading) {
    return <DashboardLayout>Loading...</DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <Button onClick={() => setDialogOpen(true)}>
        <Plus className="mr-2 h-4 w-4" /> Add Recurring
      </Button>

      {data.map((r) => (
        <Card key={r.id} className="mt-4">
          <CardContent className="flex justify-between items-center">
            <span>{r.title} – Day {r.day_of_month}</span>
            <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
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
        } } categories={[]}      />
    </DashboardLayout>
  );
}
