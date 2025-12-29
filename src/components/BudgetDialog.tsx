import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface BudgetDialogProps {
  open: boolean;
  onOpenChange: () => void;
  budget?: { id: string; category: string; amount: number; month: number; year: number };
  categories: string[];
}

export function BudgetDialog({ open, onOpenChange, budget, categories }: BudgetDialogProps) {
  const { toast } = useToast();
  const now = new Date();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (budget) {
      setCategory(budget.category);
      setAmount(String(budget.amount));
      setMonth(budget.month);
      setYear(budget.year);
    } else {
      setCategory("");
      setAmount("");
      setMonth(now.getMonth() + 1);
      setYear(now.getFullYear());
    }
  }, [budget, open]);

  const handleSubmit = async () => {
    setLoading(true);

    const payload = {
      category,
      amount: Number(amount),
      month,
      year,
    };

    try {
      if (budget) {
        const { error } = await supabase.from("budgets").update(payload).eq("id", budget.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("budgets").insert(payload);
        if (error) throw error;
      }
      toast({ title: "Success", description: "Budget saved successfully" });
      onOpenChange();
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{budget ? "Edit Budget" : "Add Budget"}</DialogTitle>
        </DialogHeader>

        <Label>Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger>
          <SelectContent>
            {categories.map((c) => (
              <SelectItem key={c} value={c}>{c}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Label>Amount</Label>
        <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} />

        <Label>Month</Label>
        <Input type="number" value={month} onChange={(e) => setMonth(Number(e.target.value))} />

        <Label>Year</Label>
        <Input type="number" value={year} onChange={(e) => setYear(Number(e.target.value))} />

        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
