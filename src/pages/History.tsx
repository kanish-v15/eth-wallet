import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { getCurrentUser, getTransactions } from '@/utils/storage';
import { formatAddress } from '@/utils/wallet';
import type { Transaction } from '@/utils/storage';

const History = () => {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const currentUser = getCurrentUser();
    
    if (!currentUser || !currentUser.isLoggedIn) {
      navigate('/login');
      return;
    }

    setTransactions(getTransactions());
  }, [navigate]);

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
          <h1 className="text-3xl font-bold text-foreground mb-6">Transaction History</h1>

          {transactions.length === 0 ? (
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
                <div 
                  key={tx.id} 
                  className="flex items-center justify-between p-5 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors border border-border"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      tx.type === 'sent' 
                        ? 'bg-destructive/20' 
                        : 'bg-success/20'
                    }`}>
                      {tx.type === 'sent' ? (
                        <ArrowUpRight className="w-6 h-6 text-destructive" />
                      ) : (
                        <ArrowDownLeft className="w-6 h-6 text-success" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground capitalize">{tx.type}</p>
                        <Badge 
                          variant={tx.status === 'success' ? 'default' : 'secondary'}
                          className={
                            tx.status === 'success' 
                              ? 'bg-success text-success-foreground' 
                              : tx.status === 'pending'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-destructive text-destructive-foreground'
                          }
                        >
                          {tx.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground font-mono">{formatAddress(tx.address)}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {new Date(tx.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-xl font-bold ${
                      tx.type === 'sent' ? 'text-destructive' : 'text-success'
                    }`}>
                      {tx.type === 'sent' ? '-' : '+'}{tx.amount} ETH
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

export default History;
