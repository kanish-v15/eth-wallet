import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Wallet } from 'lucide-react';
import { setCurrentUser, setTokens, getWallet, setWallet } from '@/utils/storage';
import { toast } from 'react-hot-toast';
import { loginFormSchema, getValidationError } from '@/utils/validation';
import { authApi, walletApi, handleApiError } from '@/utils/api';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();

    // CRITICAL: Prevent any form submission behavior
    e.nativeEvent.preventDefault();
    e.nativeEvent.stopPropagation();

    // Prevent double submission
    if (isLoading) {
      return;
    }

    // Validate inputs using Zod schema
    const validation = loginFormSchema.safeParse({
      email,
      password,
    });

    if (!validation.success) {
      toast.error(getValidationError(validation.error));
      setIsLoading(false); // Ensure loading state is reset
      return;
    }

    setIsLoading(true);

    try {
      // STEP 1: AUTHENTICATE USER WITH BACKEND
      const loginResponse = await authApi.login(validation.data.email, password);

      if (!loginResponse.success) {
        toast.error(loginResponse.message || 'Login failed');
        setIsLoading(false);
        return;
      }

      // STEP 2: SAVE JWT TOKENS
      setTokens({
        access_token: loginResponse.access_token,
        refresh_token: loginResponse.refresh_token,
      });

      // STEP 3: SAVE USER DATA
      setCurrentUser(loginResponse.user);

      // STEP 4: CHECK IF USER HAS A WALLET
      // Check local storage first for better UX
      const localWallet = getWallet();

      if (localWallet && localWallet.address) {
        // USER HAS LOCAL WALLET - Verify it's valid
        console.log('Local wallet found:', localWallet.address);
        toast.success('Welcome back! 🔥');
        navigate('/dashboard');
        return;
      }

      // NO LOCAL WALLET - CHECK BACKEND
      try {
        const walletsResponse = await walletApi.list();
        console.log('Backend wallets:', walletsResponse);

        if (walletsResponse.wallets && walletsResponse.wallets.length > 0) {
          // USER HAS WALLETS ON BACKEND
          // Store the first wallet locally (user will need to import mnemonic separately)
          const backendWallet = walletsResponse.wallets[0];

          // Save basic wallet info (without private key - user needs to import)
          const walletData = {
            id: backendWallet.id,
            address: backendWallet.address,
            balance: backendWallet.balance?.toString() || '0',
            wallet_name: backendWallet.wallet_name,
            is_primary: backendWallet.is_primary,
          };

          setWallet(walletData);
          toast.success('Welcome back! 🔥');
          navigate('/dashboard');
        } else {
          // NO WALLETS FOUND - SETUP REQUIRED
          console.log('No wallets found, redirecting to setup');
          toast.success('Welcome! Let\'s set up your wallet.');
          navigate('/wallet-setup');
        }
      } catch (walletError) {
        console.error('Wallet check error:', walletError);
        // IF WALLET CHECK FAILS, GO TO WALLET SETUP
        toast.success('Welcome! Let\'s set up your wallet.');
        navigate('/wallet-setup');
      }
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
          <h1 className="text-3xl font-bold text-foreground">Web3 Wallet</h1>
          <p className="text-muted-foreground mt-2">Sign in to your account</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6" noValidate onReset={(e) => e.preventDefault()} onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}>
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
            <Label htmlFor="password" className="text-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-input border-border text-foreground"
              disabled={isLoading}
              autoComplete="current-password"
            />
          </div>

          <Button
            type="button"
            onClick={handleLogin}
            className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold hover:opacity-90 transition-opacity"
            disabled={isLoading}
          >
            {isLoading ? 'Signing In...' : 'Sign In'}
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
