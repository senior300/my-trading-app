'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Footer } from '@/components/custom/footer';
import { Header } from '@/components/custom/header';
import { Skeleton } from '@/components/ui/skeleton';
import { CurrentTickDisplay } from './current-tick-display';
import { DigitStatsBar } from './digit-stats-bar';
import { TradeControls } from './trade-controls';
import { TradeTypeChips } from '@/components/custom/trade-type-chips';
import { SymbolSelector } from '@/components/custom/symbol-selector';
import { ThemeToggle } from '@/components/custom/theme-toggle';
import { Button } from '@/components/ui/button';
import {
  Activity,
  BarChart3,
  Bot,
  BrainCircuit,
  CandlestickChart,
  CircleDollarSign,
  Globe2,
  LineChart,
  Phone,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  AuthState,
  DerivAccount,
  ActiveSymbol,
  Tick,
  ProposalInfo,
  DurationLimits,
  BuyResult,
} from '@deriv/core';
import type { ContractMode, TradeType, DigitStats } from '../lib/types';

const DIGIT_TRADE_TYPE_OPTIONS: { value: TradeType; label: string }[] = [
  { value: 'matches-differs', label: 'Matches/Differs' },
  { value: 'over-under', label: 'Over/Under' },
  { value: 'even-odd', label: 'Even/Odd' },
];

const MARKET_CARDS = [
  { icon: CandlestickChart, name: 'Synthetic indices', detail: 'Volatility, Boom, Crash, Step' },
  { icon: CircleDollarSign, name: 'Forex majors', detail: 'EUR/USD, GBP/USD, USD/JPY' },
  { icon: LineChart, name: 'Commodities', detail: 'Gold, oil, silver focused setups' },
  { icon: Globe2, name: 'Crypto watchlist', detail: 'BTC, ETH, high momentum pairs' },
];

const BOT_CARDS = [
  { name: 'Digit Sniper Bot', status: 'Ready', detail: 'Tracks last-digit distribution and prepares short tick entries.' },
  { name: 'Trend Guard Bot', status: 'Monitor', detail: 'Filters markets using volatility and recent tick direction.' },
  { name: 'Risk Shield', status: 'Active', detail: 'Keeps stake, duration, and account mode visible before execution.' },
];

export interface DigitsViewProps {
  authState: AuthState;
  accounts: DerivAccount[];
  activeAccount: DerivAccount | null;
  onLogin: () => Promise<void>;
  onSignUp: () => Promise<void>;
  onLogout: () => void;
  onSwitchAccount: (accountId: string) => Promise<void>;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  symbols: ActiveSymbol[];
  activeSymbol: ActiveSymbol | null;
  selectSymbol: (symbol: string) => void;
  currentTick: Tick | null;
  lastDigit: number | null;
  digitStats: DigitStats;
  pipSize: number;
  tradeType: TradeType;
  setTradeType: (type: TradeType) => void;
  contractMode: ContractMode;
  setContractMode: (mode: ContractMode) => void;
  selectedDigit: number;
  setSelectedDigit: (digit: number) => void;
  stake: string;
  setStake: (value: string) => void;
  duration: number;
  setDuration: (value: number) => void;
  durationLimits: DurationLimits;
  proposal: ProposalInfo | null;
  isProposalLoading: boolean;
  buyContract: () => Promise<void>;
  isBuying: boolean;
  buyResult: BuyResult | null;
  buyError: string | null;
  clearBuyResult: () => void;
  logoSrc?: string;
  appName?: string;
}

