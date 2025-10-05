import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getCurrentUser, getTransactions, getWallet } from '@/utils/storage';
import { formatAddress } from '@/utils/wallet';
import type { Transaction } from '@/utils/storage';
import { transactionsApi, handleApiError } from '@/utils/api';
import { toast } from 'react-hot-toast';

const History = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const wallet = getWallet();

  useEffect(() => {
    const currentUser = getCurrentUser();

    if (!currentUser) {
      navigate('/login');
      return;
    }

    // LOAD LOCAL TRANSACTIONS FIRST (for immediate display)
    const localTxs = getTransactions();
    if (localTxs.length > 0) {
      setTransactions(localTxs);
    }

    // THEN FETCH FROM BACKEND (only once on mount)
    if (wallet && wallet.address) {
      fetchTransactionHistory();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]); // Only depend on navigate, not wallet

  const fetchTransactionHistory = async () => {
    if (!wallet) return;

    setIsLoading(true);
    try {
      // 🔥 FETCH TRANSACTION HISTORY FROM BACKEND (limit 50, offset 0)
      const response = await transactionsApi.getHistory(wallet.address, 50, 0);
      console.log('Transaction history response:', response);

      if (response.transactions && response.transactions.length > 0) {
        setTransactions(response.transactions);
      } else if (response.transactions) {
        // Empty array from backend - clear local transactions
        setTransactions([]);
      }
    } catch (error) {
      console.error('Failed to fetch transaction history:', error);
      // Keep local transactions on error
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <Card className="p-8 bg-card border-border">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-foreground">Transaction History</h1>
            {isLoading && <span className="text-sm text-muted-foreground">Loading...</span>}
          </div>

          {transactions.length === 0 && !isLoading ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center mx-auto mb-4">
                <ArrowUpRight className="w-10 h-10 text-muted-foreground" />
              </div>
              <p className="text-xl text-muted-foreground mb-2">No transactions yet</p>
              <p className="text-sm text-muted-foreground">Your transaction history will appear here</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <Link
                  key={tx.id}
                  to={`/transaction/${tx.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors border border-border cursor-pointer">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${wallet && tx.from_address === wallet.address
                        ? 'bg-destructive/20'
                        : 'bg-success/20'
                        }`}>
                        {wallet && tx.from_address === wallet.address ? (
                          <ArrowUpRight className="w-6 h-6 text-destructive" />
                        ) : (
                          <ArrowDownLeft className="w-6 h-6 text-success" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-foreground capitalize">
                            {wallet && tx.from_address === wallet.address ? 'Sent' : 'Received'}
                          </p>
                          <Badge
                            variant={tx.status === 'completed' ? 'default' : 'secondary'}
                            className={
                              tx.status === 'completed'
                                ? 'bg-success text-success-foreground'
                                : tx.status === 'pending'
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-destructive text-destructive-foreground'
                            }
                          >
                            {tx.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">
                          {formatAddress(wallet && tx.from_address === wallet.address ? tx.to_address : tx.from_address)}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(tx.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`text-xl font-bold ${wallet && tx.from_address === wallet.address ? 'text-destructive' : 'text-success'
                        }`}>
                        {wallet && tx.from_address === wallet.address ? '-' : '+'}{tx.amount} ETH
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default History;
