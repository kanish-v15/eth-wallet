export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthTokens {
  access_token: string;
  refresh_token: string;
}

export interface Wallet {
  id?: string;
  mnemonic?: string;
  address: string;
  privateKey?: string;
  balance: string;
  wallet_name?: string;
  is_primary?: boolean;
  created_at?: string;
}

export interface Transaction {
  id: string;
  from_address: string;
  to_address: string;
  amount: string;
  status: 'completed' | 'pending' | 'failed';
  signature?: string;
  created_at: string;
}

// TOKEN MANAGEMENT - JWT tokens for authentication
export const getTokens = (): AuthTokens | null => {
  const tokens = localStorage.getItem('auth_tokens');
  return tokens ? JSON.parse(tokens) : null;
};

export const setTokens = (tokens: AuthTokens): void => {
  localStorage.setItem('auth_tokens', JSON.stringify(tokens));
};

export const clearTokens = (): void => {
  localStorage.removeItem('auth_tokens');
};

export const getAccessToken = (): string | null => {
  const tokens = getTokens();
  return tokens ? tokens.access_token : null;
};

export const getRefreshToken = (): string | null => {
  const tokens = getTokens();
  return tokens ? tokens.refresh_token : null;
};

// USER MANAGEMENT
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
  clearTokens();
  clearCurrentUser();
  clearWallet();
  localStorage.removeItem('transactions');
};
