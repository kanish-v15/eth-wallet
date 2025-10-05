# Web3 Wallet

A modern, secure Ethereum wallet application built with React and TypeScript. Manage your crypto assets, send transactions, and interact with the Ethereum blockchain seamlessly.

## Features

### 🔐 Authentication
- Secure user registration and login
- JWT token-based authentication
- Profile management with personal information

### 💰 Wallet Management
- Create new Ethereum wallets
- Import existing wallets with 12-word recovery phrases
- Multiple wallet support
- Real-time balance tracking
- Primary wallet designation

### 💸 Transactions
- Send ETH and USD-denominated transactions
- Real-time ETH price integration
- Transaction history and details
- Secure message signing with mnemonics
- Transaction status tracking

### 📊 Dashboard
- Live wallet balance display
- Recent transaction overview
- Quick navigation to all features
- Real-time ETH/USD conversion

### 🔒 Security
- Client-side wallet generation
- Secure mnemonic phrase handling
- Message signing for transaction verification
- Local storage for wallet data

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **UI Components**: shadcn/ui, Tailwind CSS
- **Blockchain**: ethers.js v5
- **Validation**: Zod schemas
- **HTTP Client**: Axios with interceptors
- **Routing**: React Router DOM
- **Notifications**: react-hot-toast
- **QR Codes**: qrcode library

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Backend API server running

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file with your backend URL:
   ```
   VITE_API_BASE_URL=https://your-backend-url.com/api
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:5173](http://localhost:5173) in your browser

## Project Structure

```
src/
├── components/ui/     # Reusable UI components
├── pages/            # Application pages
├── utils/            # Utility functions
│   ├── api.ts        # API service layer
│   ├── storage.ts    # Local storage management
│   ├── validation.ts # Zod schemas
│   └── wallet.ts     # Ethereum wallet utilities
└── App.tsx           # Main application component
```

## Key Pages

- **Login/Signup**: User authentication
- **Dashboard**: Main wallet overview
- **Send**: Transaction creation and sending
- **Receive**: Wallet address and QR code display
- **History**: Transaction history with details
- **Wallets**: Multi-wallet management
- **Profile**: User profile management

## API Integration

The application integrates with a Flask-based backend API for:
- User authentication and profile management
- Wallet creation and import
- Transaction preparation, signing, and execution
- Real-time ETH price data
- Transaction history and statistics

## Security Considerations

- Private keys and mnemonics are handled securely
- All transactions require proper message signing
- JWT tokens are managed with automatic refresh
- Input validation using Zod schemas
- Secure API communication with interceptors

## Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Environment Variables

- `VITE_API_BASE_URL` - Backend API base URL (required)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For support and questions, please open an issue in the repository.