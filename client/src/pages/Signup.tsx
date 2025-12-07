import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useGame } from "@/lib/store";

export default function Signup() {
  const [isLoading, setIsLoading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const { login } = useGame();

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      // Mock login after signup
      login(email, name);
      toast({
        title: "Account created!",
        description: "Welcome to your new journey. You start with 0 points.",
      });
      setLocation("/");
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-[#1C1C1E] border-white/10 text-white">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-6 w-6 text-[#0A84FF]" />
            <span className="text-[#0A84FF] font-bold text-sm uppercase tracking-wider">Start Your Journey</span>
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight">Create an account</CardTitle>
          <CardDescription className="text-gray-400">
            Enter your details below to create your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSignup}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                type="text" 
                placeholder="John Doe" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required 
                className="bg-[#2C2C2E] border-transparent text-white focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                type="email" 
                placeholder="m@example.com" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required 
                className="bg-[#2C2C2E] border-transparent text-white focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input 
                id="password" 
                type="password" 
                required 
                className="bg-[#2C2C2E] border-transparent text-white focus:border-[#0A84FF] focus:ring-1 focus:ring-[#0A84FF]"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
              type="submit" 
              className="w-full bg-[#0A84FF] hover:bg-[#007AFF] text-white font-bold" 
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                "Sign Up"
              )}
            </Button>
            <div className="text-center text-sm text-gray-400">
              Already have an account?{" "}
              <Link href="/login" className="text-[#0A84FF] hover:underline font-medium">
                Login
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
