import { ethers } from 'ethers';

export interface WalletData {
  mnemonic: string;
  address: string;
  privateKey: string;
  balance: string;
}

export const generateWallet = (): WalletData => {
  const wallet = ethers.Wallet.createRandom();
  const balance = (Math.random() * 9 + 1).toFixed(4); // Random 1-10 ETH

  return {
    mnemonic: wallet.mnemonic.phrase,
    address: wallet.address,
    privateKey: wallet.privateKey,
    balance,
  };
};

export const importWallet = (mnemonic: string): WalletData | null => {
  try {
    const wallet = ethers.Wallet.fromMnemonic(mnemonic);
    const balance = (Math.random() * 9 + 1).toFixed(4);

    return {
      mnemonic: wallet.mnemonic.phrase,
      address: wallet.address,
      privateKey: wallet.privateKey,
      balance,
    };
  } catch (error) {
    console.error('Invalid mnemonic:', error);
    return null;
  }
};

export const signMessage = async (privateKey: string, message: string): Promise<string> => {
  try {
    const wallet = new ethers.Wallet(privateKey);
    const signature = await wallet.signMessage(message);
    return signature;
  } catch (error) {
    console.error('Error signing message:', error);
    throw error;
  }
};

export const formatAddress = (address: string): string => {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// These functions are now deprecated - use priceApi instead
// Keeping for backward compatibility with default fallback
export const ethToUsd = (eth: string, price: number = 2500): string => {
  const ethAmount = parseFloat(eth);
  const usdAmount = ethAmount * price;
  return usdAmount.toFixed(2);
};

export const usdToEth = (usd: string, price: number = 2500): string => {
  const usdAmount = parseFloat(usd);
  const ethAmount = usdAmount / price;
  return ethAmount.toFixed(6);
};
