import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { z } from 'zod';
import { usePWA } from '@/hooks/usePWA';

const authSchema = z.object({
  email: z.string().trim().email({ message: "Invalid email address" }).max(255),
  password: z.string()
    .min(8, { message: "Password must be at least 8 characters" })
    .max(72, { message: "Password must be less than 72 characters" })
    .regex(/[A-Z]/, { message: "Password must contain at least one uppercase letter" })
    .regex(/[a-z]/, { message: "Password must contain at least one lowercase letter" })
    .regex(/[0-9]/, { message: "Password must contain at least one number" })
});

// Sign in only checks the email format and that a password was entered: the
// strength rules above are for new passwords. Applying them here blocked existing
// accounts whose password doesn't meet them before the server was even asked.
const signInSchema = z.object({
  email: authSchema.shape.email,
  password: z.string().min(1, { message: 'Please enter your password' }),
});

const PASSWORD_MISMATCH = "Passwords don't match";

const passwordsMatch = (data: { password: string; confirmPassword: string }) =>
  data.password === data.confirmPassword;

const signUpSchema = authSchema
  .extend({ confirmPassword: z.string() })
  .refine(passwordsMatch, { message: PASSWORD_MISMATCH, path: ['confirmPassword'] });

const newPasswordSchema = z
  .object({ password: authSchema.shape.password, confirmPassword: z.string() })
  .refine(passwordsMatch, { message: PASSWORD_MISMATCH, path: ['confirmPassword'] });

const Auth = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const openedFromRecovery = (location.state as { recovery?: boolean } | null)?.recovery === true;
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(openedFromRecovery);
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const { isIOS, isStandalone } = usePWA();
  const containerClass = "min-h-[100svh] bg-background p-4 flex items-center justify-center";

  useEffect(() => {
    // Check if this is a password recovery flow FIRST
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    const isRecovery = type === 'recovery' || openedFromRecovery;

    if (isRecovery) {
      setIsPasswordRecovery(true);
      return; // Don't redirect if it's a recovery flow
    }

    // Only check session and redirect if NOT in recovery flow
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkSession();
  }, [navigate, openedFromRecovery]);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = signUpSchema.parse({ email, password, confirmPassword });

      const redirectUrl = `${window.location.origin}/`;
      
      const { data, error } = await supabase.auth.signUp({
        email: validatedData.email,
        password: validatedData.password,
        options: {
          emailRedirectTo: redirectUrl
        }
      });

      if (error) throw error;

      // When email confirmation is on, Supabase hides existing accounts by returning a
      // "successful" fake user with no identities instead of an error.
      if (data.user && data.user.identities?.length === 0) {
        toast.error('This email is already registered. Try signing in, or use "Forgot password".');
        return;
      }

      toast.success('Check your email for the confirmation link!');
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error((error as Error).message || 'Failed to sign up');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate input
      const validatedData = signInSchema.parse({ email, password });

      const { data, error } = await supabase.auth.signInWithPassword({
        email: validatedData.email,
        password: validatedData.password,
      });

      if (error) throw error;

      if (data.user) {
        navigate('/');
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error((error as Error).message || 'Failed to sign in');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email address');
      return;
    }

    setResetLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth`,
      });

      if (error) throw error;

      toast.success('Password reset email sent! Check your inbox.');
    } catch (error) {
      toast.error((error as Error).message || 'Failed to send reset email');
    } finally {
      setResetLoading(false);
    }
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate password
      const validatedData = newPasswordSchema.parse({
        password: newPassword,
        confirmPassword: confirmNewPassword,
      });

      const { error } = await supabase.auth.updateUser({
        password: validatedData.password,
      });

      if (error) throw error;

      toast.success('Password updated successfully!');
      setIsPasswordRecovery(false);
      navigate('/', { replace: true });
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error((error as Error).message || 'Failed to update password');
      }
    } finally {
      setLoading(false);
    }
  };

  // Show password reset form if this is a recovery flow
  if (isPasswordRecovery) {
    return (
      <div className={containerClass}>
        <Card className={`w-full max-w-md relative z-20 ${isIOS && isStandalone ? 'ios-auth-fix' : ''}`}>
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Reset Password</CardTitle>
            <CardDescription>
              Enter your new password below
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input
                  id="new-password"
                  type="password"
                  placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="next"
                  required
                  minLength={8}
                  onTouchEnd={(e) => e.currentTarget.focus()}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                <Input
                  id="confirm-new-password"
                  type="password"
                  placeholder="Re-enter your new password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  autoComplete="new-password"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  enterKeyHint="done"
                  required
                  onTouchEnd={(e) => e.currentTarget.focus()}
                />
                {confirmNewPassword && confirmNewPassword !== newPassword && (
                  <p className="text-xs text-destructive">{PASSWORD_MISMATCH}</p>
                )}
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Updating password...' : 'Update Password'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <Card className={`w-full max-w-md relative z-20 ${isIOS && isStandalone ? 'ios-auth-fix' : ''}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome</CardTitle>
          <CardDescription>
            Sign in to your account or create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>
            
            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    required
                    onTouchEnd={(e) => e.currentTarget.focus()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="go"
                    required
                    onTouchEnd={(e) => e.currentTarget.focus()}
                  />
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={resetLoading}
                    className="text-sm text-primary hover:underline"
                  >
                    {resetLoading ? 'Sending...' : 'Forgot Password?'}
                  </button>
                </div>
                <Button type="submit" className="w-full relative z-30 pointer-events-auto" disabled={loading}>
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </form>
            </TabsContent>
            
            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    required
                    onTouchEnd={(e) => e.currentTarget.focus()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Min 8 chars, 1 uppercase, 1 lowercase, 1 number"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="next"
                    required
                    minLength={8}
                    onTouchEnd={(e) => e.currentTarget.focus()}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                  <Input
                    id="signup-confirm-password"
                    type="password"
                    placeholder="Re-enter your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    enterKeyHint="done"
                    required
                    onTouchEnd={(e) => e.currentTarget.focus()}
                  />
                  {confirmPassword && confirmPassword !== password && (
                    <p className="text-xs text-destructive">{PASSWORD_MISMATCH}</p>
                  )}
                </div>
                <Button type="submit" className="w-full relative z-30 pointer-events-auto" disabled={loading}>
                  {loading ? 'Creating account...' : 'Sign Up'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;