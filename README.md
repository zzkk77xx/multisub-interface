# Web3 Wallet Balance App

A modern Web3 React application built with Vite, RainbowKit, wagmi, viem, Tailwind CSS, and shadcn/ui that allows users to connect their wallet and view their balance.

## Features

- Connect wallet using RainbowKit (supports MetaMask, WalletConnect, Coinbase Wallet, and more)
- View wallet balance across multiple networks (Ethereum, Polygon, Optimism, Arbitrum, Base)
- Beautiful UI built with Tailwind CSS and shadcn/ui
- TypeScript for type safety
- Fast development with Vite

## Prerequisites

- Node.js 18+ or pnpm installed
- A WalletConnect Project ID (get one at https://cloud.walletconnect.com/)

## Setup

1. Clone the repository

2. Install dependencies:
```bash
pnpm install
```

3. Get your WalletConnect Project ID:
   - Go to https://cloud.walletconnect.com/
   - Create a new project
   - Copy your Project ID

4. Update the Project ID in `src/wagmi.ts`:
```typescript
export const config = getDefaultConfig({
  appName: 'Web3 Wallet Balance',
  projectId: 'YOUR_PROJECT_ID', // Replace with your actual Project ID
  chains: [mainnet, polygon, optimism, arbitrum, base, sepolia],
  ssr: false,
});
```

## Development

Run the development server:

```bash
pnpm dev
```

The app will be available at `http://localhost:5173`

## Build

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

## Technologies Used

- **React 18** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool and dev server
- **RainbowKit** - Wallet connection UI
- **wagmi** - React hooks for Ethereum
- **viem** - TypeScript Ethereum library
- **Tailwind CSS** - Utility-first CSS framework
- **shadcn/ui** - Re-usable component library
- **TanStack Query** - Data fetching and caching

## Project Structure

```
msw-interface/
├── src/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── WalletBalance.tsx
│   ├── lib/
│   │   └── utils.ts      # Utility functions
│   ├── App.tsx           # Main app component
│   ├── main.tsx          # Entry point
│   ├── wagmi.ts          # wagmi configuration
│   └── index.css         # Global styles
├── public/
├── index.html
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── vite.config.ts
```

## License

ISC
