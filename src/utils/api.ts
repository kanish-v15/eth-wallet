import axios, { AxiosError } from 'axios';
import { getAccessToken, getRefreshToken, setTokens, clearAllData } from './storage';

// GET THE BASE URL FROM ENVIRONMENT VARIABLES
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api';

// CREATE AXIOS INSTANCE WITH BASE CONFIGURATION
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// REQUEST INTERCEPTOR - AUTOMATICALLY ADD AUTH TOKEN TO EVERY REQUEST
api.interceptors.request.use(
  (config) => {
    const token = getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// RESPONSE INTERCEPTOR - HANDLE TOKEN REFRESH ON 401 ERRORS
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // IF 401 ERROR AND WE HAVEN'T TRIED TO REFRESH YET
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = getRefreshToken();
        if (!refreshToken) {
          // NO REFRESH TOKEN - FORCE LOGOUT
          clearAllData();
          window.location.href = '/login';
          return Promise.reject(error);
        }

        // ATTEMPT TOKEN REFRESH
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          }
        );

        const { access_token } = response.data;
        const currentRefreshToken = getRefreshToken();

        if (currentRefreshToken) {
          setTokens({
            access_token,
            refresh_token: currentRefreshToken,
          });
        }

        // RETRY THE ORIGINAL REQUEST WITH NEW TOKEN
        originalRequest.headers.Authorization = `Bearer ${access_token}`;
        return api(originalRequest);
      } catch (refreshError) {
        // REFRESH FAILED - FORCE LOGOUT
        clearAllData();
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================
// 🔥 AUTHENTICATION API - DOMINATE THE LOGIN
// ============================================

export const authApi = {
  /**
   * USER SIGNUP - CREATE NEW ACCOUNT
   */
  signup: async (email: string, password: string, firstName: string, lastName: string) => {
    const response = await api.post('/auth/signup', {
      email,
      password,
      first_name: firstName,
      last_name: lastName,
    });
    return response.data;
  },

  /**
   * USER LOGIN - AUTHENTICATE AND GET TOKENS
   */
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/signin', {
      email,
      password,
    });
    return response.data;
  },

  /**
   * GET USER PROFILE
   */
  getProfile: async () => {
    const response = await api.get('/auth/profile');
    return response.data;
  },

  /**
   * UPDATE USER PROFILE
   */
  updateProfile: async (firstName: string, lastName: string, phoneNumber?: string) => {
    const response = await api.put('/auth/profile', {
      first_name: firstName,
      last_name: lastName,
      ...(phoneNumber && { phone_number: phoneNumber }),
    });
    return response.data;
  },

  /**
   * CHANGE PASSWORD
   */
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', {
      current_password: currentPassword,
      new_password: newPassword,
    });
    return response.data;
  },

  /**
   * REFRESH ACCESS TOKEN
   */
  refreshToken: async (refreshToken: string) => {
    const response = await axios.post(
      `${API_BASE_URL}/auth/refresh`,
      {},
      {
        headers: {
          Authorization: `Bearer ${refreshToken}`,
        },
      }
    );
    return response.data;
  },
};

// ============================================
// 💰 WALLET API - CRUSH THE BLOCKCHAIN
// ============================================

export const walletApi = {
  /**
   * CREATE NEW WALLET - Send mnemonic to backend so it generates the same address
   */
  create: async (mnemonic: string, walletName: string = 'My Wallet', isPrimary: boolean = true) => {
    const response = await api.post('/wallet/create', {
      mnemonic,
      wallet_name: walletName,
      is_primary: isPrimary,
    });
    return response.data;
  },

  /**
   * IMPORT EXISTING WALLET FROM MNEMONIC
   */
  import: async (mnemonic: string, walletName: string = 'Imported Wallet', isPrimary: boolean = false) => {
    const response = await api.post('/wallet/import', {
      mnemonic,
      wallet_name: walletName,
      is_primary: isPrimary,
    });
    return response.data;
  },

  /**
   * LIST ALL USER WALLETS
   */
  list: async (includeMnemonics: boolean = false) => {
    const response = await api.get('/wallet/list', {
      params: includeMnemonics ? { include_mnemonics: true } : {},
    });
    return response.data;
  },

  /**
   * GET WALLET BALANCE FOR SPECIFIC ADDRESS
   */
  getBalance: async (address: string) => {
    const response = await api.get(`/wallet/balance/${address}`);
    return response.data;
  },

  /**
   * SIGN A MESSAGE WITH WALLET (using mnemonic)
   */
  signMessage: async (message: string, walletAddress: string, mnemonic: string) => {
    const response = await api.post('/wallet/sign-message', {
      message,
      wallet_address: walletAddress,
      mnemonic,
    });
    return response.data;
  },
};

