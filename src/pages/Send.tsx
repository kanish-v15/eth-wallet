import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ArrowLeft, ArrowUpRight, AlertCircle } from 'lucide-react';
import { getWallet, getCurrentUser, addTransaction } from '@/utils/storage';
import { ethToUsd, usdToEth } from '@/utils/wallet';
import { toast } from 'react-hot-toast';
import { sendTransactionSchema, getValidationError } from '@/utils/validation';
import { ethers } from 'ethers';
import { transferApi, walletApi, priceApi, handleApiError } from '@/utils/api';

const Send = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(getWallet());
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState<'ETH' | 'USD'>('ETH');
  const [showModal, setShowModal] = useState(false);
  const [countdown, setCountdown] = useState(30);
  const [isSigning, setIsSigning] = useState(false);
  const [ethPrice, setEthPrice] = useState(2500);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentWallet = getWallet();

    if (!currentUser || !currentWallet) {
      navigate('/login');
      return;
    }

    setWallet(currentWallet);

    // Fetch live ETH price
    fetchEthPrice();
  }, [navigate]);

  const fetchEthPrice = async () => {
    try {
      const response = await priceApi.getEthPrice();
      if (response.success && response.price) {
        setEthPrice(response.price);
      }
    } catch (error) {
      console.error('Failed to fetch ETH price:', error);
      // Keep default price
    }
  };

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
    // Validate inputs using Zod schema
    const validation = sendTransactionSchema.safeParse({
      recipient,
      amount: currency === 'ETH' ? amount : usdToEth(amount),
    });

    if (!validation.success) {
      toast.error(getValidationError(validation.error));
      return;
    }

    // Additional security check: verify address checksum
    if (!ethers.utils.isAddress(recipient)) {
      toast.error('Invalid Ethereum address format');
      return;
    }

    const amountNum = parseFloat(amount);
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
    if (!wallet) {
      toast.error('Wallet not found');
      return;
    }

    setIsSigning(true);

    try {
      // 🔥 STEP 1: PREPARE TRANSFER WITH BACKEND
      console.log('Step 1: Preparing transfer...');
      let prepareResponse;

      if (currency === 'ETH') {
        prepareResponse = await transferApi.prepareTransfer(
          wallet.address,
          recipient,
          parseFloat(amount)
        );
      } else {
        prepareResponse = await transferApi.prepareTransferUSD(
          wallet.address,
          recipient,
          parseFloat(amount)
        );
      }

      console.log('Prepare response:', prepareResponse);

      if (!prepareResponse.success) {
        toast.error(prepareResponse.message || 'Failed to prepare transaction');
        return;
      }

      const messageToSign = prepareResponse.message;

      // 🔥 STEP 2: GET WALLET MNEMONIC
      console.log('Step 2: Fetching wallet mnemonic...');
      const walletsResponse = await walletApi.list(true);
      console.log('Wallets with mnemonics:', walletsResponse);

      if (!walletsResponse.wallets) {
        toast.error('Failed to fetch wallet information');
        return;
      }

      // Find the current wallet in the list
      const currentWalletData = walletsResponse.wallets.find(
        (w: any) => w.address.toLowerCase() === wallet.address.toLowerCase()
      );

      if (!currentWalletData || !currentWalletData.mnemonic) {
        toast.error('Wallet mnemonic not found. Cannot sign transaction.');
        return;
      }

      // 🔥 STEP 3: SIGN MESSAGE WITH MNEMONIC
      console.log('Step 3: Signing message...');
      const signResponse = await walletApi.signMessage(
        messageToSign,
        wallet.address,
        currentWalletData.mnemonic
      );

      console.log('Sign response:', signResponse);

      if (!signResponse.success || !signResponse.signature) {
        toast.error(signResponse.message || 'Failed to sign transaction');
        return;
      }

      const signature = signResponse.signature;

      // 🔥 STEP 4: EXECUTE TRANSFER WITH SIGNATURE
      console.log('Step 4: Executing transfer...');
      const executeResponse = await transferApi.executeTransfer(
        messageToSign,
        signature,
        wallet.address
      );

      console.log('Execute response:', executeResponse);

      if (!executeResponse.success) {
        toast.error(executeResponse.message || 'Transaction execution failed');
        return;
      }

      // STEP 5: ADD TRANSACTION TO LOCAL HISTORY
      if (executeResponse.transaction) {
        const transaction = {
          id: executeResponse.transaction.id,
          from_address: executeResponse.transaction.from_address,
          to_address: executeResponse.transaction.to_address,
          amount: executeResponse.transaction.amount.toString(),
          status: executeResponse.transaction.status as 'completed' | 'pending' | 'failed',
          signature: executeResponse.transaction.signature,
          created_at: executeResponse.transaction.created_at,
        };

        addTransaction(transaction);
      }

      // STEP 6: UPDATE LOCAL BALANCE
      const ethAmount = prepareResponse.amount || prepareResponse.eth_amount;
      if (ethAmount) {
        const newBalance = (parseFloat(wallet.balance) - parseFloat(ethAmount)).toFixed(4);
        const updatedWallet = { ...wallet, balance: newBalance };
        localStorage.setItem('wallet', JSON.stringify(updatedWallet));
      }

      toast.success('Transaction sent successfully! 🔥');
      setShowModal(false);
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
      console.error('Transaction error:', error);
    } finally {
      setIsSigning(false);
    }
  };

  if (!wallet) {
    return null;
  }

  const displayAmount = currency === 'ETH' ? amount : (amount ? ethToUsd(usdToEth(amount, ethPrice), ethPrice) : '');
  const convertedAmount = currency === 'ETH'
    ? (amount ? `≈ $${ethToUsd(amount, ethPrice)}` : '')
    : (amount ? `≈ ${usdToEth(amount, ethPrice)} ETH` : '');

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

          {/* Security Warning */}
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-destructive font-semibold mb-1">Security Notice</p>
              <p className="text-destructive/90">Always verify the recipient address. Transactions cannot be reversed.</p>
            </div>
          </div>

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
                  <span className="text-foreground">{usdToEth(amount, ethPrice)} ETH</span>
                </div>
              )}
            </div>

            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
              <p className="text-sm text-destructive mb-2 font-semibold">Message to Sign:</p>
              <p className="text-xs text-destructive/80 font-mono break-all">
                Transfer {currency === 'ETH' ? amount : usdToEth(amount, ethPrice)} ETH to {recipient}
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
