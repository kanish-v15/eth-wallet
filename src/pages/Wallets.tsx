import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ArrowLeft, Wallet as WalletIcon, Plus, Copy, Check, Star, Download } from 'lucide-react';
import { getCurrentUser, setWallet as saveWallet } from '@/utils/storage';
import { formatAddress } from '@/utils/wallet';
import { toast } from 'react-hot-toast';
import { walletApi, priceApi, handleApiError } from '@/utils/api';

interface WalletData {
    id: string;
    address: string;
    balance: number;
    wallet_name: string;
    is_primary: boolean;
    created_at: string;
    updated_at: string;
}

const Wallets = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(getCurrentUser());
    const [wallets, setWallets] = useState<WalletData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [showImportDialog, setShowImportDialog] = useState(false);
    const [newWalletName, setNewWalletName] = useState('');
    const [importMnemonic, setImportMnemonic] = useState('');
    const [importWalletName, setImportWalletName] = useState('');
    const [ethPrice, setEthPrice] = useState(2500);
    const [copiedAddress, setCopiedAddress] = useState<string | null>(null);

    useEffect(() => {
        const currentUser = getCurrentUser();

        if (!currentUser) {
            navigate('/login');
            return;
        }

        setUser(currentUser);
        fetchWallets();
        fetchEthPrice();
    }, [navigate]);

    const fetchEthPrice = async () => {
        try {
            const response = await priceApi.getEthPrice();
            if (response.success) {
                setEthPrice(response.price);
            }
        } catch (error) {
            console.error('Failed to fetch ETH price:', error);
        }
    };

    const fetchWallets = async () => {
        setIsLoading(true);
        try {
            const response = await walletApi.list();
            console.log('Wallets response:', response);

            if (response.wallets) {
                setWallets(response.wallets);
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateWallet = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newWalletName.trim()) {
            toast.error('Wallet name is required');
            return;
        }

        setIsCreating(true);

        try {
            // Generate a new wallet locally first
            const { generateWallet } = await import('@/utils/wallet');
            const newWallet = generateWallet();

            // Create wallet on backend with the mnemonic
            const response = await walletApi.create(
                newWallet.mnemonic,
                newWalletName.trim(),
                false // Not primary by default
            );

            console.log('Create wallet response:', response);

            if (response.success) {
                toast.success('Wallet created successfully! 🔥');
                setShowCreateDialog(false);
                setNewWalletName('');

                // Refresh wallets list
                await fetchWallets();
            } else {
                toast.error('Failed to create wallet');
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsCreating(false);
            setIsLoading(false);
        }
    };

    const handleCopyAddress = (address: string) => {
        navigator.clipboard.writeText(address);
        setCopiedAddress(address);
        toast.success('Address copied!');
        setTimeout(() => setCopiedAddress(null), 2000);
    };

    const handleImportWallet = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();

        // Prevent double submission
        if (isImporting) {
            return;
        }

        // Validate wallet name first
        if (!importWalletName.trim()) {
            toast.error('Wallet name is required');
            return;
        }

        // Validate mnemonic - filter out empty strings
        const mnemonicTrimmed = importMnemonic.trim();
        const words = mnemonicTrimmed.split(/\s+/).filter(w => w.length > 0);

        if (words.length !== 12) {
            toast.error(`Please enter exactly 12 words. You entered ${words.length} word${words.length !== 1 ? 's' : ''}.`);
            return;
        }

        // Rebuild mnemonic with single spaces
        const cleanedMnemonic = words.join(' ');

        setIsImporting(true);

        try {
            // Import wallet via backend API
            const response = await walletApi.import(
                cleanedMnemonic,
                importWalletName.trim(),
                false // Not primary by default
            );

            console.log('Import wallet response:', response);

            if (response.success) {
                toast.success('Wallet imported successfully! 🔥');
                setShowImportDialog(false);
                setImportMnemonic('');
                setImportWalletName('');

                // Refresh wallets list
                await fetchWallets();
            } else {
                toast.error(response.message || 'Failed to import wallet');
            }
        } catch (error) {
            const errorMessage = handleApiError(error);
            toast.error(errorMessage);
        } finally {
            setIsImporting(false);
            setIsLoading(false);
        }
    };

    const handleSelectWallet = (wallet: WalletData) => {
        // Save selected wallet to local storage
        const walletData = {
            id: wallet.id,
            address: wallet.address,
            balance: wallet.balance.toString(),
            wallet_name: wallet.wallet_name,
            is_primary: wallet.is_primary,
        };

        saveWallet(walletData);
        toast.success(`Switched to ${wallet.wallet_name}! 🔥`);
        navigate('/dashboard');
    };

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-secondary">
            {/* Header */}
            <div className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/dashboard">
                        <Button variant="ghost">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </Link>

                    <div className="flex gap-3">
                        {/* Import Wallet Dialog */}
                        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
                            <DialogTrigger asChild>
                                <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                                    <Download className="w-4 h-4 mr-2" />
                                    Import Wallet
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                                <DialogHeader>
                                    <DialogTitle className="text-foreground">Import Existing Wallet</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleImportWallet} className="space-y-4" noValidate>
                                    <div className="space-y-2">
                                        <Label htmlFor="importWalletName" className="text-foreground">
                                            Wallet Name
                                        </Label>
                                        <Input
                                            id="importWalletName"
                                            placeholder="e.g., Imported Wallet"
                                            value={importWalletName}
                                            onChange={(e) => setImportWalletName(e.target.value)}
                                            className="bg-input border-border text-foreground"
                                            disabled={isImporting}
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="mnemonic" className="text-foreground">
                                            Recovery Phrase (12 words)
                                        </Label>
                                        <textarea
                                            id="mnemonic"
                                            placeholder="Paste your 12-word recovery phrase here"
                                            value={importMnemonic}
                                            onChange={(e) => setImportMnemonic(e.target.value)}
                                            className="w-full min-h-[120px] bg-input border border-border rounded-lg p-3 text-foreground font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                                            disabled={isImporting}
                                            required
                                        />
                                        <p className="text-xs text-muted-foreground">
                                            {importMnemonic.trim().split(/\s+/).filter(w => w.length > 0).length} / 12 words
                                        </p>
                                    </div>

                                    <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
                                        <p className="text-sm text-destructive">
                                            ⚠️ Never share your recovery phrase with anyone. Make sure you're in a secure location.
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                                        disabled={isImporting}
                                    >
                                        {isImporting ? 'Importing...' : 'Import Wallet'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>

                        {/* Create Wallet Dialog */}
                        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                            <DialogTrigger asChild>
                                <Button className="bg-gradient-to-r from-primary to-accent text-primary-foreground">
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create Wallet
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-border">
                                <DialogHeader>
                                    <DialogTitle className="text-foreground">Create New Wallet</DialogTitle>
                                </DialogHeader>
                                <form onSubmit={handleCreateWallet} className="space-y-4" noValidate>
                                    <div className="space-y-2">
                                        <Label htmlFor="walletName" className="text-foreground">
                                            Wallet Name
                                        </Label>
                                        <Input
                                            id="walletName"
                                            placeholder="e.g., My Savings Wallet"
                                            value={newWalletName}
                                            onChange={(e) => setNewWalletName(e.target.value)}
                                            className="bg-input border-border text-foreground"
                                            disabled={isCreating}
                                            required
                                        />
                                    </div>

                                    <div className="bg-primary/10 border border-primary/30 rounded-lg p-4">
                                        <p className="text-sm text-primary">
                                            ⚠️ A new wallet address will be generated. Make sure to save your recovery phrase!
                                        </p>
                                    </div>

                                    <Button
                                        type="submit"
                                        className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground"
                                        disabled={isCreating}
                                    >
                                        {isCreating ? 'Creating...' : 'Create Wallet'}
                                    </Button>
                                </form>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
            </div>

            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="mb-8">
                    <h1 className="text-4xl font-bold text-foreground mb-2">My Wallets</h1>
                    <p className="text-muted-foreground">
                        Manage your wallet addresses and balances
                    </p>
                </div>

                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Loading wallets...</p>
                    </div>
                ) : wallets.length === 0 ? (
                    <Card className="p-12 bg-card border-border text-center">
                        <WalletIcon className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                        <h2 className="text-xl font-semibold text-foreground mb-2">No Wallets Found</h2>
                        <p className="text-muted-foreground mb-6">Create a new wallet or import an existing one</p>
                        <div className="flex gap-3 justify-center">
                            <Button
                                onClick={() => setShowImportDialog(true)}
                                variant="outline"
                                className="border-primary text-primary hover:bg-primary/10"
                            >
                                <Download className="w-4 h-4 mr-2" />
                                Import Wallet
                            </Button>
                            <Button
                                onClick={() => setShowCreateDialog(true)}
                                className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                            >
                                <Plus className="w-4 h-4 mr-2" />
                                Create Wallet
                            </Button>
                        </div>
                    </Card>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {wallets.map((wallet) => (
                            <Card
                                key={wallet.id}
                                className="p-6 bg-card border-border hover:border-primary transition-all cursor-pointer group"
                                onClick={() => handleSelectWallet(wallet)}
                            >
                                {/* Primary Badge */}
                                {wallet.is_primary && (
                                    <div className="flex items-center gap-2 mb-4">
                                        <div className="flex items-center gap-1 bg-primary/20 text-primary px-2 py-1 rounded-full text-xs font-semibold">
                                            <Star className="w-3 h-3 fill-primary" />
                                            Primary
                                        </div>
                                    </div>
                                )}

                                {/* Wallet Icon */}
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                                    <WalletIcon className="w-7 h-7 text-primary-foreground" />
                                </div>

                                {/* Wallet Name */}
                                <h3 className="text-xl font-bold text-foreground mb-2">{wallet.wallet_name}</h3>

                                {/* Balance */}
                                <div className="mb-4">
                                    <p className="text-3xl font-bold text-foreground mb-1">
                                        {wallet.balance.toFixed(4)} ETH
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        ${(wallet.balance * ethPrice).toFixed(2)} USD
                                    </p>
                                </div>

                                {/* Address */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between bg-secondary rounded-lg p-3">
                                        <p className="text-sm text-muted-foreground font-mono">
                                            {formatAddress(wallet.address)}
                                        </p>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleCopyAddress(wallet.address);
                                            }}
                                            className="text-primary hover:text-accent transition-colors"
                                        >
                                            {copiedAddress === wallet.address ? (
                                                <Check className="w-4 h-4" />
                                            ) : (
                                                <Copy className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>

                                {/* Created Date */}
                                <p className="text-xs text-muted-foreground mt-4">
                                    Created: {new Date(wallet.created_at).toLocaleDateString()}
                                </p>
                            </Card>
                        ))}
                    </div>
                )}

                {/* Wallet Count */}
                {wallets.length > 0 && (
                    <div className="mt-8 text-center">
                        <p className="text-muted-foreground">
                            Total Wallets: <span className="font-semibold text-foreground">{wallets.length}</span>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wallets;

