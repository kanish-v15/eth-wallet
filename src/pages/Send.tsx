import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowUpRight } from 'lucide-react';
import { getWallet, getCurrentUser, addTransaction } from '@/utils/storage';
import { ethToUsd, usdToEth, signMessage } from '@/utils/wallet';
import { toast } from 'react-hot-toast';

const Send = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(getWallet());
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'ETH' | 'USD'>('ETH');
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSigning, setIsSigning] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentWallet = getWallet();
    
    if (!currentUser || !currentUser.isLoggedIn || !currentWallet) {
      navigate('/login');
      return;
    }

    setWallet(currentWallet);
  }, [navigate]);

  useEffect(() => {
    if (showModal && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showModal && countdown === 0) {
      toast.error('Transaction expired');
      setShowModal(false);
      setCountdown(30);
    }
  }, [showModal, countdown]);

  const handleReview = () => {
    if (!recipient || !amount) {
      toast.error('Please fill in all fields');
      return;
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      toast.error('Invalid amount');
      return;
    }

    if (wallet) {
      const ethAmount = currency === 'ETH' ? amountNum : parseFloat(usdToEth(amount));
      if (ethAmount > parseFloat(wallet.balance)) {
        toast.error('Insufficient balance');
        return;
      }
    }

    setShowModal(true);
    setCountdown(30);
  };

  const handleSignAndSend = async () => {
    if (!wallet) return;

    setIsSigning(true);
    
    try {
      const ethAmount = currency === 'ETH' ? amount : usdToEth(amount);
      const message = `Transfer ${ethAmount} ETH to ${recipient}`;
      
      // Sign the message
      const signature = await signMessage(wallet.privateKey, message);
      
      // Simulate transaction
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add transaction to history
      const transaction = {
        id: 'tx_' + Date.now(),
        type: 'sent' as const,
        amount: ethAmount,
        address: recipient,
        timestamp: Date.now(),
        status: 'success' as const,
      };
      
      addTransaction(transaction);
      
      // Update balance
      const newBalance = (parseFloat(wallet.balance) - parseFloat(ethAmount)).toFixed(4);
      const updatedWallet = { ...wallet, balance: newBalance };
      localStorage.setItem('wallet', JSON.stringify(updatedWallet));
      
      toast.success('Transaction sent successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Transaction failed');
      console.error(error);
    } finally {
      setIsSigning(false);
    }
  };

  if (!wallet) {
    return null;
  }

  const displayAmount = currency === 'ETH' ? amount : (amount ? ethToUsd(usdToEth(amount)) : '');
  const convertedAmount = currency === 'ETH' 
    ? (amount ? `≈ $${ethToUsd(amount)}` : '')
    : (amount ? `≈ ${usdToEth(amount)} ETH` : '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="p-8 bg-card border-border">
          <h1 className="text-3xl font-bold text-foreground mb-6">Send Transaction</h1>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="recipient" className="text-foreground">Recipient Address</Label>
              <Input
                id="recipient"
                placeholder="0x..."
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                className="bg-input border-border text-foreground font-mono"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="amount" className="text-foreground">Amount</Label>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={currency === 'ETH' ? 'default' : 'outline'}
                    onClick={() => setCurrency('ETH')}
                    className={currency === 'ETH' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    ETH
                  </Button>
                  <Button
                    size="sm"
                    variant={currency === 'USD' ? 'default' : 'outline'}
                    onClick={() => setCurrency('USD')}
                    className={currency === 'USD' ? 'bg-primary text-primary-foreground' : ''}
                  >
                    USD
                  </Button>
                </div>
              </div>
              <Input
                id="amount"
                type="number"
                step="0.000001"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="bg-input border-border text-foreground text-xl"
              />
              {convertedAmount && (
                <p className="text-sm text-muted-foreground">{convertedAmount}</p>
              )}
            </div>

            <div className="bg-secondary rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-muted-foreground">Available Balance</span>
                <span className="text-foreground font-semibold">{wallet.balance} ETH</span>
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground font-semibold"
              onClick={handleReview}
            >
              Review Transaction
            </Button>
          </div>
        </Card>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Review Transaction</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="bg-secondary rounded-lg p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">To</span>
                <span className="text-foreground font-mono text-sm">{recipient.slice(0, 10)}...</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="text-foreground font-semibold">
                  {currency === 'ETH' ? `${amount} ETH` : `$${amount}`}
                </span>
              </div>
              {currency === 'USD' && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ETH Amount</span>
                  <span className="text-foreground">{usdToEth(amount)} ETH</span>
                </div>
              )}
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive mb-2 font-semibold">Message to Sign:</p>
              <p className="text-xs text-destructive/80 font-mono break-all">
                Transfer {currency === 'ETH' ? amount : usdToEth(amount)} ETH to {recipient}
              </p>
            </div>

            <div className="flex items-center justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <span className="text-2xl font-bold text-primary-foreground">{countdown}s</span>
              </div>
            </div>

            <Button 
              className="w-full bg-gradient-to-r from-destructive to-destructive/80 text-destructive-foreground font-semibold"
              onClick={handleSignAndSend}
              disabled={isSigning}
            >
              {isSigning ? (
                'Signing...'
              ) : (
                <>
                  <ArrowUpRight className="w-4 h-4 mr-2" />
                  Sign & Send Transaction
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Send;
