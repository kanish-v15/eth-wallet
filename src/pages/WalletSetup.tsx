import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Download, Upload, Copy, Check, Eye, EyeOff, LogOut } from 'lucide-react';
import { generateWallet, importWallet as importWalletFromMnemonic } from '@/utils/wallet';
import { setWallet, getWallet, getCurrentUser, clearAllData } from '@/utils/storage';
import { toast } from 'react-hot-toast';
import { mnemonicSchema, getValidationError } from '@/utils/validation';
import { walletApi, handleApiError } from '@/utils/api';

const WalletSetup = () => {
  const [mode, setMode] = useState<'select' | 'create' | 'import'>('select');
  const [mnemonic, setMnemonic] = useState('');
  const [importWords, setImportWords] = useState<string[]>(Array(12).fill(''));
  const [copied, setCopied] = useState(false);
  const [mnemonicVisible, setMnemonicVisible] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  // 🔥 CHECK IF USER ALREADY HAS A WALLET - REDIRECT TO DASHBOARD
  useEffect(() => {
    const currentUser = getCurrentUser();
    const existingWallet = getWallet();

    // CHECK AUTH
    if (!currentUser) {
      navigate('/login');
      return;
    }

    // CHECK IF WALLET EXISTS - If yes, go to dashboard
    if (existingWallet && existingWallet.address) {
      toast.success('You already have a wallet! 🔥');
      navigate('/dashboard');
      return;
    }
  }, [navigate]);

  const handleCreateWallet = () => {
    const wallet = generateWallet();
    setMnemonic(wallet.mnemonic);
    setMode('create');
  };

  const handleSaveWallet = async () => {
    if (!mnemonic) return;

    if (!confirmed) {
      toast.error('Please confirm that you have saved your recovery phrase');
      return;
    }

    try {
      // 🔥 CRITICAL FIX: Import the wallet from the ACTUAL mnemonic the user saved
      const localWallet = importWalletFromMnemonic(mnemonic);

      if (!localWallet) {
        toast.error('Failed to create wallet from mnemonic');
        return;
      }

      // STEP 1: CREATE WALLET ON BACKEND - Send the mnemonic so backend generates same address!
      const createResponse = await walletApi.create(mnemonic, 'My Wallet', true);

      if (!createResponse.success) {
        toast.error('Failed to register wallet with server');
        return;
      }

      // STEP 2: Verify addresses match (local and backend should be the same)
      if (createResponse.wallet.address.toLowerCase() !== localWallet.address.toLowerCase()) {
        console.error('Address mismatch!', {
          local: localWallet.address,
          backend: createResponse.wallet.address
        });
        // Use backend address as source of truth
      }

      // STEP 3: SAVE WALLET LOCALLY (with mnemonic and private key for signing)
      const walletData = {
        id: createResponse.wallet.id,
        address: createResponse.wallet.address, // Use backend address
        privateKey: localWallet.privateKey,
        mnemonic: localWallet.mnemonic,
        balance: createResponse.wallet.balance.toString(),
        wallet_name: createResponse.wallet.wallet_name,
        is_primary: createResponse.wallet.is_primary,
      };

      setWallet(walletData);
      toast.success('Wallet created successfully! 🔥');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    }
  };

  const handleImportWallet = async () => {
    const phrase = importWords.join(' ').toLowerCase().trim();

    // Validate mnemonic format
    const validation = mnemonicSchema.safeParse(phrase);
    if (!validation.success) {
      toast.error(getValidationError(validation.error));
      return;
    }

    // STEP 1: Validate mnemonic locally first
    const localWallet = importWalletFromMnemonic(phrase);

    if (!localWallet) {
      toast.error('Invalid mnemonic phrase. Please check and try again.');
      return;
    }

    try {
      // STEP 2: IMPORT WALLET TO BACKEND
      const importResponse = await walletApi.import(phrase, 'Imported Wallet', true);

      if (!importResponse.success) {
        toast.error('Failed to import wallet to server');
        return;
      }

      // STEP 3: SAVE WALLET LOCALLY (with mnemonic and private key for signing)
      const walletData = {
        id: importResponse.wallet.id,
        address: localWallet.address,
        privateKey: localWallet.privateKey,
        mnemonic: localWallet.mnemonic,
        balance: importResponse.wallet.balance.toString(),
        wallet_name: importResponse.wallet.wallet_name,
        is_primary: importResponse.wallet.is_primary,
      };

      setWallet(walletData);
      toast.success('Wallet imported successfully! 🔥');
      navigate('/dashboard');
    } catch (error) {
      const errorMessage = handleApiError(error);
      toast.error(errorMessage);
    }
  };

  const handleCopyMnemonic = () => {
    navigator.clipboard.writeText(mnemonic);
    setCopied(true);
    toast.success('Copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleImportWordChange = (index: number, value: string) => {
    const newWords = [...importWords];
    newWords[index] = value;
    setImportWords(newWords);
  };

  const handleLogout = () => {
    clearAllData();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-4">
        {/* Logout Button */}
        <div className="absolute top-4 right-4">
          <Button variant="ghost" onClick={handleLogout}>
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>

        <div className="w-full max-w-4xl">
          <h1 className="text-4xl font-bold text-center text-foreground mb-2">Wallet Setup</h1>
          <p className="text-center text-muted-foreground mb-12">Choose how to set up your wallet</p>

          <div className="grid md:grid-cols-2 gap-6">
            <Card className="p-8 bg-card border-border hover:border-primary transition-all cursor-pointer group" onClick={handleCreateWallet}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Download className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Create New Wallet</h2>
              <p className="text-muted-foreground mb-4">
                Generate a new wallet with a 12-word recovery phrase
              </p>
              <Button className="w-full bg-gradient-to-r from-primary to-accent text-primary-foreground">
                Create Wallet
              </Button>
            </Card>

            <Card className="p-8 bg-card border-border hover:border-primary transition-all cursor-pointer group" onClick={() => setMode('import')}>
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Upload className="w-8 h-8 text-primary-foreground" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-3">Import Existing Wallet</h2>
              <p className="text-muted-foreground mb-4">
                Restore your wallet using your 12-word recovery phrase
              </p>
              <Button className="w-full bg-secondary text-secondary-foreground hover:bg-secondary/80">
                Import Wallet
              </Button>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'create') {
    const words = mnemonic.split(' ');

    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-4">
        <Card className="w-full max-w-2xl p-8 bg-card border-border">
          <h1 className="text-3xl font-bold text-foreground mb-2">Your Recovery Phrase</h1>
          <p className="text-muted-foreground mb-6">Write down these 12 words in order and keep them safe</p>

          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-destructive mt-0.5 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-destructive font-semibold mb-1">Critical Security Warning!</p>
              <ul className="list-disc list-inside space-y-1 text-destructive/90">
                <li>Never share your recovery phrase with anyone</li>
                <li>Anyone with these words can access your funds</li>
                <li>Write it down on paper - do not store digitally</li>
                <li>Keep it in a secure location</li>
                <li>Do not take screenshots</li>
              </ul>
            </div>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <label className="text-sm text-muted-foreground font-semibold">Recovery Phrase</label>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setMnemonicVisible(!mnemonicVisible)}
              className="text-primary hover:text-accent"
            >
              {mnemonicVisible ? (
                <>
                  <EyeOff className="w-4 h-4 mr-2" />
                  Hide
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 mr-2" />
                  Reveal
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6 relative">
            {!mnemonicVisible && (
              <div className="absolute inset-0 backdrop-blur-md bg-background/30 rounded-lg flex items-center justify-center z-10">
                <p className="text-muted-foreground font-semibold">Click "Reveal" to see your phrase</p>
              </div>
            )}
            {words.map((word, index) => (
              <div key={index} className="bg-secondary border border-border rounded-lg p-3 flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-mono">{index + 1}.</span>
                <span className="text-foreground font-medium">{word}</span>
              </div>
            ))}
          </div>

          <div className="bg-secondary border border-border rounded-lg p-4 mb-6">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
                className="w-5 h-5 rounded border-border"
              />
              <span className="text-sm text-foreground">
                I have written down my recovery phrase and stored it securely
              </span>
            </label>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-border"
              onClick={handleCopyMnemonic}
            >
              {copied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : 'Copy Phrase'}
            </Button>
            <Button
              className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground"
              onClick={handleSaveWallet}
              disabled={!confirmed}
            >
              Continue to Wallet
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-4">
      <Card className="w-full max-w-2xl p-8 bg-card border-border">
        <h1 className="text-3xl font-bold text-foreground mb-2">Import Wallet</h1>
        <p className="text-muted-foreground mb-6">Enter your 12-word recovery phrase</p>

        <div className="grid grid-cols-3 gap-3 mb-6">
          {importWords.map((word, index) => (
            <div key={index} className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm font-mono w-6">{index + 1}.</span>
              <Input
                value={word}
                onChange={(e) => handleImportWordChange(index, e.target.value)}
                placeholder="word"
                className="bg-input border-border text-foreground"
              />
            </div>
          ))}
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1 border-border"
            onClick={() => setMode('select')}
          >
            Back
          </Button>
          <Button
            className="flex-1 bg-gradient-to-r from-primary to-accent text-primary-foreground"
            onClick={handleImportWallet}
          >
            Import Wallet
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default WalletSetup;
