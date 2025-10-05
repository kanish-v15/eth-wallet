import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowUpRight, ArrowDownLeft, Copy, Check, ExternalLink } from 'lucide-react';
import { getCurrentUser, getWallet } from '@/utils/storage';
import { formatAddress } from '@/utils/wallet';
import { toast } from 'react-hot-toast';
import { transactionsApi, handleApiError } from '@/utils/api';

interface TransactionDetail {
    id: string;
    from_address: string;
    to_address: string;
    amount: string;
    status: 'completed' | 'pending' | 'failed';
    signature?: string;
    transaction_hash?: string;
    gas_fee?: string;
    block_number?: number;
    created_at: string;
    updated_at?: string;
}

const TransactionDetails = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>();
    const [transaction, setTransaction] = useState<TransactionDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [copiedField, setCopiedField] = useState<string | null>(null);
    const wallet = getWallet();

    useEffect(() => {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            navigate('/login');
            return;
        }

        if (!id) {
            navigate('/history');
            return;
        }

        fetchTransactionDetails();
    }, [navigate, id]);

    const fetchTransactionDetails = async () => {
        if (!id) return;

        setIsLoading(true);
        try {
            const response = await transactionsApi.getById(id);
            console.log('Transaction details:', response);

            if (response.transaction) {
                setTransaction(response.transaction);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
            navigate('/history');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = (text: string, field: string) => {
        navigator.clipboard.writeText(text);
        setCopiedField(field);
        toast.success('Copied to clipboard!');
        setTimeout(() => setCopiedField(null), 2000);
    };

    if (!wallet) {
        return null;
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <Link to="/history">
                        <Button variant="ghost" className="mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to History
                        </Button>
                    </Link>
                    <Card className="p-8 bg-card border-border">
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading transaction details...</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (!transaction) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <Link to="/history">
                        <Button variant="ghost" className="mb-6">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to History
                        </Button>
                    </Link>
                    <Card className="p-8 bg-card border-border">
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Transaction not found</p>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    const isSent = wallet && transaction.from_address.toLowerCase() === wallet.address.toLowerCase();
    const txType = isSent ? 'sent' : 'received';

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
            <div className="max-w-4xl mx-auto px-4 py-8">
                <Link to="/history">
                    <Button variant="ghost" className="mb-6">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to History
                    </Button>
                </Link>

                <Card className="p-8 bg-card border-border">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isSent ? 'bg-destructive/20' : 'bg-success/20'
                                }`}>
                                {isSent ? (
                                    <ArrowUpRight className="w-8 h-8 text-destructive" />
                                ) : (
                                    <ArrowDownLeft className="w-8 h-8 text-success" />
                                )}
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-foreground capitalize">{txType}</h1>
                                <p className="text-muted-foreground">Transaction Details</p>
                            </div>
                        </div>
                        <Badge
                            variant={transaction.status === 'completed' ? 'default' : 'secondary'}
                            className={`text-lg px-4 py-2 ${transaction.status === 'completed'
                                ? 'bg-success text-success-foreground'
                                : transaction.status === 'pending'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'bg-destructive text-destructive-foreground'
                                }`}
                        >
                            {transaction.status}
                        </Badge>
                    </div>

                    {/* Amount */}
                    <div className="mb-8 text-center p-6 bg-secondary rounded-lg">
                        <p className="text-sm text-muted-foreground mb-2">Amount</p>
                        <p className={`text-5xl font-bold ${isSent ? 'text-destructive' : 'text-success'
                            }`}>
                            {isSent ? '-' : '+'}{transaction.amount} ETH
                        </p>
                    </div>

                    {/* Transaction Details */}
                    <div className="space-y-4">
                        {/* Transaction ID */}
                        <div className="bg-secondary rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-2">Transaction ID</p>
                            <div className="flex items-center justify-between">
                                <p className="text-foreground font-mono text-sm break-all">{transaction.id}</p>
                                <button
                                    onClick={() => handleCopy(transaction.id, 'id')}
                                    className="text-primary hover:text-accent transition-colors ml-2 flex-shrink-0"
                                >
                                    {copiedField === 'id' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* From Address */}
                        <div className="bg-secondary rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-2">From</p>
                            <div className="flex items-center justify-between">
                                <p className="text-foreground font-mono text-sm">{formatAddress(transaction.from_address)}</p>
                                <button
                                    onClick={() => handleCopy(transaction.from_address, 'from')}
                                    className="text-primary hover:text-accent transition-colors ml-2"
                                >
                                    {copiedField === 'from' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* To Address */}
                        <div className="bg-secondary rounded-lg p-4">
                            <p className="text-sm text-muted-foreground mb-2">To</p>
                            <div className="flex items-center justify-between">
                                <p className="text-foreground font-mono text-sm">{formatAddress(transaction.to_address)}</p>
                                <button
                                    onClick={() => handleCopy(transaction.to_address, 'to')}
                                    className="text-primary hover:text-accent transition-colors ml-2"
                                >
                                    {copiedField === 'to' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Signature */}
                        {transaction.signature && (
                            <div className="bg-secondary rounded-lg p-4">
                                <p className="text-sm text-muted-foreground mb-2">Signature</p>
                                <div className="flex items-center justify-between">
                                    <p className="text-foreground font-mono text-xs break-all">{transaction.signature}</p>
                                    <button
                                        onClick={() => handleCopy(transaction.signature!, 'signature')}
                                        className="text-primary hover:text-accent transition-colors ml-2 flex-shrink-0"
                                    >
                                        {copiedField === 'signature' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Gas Fee */}
                        {transaction.gas_fee && (
                            <div className="bg-secondary rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">Gas Fee</p>
                                    <p className="text-foreground font-semibold">{transaction.gas_fee} ETH</p>
                                </div>
                            </div>
                        )}

                        {/* Block Number */}
                        {transaction.block_number && (
                            <div className="bg-secondary rounded-lg p-4">
                                <div className="flex justify-between items-center">
                                    <p className="text-sm text-muted-foreground">Block Number</p>
                                    <p className="text-foreground font-semibold">#{transaction.block_number}</p>
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="bg-secondary rounded-lg p-4">
                                <p className="text-sm text-muted-foreground mb-1">Created</p>
                                <p className="text-foreground">{new Date(transaction.created_at).toLocaleString()}</p>
                            </div>
                            {transaction.updated_at && (
                                <div className="bg-secondary rounded-lg p-4">
                                    <p className="text-sm text-muted-foreground mb-1">Updated</p>
                                    <p className="text-foreground">{new Date(transaction.updated_at).toLocaleString()}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
};

export default TransactionDetails;

