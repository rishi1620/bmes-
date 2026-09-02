import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Dna, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Derive redirection target from navigation state if available
  const redirectTarget = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/admin";

  useEffect(() => {
    console.info(`[Auth Page] 📄 Auth route mounted. State:`, {
      loading,
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      targetAfterAuth: redirectTarget,
      pathname: location.pathname
    });
  }, [loading, user, redirectTarget, location.pathname]);

  if (loading) {
    console.info("[Auth Page] ⏳ AuthProvider is loading session, rendering session check loader...");
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted p-4">
        <div className="flex flex-col items-center gap-3 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary animate-pulse">
            <Dna className="h-6 w-6" />
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
            <span>Verifying authentication session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (user) {
    console.info(`[Auth Page] 🔀 User is already authenticated (${user.email}). Redirecting to: ${redirectTarget}`);
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    
    if (isForgotPassword) {
      console.info(`[Auth Page] 🔑 Submitting password reset request for: ${email}`);
      const { error } = await resetPassword(email);
      setSubmitting(false);
      if (error) {
        console.warn(`[Auth Page] ❌ Password reset request failed for ${email}:`, error);
        toast({ title: "Error", description: error.message, variant: "destructive" });
      } else {
        console.info(`[Auth Page] ✅ Password reset email requested successfully for ${email}`);
        toast({ title: "Check your email", description: "We sent you a password reset link." });
        setIsForgotPassword(false);
        setIsLogin(true);
      }
      return;
    }

    if (isLogin) {
      console.info(`[Auth Page] 🔐 Submitting Sign In for: ${email}`);
      const { error } = await signIn(email, password);
      setSubmitting(false);

      if (error) {
        console.warn(`[Auth Page] ❌ Sign In failed for ${email}:`, error.message, error);
        toast({ title: "Sign In Error", description: error.message, variant: "destructive" });
      } else {
        console.info(`[Auth Page] ✅ Sign In successful for ${email}! Route will automatically redirect.`);
      }
    } else {
      console.info(`[Auth Page] 📝 Submitting Sign Up for: ${email} (${fullName})`);
      const { error } = await signUp(email, password, fullName);
      setSubmitting(false);

      if (error) {
        console.warn(`[Auth Page] ❌ Sign Up error for ${email}:`, error);
        if (error.message.toLowerCase().includes("already registered") || 
            error.message.includes("409") || 
            error.message.toLowerCase().includes("already exists") ||
            error.message.toLowerCase().includes("user already registered")) {
          toast({ 
            title: "Account exists", 
            description: "This email is already registered. Please sign in instead.", 
            variant: "destructive" 
          });
          setIsLogin(true);
        } else {
          toast({ title: "Sign Up Error", description: error.message, variant: "destructive" });
        }
      } else {
        console.info(`[Auth Page] ✅ Sign Up successful for ${email}. Showing confirmation notice.`);
        toast({ title: "Check your email", description: "We sent you a confirmation link." });
      }
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
            <div className="mt-4 text-center text-sm text-muted-foreground">
              {isForgotPassword ? (
                <button 
                  type="button"
                  onClick={() => {
                    console.info("[Auth Page] 🔄 Switching back to Login view from Forgot Password.");
                    setIsForgotPassword(false);
                    setIsLogin(true);
                  }} 
                  className="font-medium text-primary hover:underline"
                >
                  Back to Login
                </button>
              ) : (
                <>
                  {isLogin ? (
                    <>
                      <button 
                        type="button"
                        onClick={() => {
                          console.info("[Auth Page] 🔄 Switching to Forgot Password view.");
                          setIsForgotPassword(true);
                        }} 
                        className="block w-full mb-2 font-medium text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                      <span>Don't have an account? </span>
                      <button 
                        type="button"
                        onClick={() => {
                          console.info("[Auth Page] 🔄 Switching to Sign Up view.");
                          setIsLogin(false);
                        }} 
                        className="font-medium text-primary hover:underline"
                      >
                        Sign Up
                      </button>
                    </>
                  ) : (
                    <>
                      <span>Already have an account? </span>
                      <button 
                        type="button"
                        onClick={() => {
                          console.info("[Auth Page] 🔄 Switching to Sign In view.");
                          setIsLogin(true);
                        }} 
                        className="font-medium text-primary hover:underline"
                      >
                        Sign In
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
