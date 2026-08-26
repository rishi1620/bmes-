import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { Dna, Loader2, LogIn, UserPlus, KeyRound, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

function formatAuthError(error: Error | { message?: string; code?: string } | null): string {
  if (!error) return "An error occurred.";
  const msg = error.message || String(error);
  const code = (error as { code?: string })?.code || "";

  if (code === "auth/invalid-credential" || msg.includes("invalid-credential")) {
    return "Incorrect email or password. If you haven't created an account yet, please switch to Sign Up.";
  }
  if (code === "auth/user-not-found" || msg.includes("user-not-found")) {
    return "No account found with this email. Please click Sign Up to create your account.";
  }
  if (code === "auth/wrong-password" || msg.includes("wrong-password")) {
    return "Incorrect password. Please verify your password or click 'Forgot password'.";
  }
  if (code === "auth/email-already-in-use" || msg.includes("email-already-in-use") || msg.includes("already registered")) {
    return "An account with this email already exists. Please Sign In instead.";
  }
  if (code === "auth/weak-password" || msg.includes("weak-password")) {
    return "Password is too weak. Please use at least 6 characters.";
  }
  if (code === "auth/invalid-email" || msg.includes("invalid-email")) {
    return "Please enter a valid email address.";
  }
  if (code === "auth/too-many-requests" || msg.includes("too-many-requests")) {
    return "Too many unsuccessful attempts. Please wait a moment or reset your password.";
  }

  return msg.replace(/^Firebase:\s*/i, "").replace(/\(auth\/[^)]+\)\.?/i, "").trim() || "Authentication failed.";
}

const Auth = () => {
  const { user, loading, signIn, signUp, resetPassword } = useAuth();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Derive redirection target from navigation state if available
  const redirectTarget = (location.state as { from?: { pathname?: string } })?.from?.pathname || "/admin";

  useEffect(() => {
    console.info(`[Auth Page] 📄 Auth route mounted. State:`, {
      loading,
      hasUser: !!user,
      userId: user?.id,
      email: user?.email,
      targetAfterAuth: redirectTarget,
      pathname: location.pathname,
    });
  }, [loading, user, redirectTarget, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
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
    return <Navigate to={redirectTarget} replace />;
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMessage(null);

    if (isForgotPassword) {
      const { error } = await resetPassword(email);
      setSubmitting(false);
      if (error) {
        const readable = formatAuthError(error);
        setErrorMessage(readable);
        toast({ title: "Reset Failed", description: readable, variant: "destructive" });
      } else {
        toast({ title: "Reset Link Sent", description: "Please check your inbox for password reset instructions." });
        setIsForgotPassword(false);
        setIsLogin(true);
      }
      return;
    }

    if (isLogin) {
      const { error } = await signIn(email, password);
      setSubmitting(false);

      if (error) {
        const readable = formatAuthError(error);
        setErrorMessage(readable);
        toast({ title: "Sign In Error", description: readable, variant: "destructive" });
      } else {
        toast({ title: "Welcome back!", description: "Signed in successfully." });
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      setSubmitting(false);

      if (error) {
        const readable = formatAuthError(error);
        setErrorMessage(readable);
        if (readable.includes("already exists")) {
          setIsLogin(true);
        }
        toast({ title: "Sign Up Error", description: readable, variant: "destructive" });
      } else {
        toast({ title: "Account Created!", description: "Welcome to CUET BMES Portal." });
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.25 }}
        className="w-full max-w-md"
      >
        <Card className="border-border shadow-lg">
          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.4, type: "spring" }}
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow"
            >
              <Dna className="h-6 w-6" />
            </motion.div>
            <CardTitle className="text-xl font-bold">
              {isForgotPassword ? "Reset Password" : isLogin ? "Member & Admin Login" : "Create BMES Account"}
            </CardTitle>
            <CardDescription>CUET Biomedical Engineering Society</CardDescription>

            {!isForgotPassword && (
              <div className="mt-4 grid grid-cols-2 gap-1 rounded-lg bg-muted p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
                    isLogin
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <LogIn className="h-3.5 w-3.5" />
                  <span>Sign In</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setErrorMessage(null);
                  }}
                  className={`flex items-center justify-center gap-1.5 rounded-md py-2 transition-all ${
                    !isLogin
                      ? "bg-background text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <UserPlus className="h-3.5 w-3.5" />
                  <span>Sign Up</span>
                </button>
              </div>
            )}
          </CardHeader>

          <CardContent>
            {errorMessage && (
              <Alert variant="destructive" className="mb-4 text-xs py-2.5">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex flex-col gap-1.5 mt-0.5">
                  <span>{errorMessage}</span>
                  {errorMessage.includes("Sign Up") && isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(false);
                        setErrorMessage(null);
                      }}
                      className="text-left font-semibold underline hover:no-underline"
                    >
                      Click here to create a new account →
                    </button>
                  )}
                </AlertDescription>
              </Alert>
            )}

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
                    <Label htmlFor="name" className="text-xs">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g. Hrictik Dastidar"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-xs">Password</Label>
                    {isLogin && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsForgotPassword(true);
                          setErrorMessage(null);
                        }}
                        className="text-xs text-primary hover:underline"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
              )}

              <Button type="submit" className="w-full gap-2 mt-2" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Please wait...</span>
                  </>
                ) : isForgotPassword ? (
                  <>
                    <KeyRound className="h-4 w-4" />
                    <span>Send Reset Link</span>
                  </>
                ) : isLogin ? (
                  <>
                    <LogIn className="h-4 w-4" />
                    <span>Sign In</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4" />
                    <span>Create Account</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-5 text-center text-xs text-muted-foreground border-t border-border/60 pt-4">
              {isForgotPassword ? (
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotPassword(false);
                    setIsLogin(true);
                    setErrorMessage(null);
                  }}
                  className="font-medium text-primary hover:underline"
                >
                  ← Back to Login
                </button>
              ) : isLogin ? (
                <span>
                  Don't have an account yet?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(false);
                      setErrorMessage(null);
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign Up here
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsLogin(true);
                      setErrorMessage(null);
                    }}
                    className="font-semibold text-primary hover:underline"
                  >
                    Sign In here
                  </button>
                </span>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default Auth;
