import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Wallet, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { signupFormSchema, getValidationError } from '@/utils/validation';
import { authApi, handleApiError } from '@/utils/api';

const Signup = () => {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // Prevent double submission
    if (isLoading) {
      return;
    }

    // Validate all inputs using Zod schema
    const validation = signupFormSchema.safeParse({
      email,
      username: firstName, // Reuse username field for firstName validation
      password,
      confirmPassword,
    });

    if (!validation.success) {
      toast.error(getValidationError(validation.error));
      return;
    }

    if (!lastName.trim()) {
      toast.error('Last name is required');
      return;
    }

    setIsLoading(true);

    try {
      // STEP 1: CREATE USER ACCOUNT
      const signupResponse = await authApi.signup(
        validation.data.email,
        password,
        firstName.trim(),
        lastName.trim()
      );

      if (!signupResponse.success) {
        toast.error(signupResponse.message || 'Signup failed');
        setIsLoading(false);
        return;
      }

      // STEP 2: DO NOT AUTO-LOGIN - Redirect to login page
      // This ensures proper authentication flow
      toast.success('Account created successfully! Please sign in. 🔥');
      navigate('/login');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Create Account</h1>
          <p className="text-muted-foreground mt-2">Join Web3 Wallet today</p>
        </div>

        <form onSubmit={handleSignup} className="space-y-6" noValidate>
          {/* Password Requirements Info */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
              <div className="text-sm text-primary">
                <p className="font-semibold mb-1">Password Requirements:</p>
                <ul className="list-disc list-inside space-y-0.5 text-primary/90">
                  <li>At least 12 characters long</li>
                  <li>Contains uppercase and lowercase letters</li>
                  <li>Contains at least one number</li>
                  <li>Contains at least one special character</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
              autoComplete="email"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="firstName" className="text-foreground">First Name</Label>
            <Input
              id="firstName"
              type="text"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
              autoComplete="given-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastName" className="text-foreground">Last Name</Label>
            <Input
              id="lastName"
              type="text"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
              autoComplete="family-name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-foreground">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
              autoComplete="new-password"
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:text-accent transition-colors font-semibold">
              Sign In
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Signup;
