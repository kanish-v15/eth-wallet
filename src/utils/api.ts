// Mock API calls for future Flask integration
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const mockApiCall = async <T>(data: T, delayMs: number = 500): Promise<T> => {
  await delay(delayMs);
  return data;
};

export const authApi = {
  signup: async (email: string, username: string, password: string, walletAddress: string) => {
    return mockApiCall({
      token: 'mock_token_' + Date.now(),
      userId: 'user_' + Math.random().toString(36).substr(2, 9),
    });
  },

  login: async (email: string, password: string) => {
    return mockApiCall({
      token: 'mock_token_' + Date.now(),
      userId: 'user_' + Math.random().toString(36).substr(2, 9),
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb8',
    });
  },
};

export const walletApi = {
  create: async (userId: string, address: string) => {
    return mockApiCall({
      balance: (Math.random() * 9 + 1).toFixed(4),
    });
  },

  getBalance: async (address: string) => {
    return mockApiCall({
      balance: (Math.random() * 9 + 1).toFixed(4),
      usdValue: ((Math.random() * 9 + 1) * 2500).toFixed(2),
    });
  },
};

export const transferApi = {
  initiate: async (from: string, to: string, amount: string, currency: 'ETH' | 'USD') => {
    const ethAmount = currency === 'ETH' ? amount : (parseFloat(amount) / 2500).toFixed(6);
    const usdAmount = currency === 'USD' ? amount : (parseFloat(amount) * 2500).toFixed(2);
    const message = `Transfer ${ethAmount} ETH to ${to}`;
    
    return mockApiCall({
      message,
      messageHash: '0x' + Math.random().toString(36).substr(2, 64),
      ethAmount,
      usdAmount,
      expiry: Date.now() + 30000, // 30 seconds
    });
  },

  confirm: async (signature: string, messageHash: string, from: string, to: string, amount: string) => {
    return mockApiCall({
      txHash: '0x' + Math.random().toString(36).substr(2, 64),
      status: 'success',
    }, 1000);
  },
};

export const transactionsApi = {
  getAll: async (address: string) => {
    // This would normally fetch from backend
    return mockApiCall({
      transactions: [],
    });
  },
};
