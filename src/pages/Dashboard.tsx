import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, ArrowDownLeft, Clock, Settings, LogOut, Copy, Check } from 'lucide-react';
import { getCurrentUser, getWallet, getTransactions, clearAllData, setWallet as saveWallet } from '@/utils/storage';
import { formatAddress } from '@/utils/wallet';
import { toast } from 'react-hot-toast';
import { walletApi, priceApi, transactionsApi, handleApiError } from '@/utils/api';

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(getCurrentUser());
  const [wallet, setWallet] = useState(getWallet());
  const [transactions, setTransactions] = useState(getTransactions());
  const [copied, setCopied] = useState(false);
  const [ethPrice, setEthPrice] = useState(2500); // Default price
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentWallet = getWallet();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (!currentWallet) {
      navigate('/wallet-setup');
      return;
    }

    setUser(currentUser);
    setWallet(currentWallet);

    // FETCH LIVE DATA FROM BACKEND
    fetchLiveData(currentWallet);
  }, [navigate]);

  const fetchLiveData = async (currentWallet: any) => {
    try {
      // 🔥 FETCH LIVE ETH PRICE
      const priceResponse = await priceApi.getEthPrice();
      if (priceResponse.success) {
        setEthPrice(priceResponse.price);
      }

      // 🔥 FETCH LIVE WALLET BALANCE
      setIsLoadingBalance(true);
      const balanceResponse = await walletApi.getBalance(currentWallet.address);
      if (balanceResponse.balance !== undefined) {
        const updatedWallet = {
          ...currentWallet,
          balance: balanceResponse.balance.toString(),
        };
        setWallet(updatedWallet);
        saveWallet(updatedWallet);
      }

      // 🔥 FETCH RECENT TRANSACTIONS
      try {
        const txResponse = await transactionsApi.getRecent(5);
        console.log('Recent transactions:', txResponse);
        if (txResponse.transactions) {
          setTransactions(txResponse.transactions);
        }
      } catch (txError) {
        console.error('Failed to fetch transactions:', txError);
        // Fallback to local transactions
        setTransactions(getTransactions());
      }
    } catch (error) {
      // Silent fail for price/balance fetch - use cached data
      console.error('Failed to fetch live data:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleLogout = () => {
    clearAllData();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleCopyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success('Address copied!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wallet || !user) {
    return null;
  }

  const recentTransactions = transactions.slice(0, 5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      {/* Header */}
      <div className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-foreground">Web3 Wallet</h1>
            <div className="flex items-center gap-2 bg-secondary px-3 py-1.5 rounded-full">
              <div className="text-sm text-muted-foreground">
                {formatAddress(wallet.address)}
              </div>
              <button onClick={handleCopyAddress} className="text-primary hover:text-accent transition-colors">
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-foreground font-semibold hidden sm:inline">
              {user.first_name} {user.last_name}
            </span>
            <Link to="/profile">
              <Button variant="ghost" size="icon" title="Profile">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Balance Card */}
        <Card className="p-8 bg-gradient-to-br from-primary/20 to-accent/20 border-primary/30 mb-6">
          <div className="text-center">
            <p className="text-muted-foreground mb-2">Total Balance</p>
            <h2 className="text-5xl font-bold text-foreground mb-2">
              {isLoadingBalance ? 'Loading...' : `${wallet.balance} ETH`}
            </h2>
            <p className="text-xl text-muted-foreground">
              ${(parseFloat(wallet.balance) * ethPrice).toFixed(2)} USD
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              ETH Price: ${ethPrice.toFixed(2)}
            </p>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Link to="/send" className="block">
            <Card className="p-6 bg-card border-border hover:border-primary transition-all cursor-pointer group text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-destructive to-destructive/60 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <ArrowUpRight className="w-6 h-6 text-destructive-foreground" />
              </div>
              <p className="font-semibold text-foreground">Send</p>
            </Card>
          </Link>

          <Link to="/receive" className="block">
            <Card className="p-6 bg-card border-border hover:border-primary transition-all cursor-pointer group text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-success to-success/60 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <ArrowDownLeft className="w-6 h-6 text-success-foreground" />
              </div>
              <p className="font-semibold text-foreground">Receive</p>
            </Card>
          </Link>

          <Link to="/history" className="block">
            <Card className="p-6 bg-card border-border hover:border-primary transition-all cursor-pointer group text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Clock className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="font-semibold text-foreground">History</p>
            </Card>
          </Link>

          <Link to="/wallets" className="block">
            <Card className="p-6 bg-card border-border hover:border-primary transition-all cursor-pointer group text-center">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                <Settings className="w-6 h-6 text-primary-foreground" />
              </div>
              <p className="font-semibold text-foreground">Wallets</p>
            </Card>
          </Link>
        </div>

        {/* Recent Transactions */}
        <Card className="p-6 bg-card border-border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-foreground">Recent Transactions</h3>
            <Link to="/history" className="text-primary hover:text-accent transition-colors text-sm font-semibold">
              View All
            </Link>
          </div>

          {recentTransactions.length === 0 ? (
            <div className="text-center py-12">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-muted-foreground">No transactions yet</p>
              <p className="text-sm text-muted-foreground mt-1">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${tx.from_address === wallet.address ? 'bg-destructive/20' : 'bg-success/20'
                      }`}>
                      {tx.from_address === wallet.address ? (
                        <ArrowUpRight className="w-5 h-5 text-destructive" />
                      ) : (
                        <ArrowDownLeft className="w-5 h-5 text-success" />
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground capitalize">
                        {tx.from_address === wallet.address ? 'Sent' : 'Received'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formatAddress(tx.from_address === wallet.address ? tx.to_address : tx.from_address)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${tx.from_address === wallet.address ? 'text-destructive' : 'text-success'
                      }`}>
                      {tx.from_address === wallet.address ? '-' : '+'}{tx.amount} ETH
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
