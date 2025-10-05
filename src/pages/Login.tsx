import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { getCurrentUser, setCurrentUser, getWallet } from '@/utils/storage';
import { toast } from 'react-hot-toast';
import { loginFormSchema, getValidationError } from '@/utils/validation';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs using Zod schema
    const validation = loginFormSchema.safeParse({
      email,
      password,
    });

    if (!validation.success) {
      toast.error(getValidationError(validation.error));
      return;
    }

    // Simple mock login - just save to localStorage
    const user = {
      email: validation.data.email,
      username: validation.data.email.split('@')[0],
      userId: 'user_' + Math.random().toString(36).substr(2, 9),
      isLoggedIn: true,
    };

    setCurrentUser(user);
    
    // Check if wallet exists
    const wallet = getWallet();
    if (wallet) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.success('Account found! Please set up your wallet.');
      navigate('/wallet-setup');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-4">
      <Card className="w-full max-w-md p-8 bg-card border-border">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4">
            <Wallet className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Web3 Wallet</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-foreground">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-input border-border text-foreground"
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
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary hover:text-accent transition-colors font-semibold">
              Create Account
            </Link>
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Login;
