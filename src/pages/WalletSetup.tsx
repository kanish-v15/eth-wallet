import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { AlertCircle, Download, Upload, Copy, Check } from 'lucide-react';
import { generateWallet, importWallet } from '@/utils/wallet';
import { setWallet } from '@/utils/storage';
import { toast } from 'react-hot-toast';

const WalletSetup = () => {
  const [mode, setMode] = useState<'select' | 'create' | 'import'>('select');
  const [mnemonic, setMnemonic] = useState('');
  const [importWords, setImportWords] = useState<string[]>(Array(12).fill(''));
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const handleCreateWallet = () => {
    const wallet = generateWallet();
    setMnemonic(wallet.mnemonic);
    setMode('create');
  };

  const handleSaveWallet = () => {
    if (!mnemonic) return;
    
    const wallet = generateWallet();
    setWallet(wallet);
    toast.success('Wallet created successfully!');
    navigate('/dashboard');
  };

  const handleImportWallet = () => {
    const phrase = importWords.join(' ');
    const wallet = importWallet(phrase);
    
    if (wallet) {
      setWallet(wallet);
      toast.success('Wallet imported successfully!');
      navigate('/dashboard');
    } else {
      toast.error('Invalid mnemonic phrase');
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

  if (mode === 'select') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-secondary p-4">
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
              <p className="text-destructive font-semibold mb-1">Warning!</p>
              <p className="text-destructive/90">Never share your recovery phrase with anyone. Anyone with these words can access your funds.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            {words.map((word, index) => (
              <div key={index} className="bg-secondary border border-border rounded-lg p-3 flex items-center gap-2">
                <span className="text-muted-foreground text-sm font-mono">{index + 1}.</span>
                <span className="text-foreground font-medium">{word}</span>
              </div>
            ))}
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
            >
              I've Saved My Phrase
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