export function DigitsView({
  authState,
  accounts,
  activeAccount,
  onLogin,
  onSignUp,
  onLogout,
  onSwitchAccount,
  isConnected,
  isLoading,
  error,
  symbols,
  activeSymbol,
  selectSymbol,
  currentTick,
  lastDigit,
  digitStats,
  pipSize,
  tradeType,
  setTradeType,
  contractMode,
  setContractMode,
  selectedDigit,
  setSelectedDigit,
  stake,
  setStake,
  duration,
  setDuration,
  durationLimits,
  proposal,
  isProposalLoading,
  buyContract,
  isBuying,
  buyResult,
  buyError,
  clearBuyResult,
  logoSrc,
  appName,
}: DigitsViewProps) {
  const isAuthenticated = authState === 'authenticated';
  const accountBalance = activeAccount
    ? `${Number(activeAccount.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${activeAccount.currency}`
    : 'Connect account';
  const visibleSymbols = symbols.slice(0, 6);

  if (error) {
    return (
      <main className="flex min-h-dvh flex-col items-center justify-center bg-background px-4">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Connection Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{error}</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="senior-shell flex flex-col max-lg:h-dvh max-lg:overflow-y-auto lg:overflow-visible">
      <Header
        authState={authState}
        accounts={accounts}
        activeAccount={activeAccount}
        onLogin={onLogin}
        onSignUp={onSignUp}
        onLogout={onLogout}
        onSwitchAccount={onSwitchAccount}
        logoSrc={logoSrc}
        appName={appName}
        actions={<ThemeToggle />}
      />
      <div className={isAuthenticated ? 'h-[76px] shrink-0' : 'h-[66px] shrink-0'} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-4 px-3 py-3 pb-14 sm:px-5 sm:py-5 lg:flex-none lg:overflow-visible">
        <section className="senior-hero">
          <div className="senior-hero-copy">
            <div className="senior-kicker">
              <Sparkles className="h-4 w-4" />
              Senior Trader automation suite
            </div>
            <h2>Trade smarter across markets with bots, live ticks, and controlled execution.</h2>
            <p>
              A polished trading terminal for synthetic indices, forex, commodities, and crypto watchlists.
              Login to connect your account, review the market, configure a bot idea, and execute from one dashboard.
            </p>
            <div className="senior-hero-actions">
              <Button
                onClick={onLogin}
                disabled={authState === 'authenticating'}
                className="rounded-full bg-cyan-400 px-6 font-black text-slate-950 hover:bg-cyan-300"
              >
                {isAuthenticated ? 'Account connected' : authState === 'authenticating' ? 'Connecting...' : 'Login and trade'}
              </Button>
              <Button
                onClick={onSignUp}
                variant="outline"
                className="rounded-full border-white/20 bg-white/10 px-6 font-bold text-white hover:bg-white/20 hover:text-white"
              >
                Create account
              </Button>
              <a href="tel:0718462802" className="senior-phone">
                <Phone className="h-4 w-4" />
                0718462802
              </a>
            </div>
          </div>

          <div className="senior-account-card">
            <span>Trading balance</span>
            <strong>{accountBalance}</strong>
            <div className="senior-status-row">
              <span className={isConnected ? 'is-live' : ''}>
                <Activity className="h-4 w-4" />
                {isConnected ? 'Live feed connected' : 'Waiting for market feed'}
              </span>
              <span>
                <ShieldCheck className="h-4 w-4" />
                {isAuthenticated ? activeAccount?.account_type ?? 'Account' : 'Login required'}
              </span>
            </div>
          </div>
        </section>

        <section className="senior-overview-grid">
          <div className="senior-panel senior-panel-wide">
            <div className="senior-section-heading">
              <div>
                <span>Markets</span>
                <h3>All-market command center</h3>
              </div>
              <BarChart3 className="h-6 w-6" />
            </div>
            <div className="senior-market-grid">
              {MARKET_CARDS.map((market) => {
                const Icon = market.icon;
                return (
                  <div className="senior-market-card" key={market.name}>
                    <Icon className="h-5 w-5" />
                    <strong>{market.name}</strong>
                    <span>{market.detail}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="senior-panel">
            <div className="senior-section-heading">
              <div>
                <span>Bots</span>
                <h3>Strategy automation</h3>
              </div>
              <Bot className="h-6 w-6" />
            </div>
            <div className="senior-bot-list">
              {BOT_CARDS.map((bot) => (
                <div className="senior-bot-card" key={bot.name}>
                  <BrainCircuit className="h-5 w-5" />
                  <div>
                    <strong>{bot.name}</strong>
                    <p>{bot.detail}</p>
                  </div>
                  <span>{bot.status}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {isLoading ? (
          <>
            <div className="flex gap-2">
              <Skeleton className="h-8 w-32 rounded-full" />
              <Skeleton className="h-8 w-28 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
            <Skeleton className="h-[420px] w-full rounded-xl" />
          </>
        ) : (
          <>
            <div className="senior-trade-topline">
              <div>
                <span>Trade terminal</span>
                <h3>Digits execution workspace</h3>
              </div>
              <div className="shrink-0 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [-webkit-overflow-scrolling:touch] [&::-webkit-scrollbar]:hidden">
                <TradeTypeChips
                  value={tradeType}
                  options={DIGIT_TRADE_TYPE_OPTIONS}
                  onValueChange={setTradeType}
                />
              </div>
            </div>

            <Card className="senior-trade-card mb-12 shrink-0">
              <CardContent className="flex flex-col p-3 pb-2 pt-3 sm:p-6 sm:pb-6 sm:pt-4">
                <div className={`lg:grid lg:overflow-visible ${tradeType !== 'even-odd' ? 'lg:grid-cols-3' : 'lg:grid-cols-2'}`}>
                  <div className="flex flex-col pb-4 pt-1 sm:pb-6 sm:pt-2 lg:py-0 lg:pr-6">
                    <div className="senior-column-label">
                      <Zap className="h-4 w-4" />
                      Market selector
                    </div>
                    <SymbolSelector
                      symbols={symbols}
                      activeSymbol={activeSymbol}
                      onSymbolChange={selectSymbol}
                    />
                    {visibleSymbols.length > 0 && (
                      <div className="senior-symbol-strip">
                        {visibleSymbols.map((symbol) => (
                          <button key={symbol.underlying_symbol} onClick={() => selectSymbol(symbol.underlying_symbol)}>
                            {symbol.underlying_symbol_name}
                          </button>
                        ))}
                      </div>
                    )}
                    <div className="flex min-h-24 items-center justify-center sm:min-h-32 lg:flex-1">
                      <CurrentTickDisplay
                        tick={currentTick}
                        lastDigit={lastDigit}
                        activeSymbol={activeSymbol}
                        pipSize={pipSize}
                      />
                    </div>
                  </div>

                  <div className="divide-y divide-border max-lg:border-t lg:contents">
                    {tradeType !== 'even-odd' && (
                      <div className="py-4 sm:py-6 lg:border-l lg:border-border lg:px-6 lg:py-0">
                        <div className="senior-column-label">
                          <BarChart3 className="h-4 w-4" />
                          Digit analytics
                        </div>
                        <DigitStatsBar
                          digitStats={digitStats}
                          selectedDigit={selectedDigit}
                          onDigitSelect={setSelectedDigit}
                        />
                      </div>
                    )}

                    <div className="pt-4 sm:pt-6 lg:border-l lg:border-border lg:pl-6 lg:pt-0">
                      <div className="senior-column-label">
                        <Bot className="h-4 w-4" />
                        Bot execution
                      </div>
                      <TradeControls
                        tradeType={tradeType}
                        contractMode={contractMode}
                        onContractModeChange={setContractMode}
                        selectedDigit={selectedDigit}
                        isConnected={isConnected}
                        stake={stake}
                        onStakeChange={setStake}
                        duration={duration}
                        onDurationChange={setDuration}
                        durationLimits={durationLimits}
                        proposal={proposal}
                        isProposalLoading={isProposalLoading}
                        onBuy={buyContract}
                        isBuying={isBuying}
                        buyResult={buyResult}
                        buyError={buyError}
                        onClearBuyResult={clearBuyResult}
                        isAuthenticated={isAuthenticated}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="senior-risk-note">
              Trading involves risk. Bots and indicators assist decisions but do not guarantee profit.
              Use demo mode first, trade with a plan, and contact support on 0718462802 for setup help.
            </div>
          </>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#08111f]/90 py-2 text-center backdrop-blur-xl">
        <Footer />
      </div>
    </main>
  );
}
