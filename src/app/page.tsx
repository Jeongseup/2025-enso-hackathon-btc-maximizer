'use client';

import { useState, useEffect, useCallback } from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { useAccount, useChainId } from 'wagmi';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function Home() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const router = useRouter();
  const [selectedAmount, setSelectedAmount] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [duration, setDuration] = useState(365);
  const [activeTab, setActiveTab] = useState('dca');
  const [bestRate, setBestRate] = useState<{ token: string; rate: string } | null>(null);
  const [allRates, setAllRates] = useState<{ token: string; rate: string; logo: string }[]>([]);

  const presetAmounts = [10, 100, 1000];

  const getAmount = useCallback(() => {
    return selectedAmount || parseFloat(customAmount) || 0;
  }, [selectedAmount, customAmount]);

  const getTotalAmount = useCallback(() => {
    return getAmount() * duration;
  }, [getAmount, duration]);

  const checkBestRate = useCallback(async () => {
    const amount = getAmount();
    if (amount <= 0 || !address) return;

    const amountInWei = Math.floor(amount * 1000000); // USDC has 6 decimals
    const tokens = [
      { name: 'CBBTC', address: '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf', logo: '/assets/cbbtc-logo.png' },
      { name: 'LBTC', address: '0xecac9c5f704e954931349da37f60e39f515c11c1', logo: '/assets/lbtc-logo.jpeg' },
      { name: 'WBTC', address: '0x0555e30da8f98308edb960aa94c0db47230d2b9c', logo: '/assets/wbtc-logo.png' }
    ];

    let bestToken = '';
    let bestAmount = '0';
    const rates: { token: string; rate: string; logo: string }[] = [];

    for (const token of tokens) {
      try {
        const response = await fetch(
          `https://api.enso.finance/api/v1/shortcuts/route?chainId=8453&slippage=500&fromAddress=${address}&amountIn=${amountInWei}&tokenIn=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&tokenOut=${token.address}`
        );
        const data = await response.json();
        
        if (data.amountOut) {
          rates.push({
            token: token.name,
            rate: data.amountOut,
            logo: token.logo
          });
          
          if (parseFloat(data.amountOut) > parseFloat(bestAmount)) {
            bestAmount = data.amountOut;
            bestToken = token.name;
          }
        }
      } catch (error) {
        console.error(`Error fetching rate for ${token.name}:`, error);
      }
    }

    // Sort rates by amount (highest first)
    rates.sort((a, b) => parseFloat(b.rate) - parseFloat(a.rate));
    setAllRates(rates);

    if (bestToken) {
      setBestRate({ token: bestToken, rate: bestAmount });
    }
  }, [address, getAmount]);

  useEffect(() => {
    if (getAmount() > 0 && isConnected && address) {
      setAllRates([]); // Clear previous rates
      setBestRate(null); // Clear previous best rate
      checkBestRate();
    } else {
      setAllRates([]);
      setBestRate(null);
    }
  }, [getAmount, isConnected, address, checkBestRate]);

  const executeTrade = async () => {
    if (!bestRate || !address) {
      alert('Please connect your wallet and select an amount first.');
      return;
    }
    
    const amount = getAmount();
    const amountInWei = Math.floor(amount * 1000000); // USDC has 6 decimals
    
    try {
      // Get the token address based on best rate
      const tokenAddresses = {
        'CBBTC': '0xcbb7c0000ab88b473b1f5afd9ef808440eed33bf',
        'LBTC': '0xecac9c5f704e954931349da37f60e39f515c11c1',
        'WBTC': '0x0555e30da8f98308edb960aa94c0db47230d2b9c'
      };
      
      const tokenOut = tokenAddresses[bestRate.token as keyof typeof tokenAddresses];
      
      // Get the transaction data from Enso API
      const response = await fetch(
        `https://api.enso.finance/api/v1/shortcuts/route?chainId=8453&slippage=500&fromAddress=${address}&amountIn=${amountInWei}&tokenIn=0x833589fcd6edb6e08f4c7c32d4f71b54bda02913&tokenOut=${tokenOut}`
      );
      
      const routeData = await response.json();
      
      if (routeData.tx) {
        // In a real implementation, this would use wagmi to execute the transaction
        const transactionType = activeTab === 'dca' ? 'DCA Strategy Setup' : 'One-Time Purchase';
        const totalAmount = activeTab === 'dca' ? getTotalAmount() : amount;
        const durationInfo = activeTab === 'dca' ? `\nDuration: ${duration} days\nDaily: ${amount} USDC` : '';
        
        alert(`${transactionType} prepared!\n\nWallet: ${address}\nSwapping: ${amount} USDC → ${bestRate.token}\nExpected output: ${parseFloat(bestRate.rate).toFixed(8)} tokens${durationInfo}\nTotal: $${totalAmount.toLocaleString()}\n\nTransaction data ready for wallet signature.`);
        
        // Here you would typically call:
        // const { writeContract } = useWriteContract();
        // await writeContract(routeData.tx);
        
        console.log('Transaction data:', routeData.tx);
        console.log('Connected wallet:', address);
        console.log('Chain ID:', chainId);
        console.log('Transaction type:', transactionType);
      } else {
        throw new Error('Failed to get transaction data from Enso API');
      }
    } catch (error) {
      console.error('Error executing trade:', error);
      alert('Error executing trade. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => router.push('/')}
            className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
          >
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">🌲</span>
            </div>
            <span className="text-xl font-bold text-gray-900">btc maximzer</span>
          </button>
          <nav className="flex space-x-8">
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'dca' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('dca')}
            >
              DCA
            </button>
            <button 
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'one-time' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => setActiveTab('one-time')}
            >
              One-Time Buy
            </button>
            <span className="px-4 py-2 rounded-lg font-medium text-gray-400">
              Investment
            </span>
          </nav>
          <div className="flex items-center">
            <ConnectButton />
          </div>
        </div>
      </header>

      {!isConnected ? (
        /* Landing Page */
        <main className="max-w-4xl mx-auto px-6 py-12 text-center">
          <div className="mb-8">
            <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-5xl text-white">₿</span>
            </div>
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Dollar Cost Averaging for Bitcoin
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Automatically invest in Bitcoin with the best rates using Enso Protocol
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🔄</div>
              <h3 className="font-semibold text-gray-900 mb-2">Automated DCA</h3>
              <p className="text-gray-600 text-sm">Set it and forget it - automated daily Bitcoin purchases</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-3">⚡</div>
              <h3 className="font-semibold text-gray-900 mb-2">Best Rates</h3>
              <p className="text-gray-600 text-sm">Enso Protocol finds the best rates across CBBTC, LBTC, and WBTC</p>
            </div>
            <div className="p-6 bg-white rounded-lg shadow-sm">
              <div className="text-3xl mb-3">🔒</div>
              <h3 className="font-semibold text-gray-900 mb-2">Secure</h3>
              <p className="text-gray-600 text-sm">Non-custodial, your keys, your Bitcoin</p>
            </div>
          </div>
          
          <div className="flex justify-center">
            <ConnectButton />
          </div>
        </main>
      ) : (
        /* Main Interface */
        <main className="max-w-6xl mx-auto px-6 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Panel - Configuration */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                {activeTab === 'dca' ? 'Dollar Cost Averaging' : 'One-Time Bitcoin Purchase'}
              </h2>
              
              {/* BTC Selection Header */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-center space-x-2">
                  <span className="text-2xl">🟠</span>
                  <span className="text-lg font-medium text-orange-700">
                    {activeTab === 'dca' ? 'Bitcoin DCA Strategy' : 'Optimal Bitcoin Purchase'}
                  </span>
                </div>
              </div>

              {/* Duration - Only show for DCA */}
              {activeTab === 'dca' && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    For <input 
                      type="number" 
                      value={duration} 
                      onChange={(e) => setDuration(parseInt(e.target.value) || 365)}
                      className="inline-block w-20 mx-2 px-2 py-1 border border-gray-300 rounded-md text-center"
                    /> days,
                  </label>
                </div>
              )}

              {/* Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {activeTab === 'dca' ? 'Every day I want to buy' : 'Amount to buy now'}
                </label>
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {presetAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {setSelectedAmount(amount); setCustomAmount('');}}
                      className={`py-3 px-4 rounded-lg border font-medium transition-colors ${
                        selectedAmount === amount
                          ? 'border-blue-600 bg-blue-50 text-blue-700'
                          : 'border-gray-300 text-gray-700 hover:border-gray-400'
                      }`}
                    >
                      ${amount}
                    </button>
                  ))}
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                  <input
                    type="text"
                    placeholder="Enter custom amount"
                    value={customAmount}
                    onChange={(e) => {setCustomAmount(e.target.value); setSelectedAmount(0);}}
                    className="w-full pl-8 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-2">You can buy up to $1,000,000</p>
              </div>

              {/* Total Amount - Different display for each tab */}
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium text-gray-700">
                    {activeTab === 'dca' ? 'Total Amount' : 'Purchase Amount'}
                  </span>
                  <span className="text-2xl font-bold text-blue-600">
                    ${activeTab === 'dca' ? getTotalAmount().toLocaleString() : getAmount().toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Confirm Button */}
              <button
                onClick={executeTrade}
                disabled={getAmount() <= 0}
                className={`w-full py-4 rounded-lg font-medium text-lg transition-colors ${
                  getAmount() > 0
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {activeTab === 'dca' ? 'Setup DCA Strategy' : 'Buy Bitcoin Now'}
              </button>
            </div>

            {/* Right Panel - Investment Summary */}
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              <div className="text-center mb-8">
                <div className="w-24 h-24 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl text-white">₿</span>
                </div>
                <h3 className="text-lg font-medium text-gray-600 mb-2">
                  {activeTab === 'dca' ? 'Daily Investment' : 'Purchase Amount'}
                </h3>
                <div className="text-4xl font-bold text-gray-900 mb-1">${getAmount()}</div>
                <div className="text-gray-500">USDC</div>
              </div>

              <div className="space-y-4">
                {activeTab === 'dca' && (
                  <div className="flex justify-between items-center py-3 border-b border-gray-100">
                    <span className="text-gray-600">Duration:</span>
                    <span className="font-medium">{duration} days</span>
                  </div>
                )}
                <div className="flex justify-between items-center py-3 border-b border-gray-100">
                  <span className="text-gray-600">
                    {activeTab === 'dca' ? 'Total Investment:' : 'Purchase Amount:'}
                  </span>
                  <span className="font-medium text-blue-600">
                    ${activeTab === 'dca' ? getTotalAmount().toLocaleString() : getAmount().toLocaleString()}
                  </span>
                </div>
                {allRates.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700 mb-3">Available Rates:</div>
                    {allRates.map((rate, index) => (
                      <div 
                        key={rate.token} 
                        className={`p-4 rounded-lg border ${
                          index === 0 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-gray-50 border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="w-8 h-8 relative">
                              <Image
                                src={rate.logo}
                                alt={`${rate.token} logo`}
                                fill
                                className="rounded-full object-cover"
                              />
                            </div>
                            <div>
                              <div className={`font-medium ${index === 0 ? 'text-green-700' : 'text-gray-700'}`}>
                                {rate.token}
                                {index === 0 && <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">BEST</span>}
                              </div>
                              <div className="text-sm text-gray-500">
                                {parseFloat(rate.rate).toFixed(8)} tokens
                              </div>
                            </div>
                          </div>
                          <div className={`text-right ${index === 0 ? 'text-green-600' : 'text-gray-600'}`}>
                            <div className="text-sm font-medium">
                              ${(parseFloat(rate.rate) * 0.00000001 * 95000).toFixed(2)}
                            </div>
                            <div className="text-xs">Est. Value</div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="text-xs text-blue-600 mt-2 text-center">✓ Optimized via Enso Protocol</div>
                  </div>
                )}
                
                {/* Loading state when checking rates */}
                {getAmount() > 0 && isConnected && allRates.length === 0 && (
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <div className="text-sm text-blue-600">Finding best rates...</div>
                    </div>
                  </div>
                )}
                
                {/* Wallet not connected message */}
                {getAmount() > 0 && !isConnected && (
                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="text-sm text-yellow-600">Please connect your wallet to see rates</div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </main>
      )}
    </div>
  );
}
