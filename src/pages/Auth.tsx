import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Dna } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const Auth = () => {
  const { user, loading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, resetPassword } = useAuth();

  if (loading) return null;
  if (user) return <Navigate to="/admin" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (isForgotPassword) {
      const { error } = await resetPassword(email);
      setSubmitting(false);
      if (error) {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Check your email", description: "We sent you a password reset link." });
        setIsForgotPassword(false);
        setIsLogin(true);
      }
      return;
    }

    const { error } = isLogin
      ? await signIn(email, password)
      : await signUp(email, password, fullName);
    setSubmitting(false);

    if (error) {
      console.error("Full error object:", error);
      if (error.message.includes("already registered") || error.message.includes("409") || error.message.includes("already exists")) {
        toast({ 
          title: "Account exists", 
          description: "This email is already registered. Please sign in instead.", 
          variant: "destructive" 
        });
      } else {
        toast({ title: "Error", description: error.message, variant: "destructive" });
      }
    } else if (!isLogin) {
      toast({ title: "Check your email", description: "We sent you a confirmation link." });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card>
          <CardHeader className="text-center">
            <motion.div 
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ duration: 0.5, type: "spring" }}
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary"
            >
              <Dna className="h-6 w-6 text-primary-foreground" />
            </motion.div>
            <CardTitle className="text-xl">
              {isForgotPassword ? "Reset Password" : isLogin ? "Admin Login" : "Create Account"}
            </CardTitle>
            <CardDescription>CUET Biomedical Engineering Society</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {!isLogin && !isForgotPassword && (
                  <motion.div 
                    key="name-field"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2 overflow-hidden"
                  >
                    <Label htmlFor="name">Full Name</Label>
                    <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                  </motion.div>
                )}
              </AnimatePresence>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
                </div>
              )}
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Please wait..." : isForgotPassword ? "Send Reset Link" : isLogin ? "Sign In" : "Sign Up"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-muted-foreground">
              {isForgotPassword ? (
                <button onClick={() => setIsForgotPassword(false)} className="font-medium text-primary hover:underline">
                  Back to Login
                </button>
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <button onClick={() => setIsForgotPassword(true)} className="block w-full mb-2 font-medium text-primary hover:underline">
                        Forgot password?
                      </button>
                      Don't have an account?{" "}
                      <button onClick={() => setIsLogin(false)} className="font-medium text-primary hover:underline">
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      Already have an account?{" "}
                      <button onClick={() => setIsLogin(true)} className="font-medium text-primary hover:underline">
                        Sign In
                      </button>
                    </>
                  )}
                </>
              )}
            </p>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
