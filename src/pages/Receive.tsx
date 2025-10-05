import { useEffect, useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Copy, Check, Share2 } from 'lucide-react';
import { getCurrentUser, getWallet } from '@/utils/storage';
import QRCode from 'qrcode';
import { toast } from 'react-hot-toast';

const Receive = () => {
  const navigate = useNavigate();
  const [wallet, setWallet] = useState(getWallet());
  const [copied, setCopied] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const currentUser = getCurrentUser();
    const currentWallet = getWallet();

    if (!currentUser || !currentWallet) {
      navigate('/login');
      return;
    }

    setWallet(currentWallet);

    // Generate QR code
    if (currentWallet && canvasRef.current) {
      QRCode.toCanvas(
        canvasRef.current,
        currentWallet.address,
        {
          width: 256,
          margin: 2,
          color: {
            dark: '#ffffff',
            light: '#1a1a2e',
          },
        },
        (error) => {
          if (error) {
            toast.error('Failed to generate QR code');
          }
        }
      );
    }
  }, [navigate]);

  const handleCopyAddress = () => {
    if (wallet) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShareAddress = () => {
    if (wallet && navigator.share) {
      navigator.share({
        title: 'My Wallet Address',
        text: `Send ETH to: ${wallet.address}`,
      }).catch(() => {
        // If sharing fails, fallback to copy
        handleCopyAddress();
      });
    } else {
      handleCopyAddress();
    }
  };

  if (!wallet) {
    return null;
  }

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
          <h1 className="text-3xl font-bold text-foreground mb-2">Receive ETH</h1>
          <p className="text-muted-foreground mb-8">Share your wallet address to receive payments</p>

          <div className="flex flex-col items-center space-y-6">
            {/* QR Code */}
            <div className="bg-gradient-to-br from-primary/20 to-accent/20 p-6 rounded-2xl border-2 border-primary/30">
              <canvas ref={canvasRef} className="rounded-lg" />
            </div>

            {/* Wallet Address */}
            <div className="w-full space-y-3">
              <label className="text-sm text-muted-foreground font-semibold">Your Wallet Address</label>
              <div className="bg-secondary border border-border rounded-lg p-4">
                <p className="text-foreground font-mono text-sm break-all text-center">
                  {wallet.address}
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="w-full grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="border-border"
                onClick={handleCopyAddress}
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Address
                  </>
                )}
              </Button>

              <Button
                className="bg-gradient-to-r from-primary to-accent text-primary-foreground"
                onClick={handleShareAddress}
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share Address
              </Button>
            </div>

            {/* Warning */}
            <div className="w-full bg-primary/10 border border-primary/30 rounded-lg p-4 mt-4">
              <p className="text-sm text-primary text-center">
                ⚠️ Only send Ethereum (ETH) to this address. Sending other tokens may result in loss of funds.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Receive;