// ============================================
// 💸 TRANSFER API - SEND IT WITH AUTHORITY
// ============================================

export const transferApi = {
  /**
   * PREPARE TRANSFER - STEP 1 (WITH ETH AMOUNT)
   */
  prepareTransfer: async (fromAddress: string, toAddress: string, amount: number) => {
    const response = await api.post('/wallet/transfer/prepare', {
      from_address: fromAddress,
      to_address: toAddress,
      amount,
    });
    return response.data;
  },

  /**
   * PREPARE TRANSFER - STEP 1 (WITH USD AMOUNT)
   */
  prepareTransferUSD: async (fromAddress: string, toAddress: string, amountUsd: number) => {
    const response = await api.post('/wallet/transfer/prepare', {
      from_address: fromAddress,
      to_address: toAddress,
      amount_usd: amountUsd,
    });
    return response.data;
  },

  /**
   * EXECUTE TRANSFER - STEP 4 (FINAL STEP)
   */
  executeTransfer: async (
    message: string,
    signature: string,
    fromAddress: string
  ) => {
    const response = await api.post('/wallet/transfer/execute', {
      message,
      signature,
      from_address: fromAddress,
    });
    return response.data;
  },
};

// ============================================
// 📊 PRICE API - GET LIVE ETH PRICES
// ============================================

export const priceApi = {
  /**
   * GET CURRENT ETH PRICE IN USD
   */
  getEthPrice: async () => {
    const response = await api.get('/wallet/price/eth');
    return response.data;
  },

  /**
   * CONVERT USD TO ETH
   */
  convertUsdToEth: async (usdAmount: number) => {
    const response = await api.post('/wallet/price/convert', {
      usd_amount: usdAmount,
    });
    return response.data;
  },
};

// ============================================
// 📈 TRANSACTION API - TRACK YOUR DOMINANCE
// ============================================

export const transactionsApi = {
  /**
   * GET TRANSACTION HISTORY FOR ADDRESS (with pagination)
   */
  getHistory: async (address: string, limit: number = 20, offset: number = 0) => {
    const response = await api.get(`/transactions/history/${address}`, {
      params: { limit, offset },
    });
    return response.data;
  },

  /**
   * GET TRANSACTION STATISTICS
   */
  getStats: async (address: string) => {
    const response = await api.get(`/transactions/stats/${address}`);
    return response.data;
  },

  /**
   * GET SINGLE TRANSACTION BY ID
   */
  getById: async (transactionId: string) => {
    const response = await api.get(`/transactions/${transactionId}`);
    return response.data;
  },

  /**
   * GET RECENT TRANSACTIONS (across all wallets)
   */
  getRecent: async (limit: number = 10) => {
    const response = await api.get('/transactions/recent', {
      params: { limit },
    });
    return response.data;
  },
};

// ============================================
// 🛡️ ERROR HANDLER - CRUSH ERRORS LIKE A BOSS
// ============================================

export const handleApiError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<any>;

    // NETWORK ERROR
    if (!axiosError.response) {
      return 'Network error. Check your connection and try again.';
    }

    // SERVER RETURNED AN ERROR
    const errorData = axiosError.response.data;
    if (errorData && errorData.error) {
      return errorData.error;
    }

    // GENERIC HTTP ERROR
    switch (axiosError.response.status) {
      case 400:
        return 'Invalid request. Please check your input.';
      case 401:
        return 'Authentication failed. Please login again.';
      case 404:
        return 'Resource not found.';
      case 422:
        return 'Invalid input data.';
      case 500:
        return 'Server error. Please try again later.';
      default:
        return 'An unexpected error occurred.';
    }
  }

  return 'An unexpected error occurred.';
};

// EXPORT THE AXIOS INSTANCE FOR DIRECT USE IF NEEDED
export default api;
