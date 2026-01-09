import { useAuth } from "@/lib/auth";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BarChart3, Shield, Zap, Wallet } from "lucide-react";
import { useEffect } from "react";

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate("/dashboard");
    }
  }, [user, navigate]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/10">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-20">
        <div className="flex flex-col items-center text-center space-y-8 max-w-4xl mx-auto">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/80 shadow-lg">
            <Wallet className="h-10 w-10 text-primary-foreground" />
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
            Take Control of Your{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Finances
            </span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl">
            Track expenses, monitor income, and visualize your financial journey with ExpenseTracker.
            Simple, powerful, and designed for you.
          </p>

          <div className="flex gap-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="shadow-lg">
              Get Started
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Features Grid */}
        <div className="mt-24 grid gap-8 md:grid-cols-3">
          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card shadow-md transition-shadow hover:shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <BarChart3 className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Visual Insights</h3>
            <p className="text-muted-foreground">
              Beautiful charts and graphs that make understanding your spending patterns effortless
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card shadow-md transition-shadow hover:shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Secure & Private</h3>
            <p className="text-muted-foreground">
              Your financial data is encrypted and protected with industry-standard security
            </p>
          </div>

          <div className="flex flex-col items-center text-center space-y-4 p-6 rounded-xl bg-card shadow-md transition-shadow hover:shadow-lg">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <Zap className="h-7 w-7 text-primary" />
            </div>
            <h3 className="text-xl font-semibold">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Add transactions in seconds and access your data instantly from anywhere
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
