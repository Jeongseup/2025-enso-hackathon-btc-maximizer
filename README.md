# BTC Maximizer

A Bitcoin Dollar Cost Averaging (DCA) application built with Next.js and integrated with Enso Protocol for optimal swap rates.

## Features

- **Automated DCA Strategy**: Set up daily Bitcoin purchases with customizable amounts and duration
- **Best Rate Optimization**: Automatically finds the best rates across CBBTC, LBTC, and WBTC using Enso Protocol
- **User-Friendly Interface**: Clean, modern UI with Bitcoin-focused design
- **Wallet Integration**: Ready for Web3 wallet connection (currently simulated)
- **Real-time Rate Checking**: Live rate comparison across different Bitcoin tokens

## Architecture

### Frontend

- **Next.js 15** with App Router
- **React 19** with TypeScript
- **Tailwind CSS** for styling
- **Responsive design** for mobile and desktop

### Integration

- **Enso Protocol API** for swap rate optimization
- **Base Chain (Chain ID: 8453)** support
- **USDC to BTC token swaps** (CBBTC, LBTC, WBTC)

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Run the development server:

```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) to view the application

## Usage Flow

1. **Landing Page**: Users see the welcome screen with feature highlights
2. **Connect Wallet**: Click "Connect Wallet" to simulate wallet connection
3. **Configure DCA**:
   - Select investment amount ($10, $100, $1000, or custom)
   - Set duration (default 365 days)
   - View total investment calculation
4. **Rate Optimization**: App automatically fetches best rates from Enso Protocol
5. **Execute Trade**: Confirm transaction to execute the BTC purchase

## API Integration

The app integrates with Enso Protocol's routing API:

```
GET https://api.enso.finance/api/v1/shortcuts/route
```

Parameters:

- `chainId=8453` (Base)
- `slippage=500` (5%)
- `fromAddress` (user wallet)
- `amountIn` (USDC amount in wei)
- `tokenIn=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913` (USDC)
- `tokenOut` (BTC token address)

## Supported BTC Tokens

- **CBBTC**: `0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf`
- **LBTC**: `0xecac9c5f704e954931349da37f60e39f515c11c1`
- **WBTC**: `0x0555e30da8f98308edb960aa94c0db47230d2b9c`

## Development

The application is structured as a single-page app with:

- Simulated wallet connection for demo purposes
- Real-time API integration with Enso Protocol
- Responsive design matching provided mockups
- Error handling and loading states

## Future Enhancements

- Real wallet integration with wagmi/RainbowKit
- Transaction execution on Base chain
- Historical performance tracking
- Advanced DCA scheduling options
- Portfolio management features
