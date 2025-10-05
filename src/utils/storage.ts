export interface User {
  email: string;
  username: string;
  userId: string;
  isLoggedIn: boolean;
}

export interface Wallet {
  mnemonic: string;
  address: string;
  privateKey: string;
  balance: string;
}

export interface Transaction {
  id: string;
  type: 'sent' | 'received';
  amount: string;
  address: string;
  timestamp: number;
  status: 'success' | 'pending' | 'failed';
}

export const getCurrentUser = (): User | null => {
  const user = localStorage.getItem('currentUser');
  return user ? JSON.parse(user) : null;
};

export const setCurrentUser = (user: User): void => {
  localStorage.setItem('currentUser', JSON.stringify(user));
};

export const clearCurrentUser = (): void => {
  localStorage.removeItem('currentUser');
};

export const getWallet = (): Wallet | null => {
  const wallet = localStorage.getItem('wallet');
  return wallet ? JSON.parse(wallet) : null;
};

export const setWallet = (wallet: Wallet): void => {
  localStorage.setItem('wallet', JSON.stringify(wallet));
};

export const clearWallet = (): void => {
  localStorage.removeItem('wallet');
};

export const getTransactions = (): Transaction[] => {
  const transactions = localStorage.getItem('transactions');
  return transactions ? JSON.parse(transactions) : [];
};

export const addTransaction = (transaction: Transaction): void => {
  const transactions = getTransactions();
  transactions.unshift(transaction);
  localStorage.setItem('transactions', JSON.stringify(transactions));
};

export const clearAllData = (): void => {
  localStorage.clear();
};
