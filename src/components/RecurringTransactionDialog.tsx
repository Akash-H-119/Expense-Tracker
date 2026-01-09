import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* ✅ Zod schema FIXED */
const recurringSchema = z.object({
  title: z.string().min(1, "Title is required"),
  amount: z.string().min(1, "Amount is required"),
  type: z.enum(["income", "expense"]),
  category: z.string().min(1, "Category is required"),
  day_of_month: z.number().min(1).max(31),
});

type RecurringFormData = z.infer<typeof recurringSchema>;

interface RecurringTransactionDialogProps {
  open: boolean;
  onOpenChange: () => void;
  recurring?: any;
  categories: string[];
}

export function RecurringTransactionDialog({
  open,
  onOpenChange,
  recurring,
  categories,
}: RecurringTransactionDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<RecurringFormData>({
    resolver: zodResolver(recurringSchema),
    defaultValues: {
      type: "expense",
      day_of_month: 1,
    },
  });

  const selectedType = watch("type");
  const selectedCategory = watch("category");

  useEffect(() => {
    if (recurring) {
      setValue("title", recurring.title);
      setValue("amount", recurring.amount.toString());
      setValue("type", recurring.type);
      setValue("category", recurring.category);
      setValue("day_of_month", recurring.day_of_month);
    } else {
      reset({
        title: "",
        amount: "",
        type: "expense",
        category: "",
        day_of_month: 1,
      });
    }
  }, [recurring, reset, setValue, open]);

  const onSubmit = async (data: RecurringFormData) => {
    if (!user) return;
    setSubmitting(true);

    try {
      const recurringData = {
        user_id: user.id,
        title: data.title,
        amount: Number(data.amount),
        type: data.type,
        category: data.category,
        day_of_month: data.day_of_month,

        /* ✅ REQUIRED BY DATABASE */
        frequency: "monthly",
        start_date: new Date().toISOString().split("T")[0],
      };

      if (recurring) {
        const { error } = await supabase
          .from("recurring_transactions")
          .update(recurringData)
          .eq("id", recurring.id);

        if (error) throw error;
        toast({ title: "Success", description: "Recurring transaction updated" });
      } else {
        const { error } = await supabase
          .from("recurring_transactions")
          .insert(recurringData);

        if (error) throw error;
        toast({ title: "Success", description: "Recurring transaction created" });
      }

      onOpenChange();
    } catch (error: any) {
      console.error("Error saving recurring transaction:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save recurring transaction",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {recurring ? "Edit Recurring Transaction" : "Add Recurring Transaction"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input {...register("title")} />
            {errors.title && <p className="text-sm text-destructive">{errors.title.message}</p>}
          </div>

          <div>
            <Label>Amount</Label>
            <Input type="number" {...register("amount")} />
            {errors.amount && <p className="text-sm text-destructive">{errors.amount.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type</Label>
              <Select value={selectedType} onValueChange={(v) => setValue("type", v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="expense">Expense</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Category</Label>
              <Select value={selectedCategory} onValueChange={(v) => setValue("category", v)}>
                <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label>Day of Month (1–31)</Label>
            <Input
              type="number"
              min="1"
              max="31"
              {...register("day_of_month", { valueAsNumber: true })}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onOpenChange}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Saving..." : recurring ? "Update" : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
