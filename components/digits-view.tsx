'use client';

import { useEffect, useMemo, useState } from 'react';
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
import { getMarketDisplayName } from '@/lib/active-symbols-display-names';
import {
  Activity,
  BarChart3,
  Blocks,
  Bot,
  BrainCircuit,
  Calculator,
  CandlestickChart,
  CircleDollarSign,
  Copy,
  FileText,
  Globe2,
  LineChart,
  Phone,
  Play,
  ShieldCheck,
  Sparkles,
  X,
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
  { icon: LineChart, name: 'Commodities', detail: 'Gold, oil, silver setups' },
  { icon: Globe2, name: 'Crypto watchlist', detail: 'BTC, ETH, momentum pairs' },
];

const BOT_MENU = [
  'Analysis Logics',
  'Trade parameters',
  'Purchase conditions',
  'Sell conditions',
  'Restart trading conditions',
  'Analysis',
  'Virtual Hook Switcher',
];

type BotId = 'digit-sniper' | 'match-hunter' | 'over-pulse' | 'under-sweep' | 'odd-even';

interface BotPlan {
  id: BotId;
  name: string;
  tradeType: TradeType;
  contractMode: ContractMode;
  digit: number;
  duration: number;
  confidence: number;
  reason: string;
}

function clampDuration(value: number, limits: DurationLimits): number {
  return Math.min(Math.max(value, limits.min), limits.max);
}

function buildBotPlans(digitStats: DigitStats, durationLimits: DurationLimits): BotPlan[] {
  const percentages = digitStats.percentages.length === 10
    ? digitStats.percentages
    : Array.from({ length: 10 }, () => 0);
  const total = digitStats.totalTicks || 0;
  const maxPct = Math.max(...percentages);
  const minPct = Math.min(...percentages);
  const strongestDigit = percentages.indexOf(maxPct);
  const weakestDigit = percentages.indexOf(minPct);
  const lowPressure = percentages.slice(0, 5).reduce((sum, pct) => sum + pct, 0);
  const highPressure = percentages.slice(5).reduce((sum, pct) => sum + pct, 0);
  const evenPressure = percentages.filter((_, digit) => digit % 2 === 0).reduce((sum, pct) => sum + pct, 0);
  const oddPressure = 100 - evenPressure;
  const baseConfidence = total > 0 ? 54 : 35;

  return [
    {
      id: 'digit-sniper',
      name: 'Digit Sniper Bot',
      tradeType: 'matches-differs',
      contractMode: 'DIGITDIFF',
      digit: weakestDigit,
      duration: clampDuration(1, durationLimits),
      confidence: Math.min(92, Math.round(baseConfidence + (100 - minPct) / 5)),
      reason: `Avoids digit ${weakestDigit}; it is printing only ${minPct.toFixed(1)}%.`,
    },
    {
      id: 'match-hunter',
      name: 'Match Hunter Bot',
      tradeType: 'matches-differs',
      contractMode: 'DIGITMATCH',
      digit: strongestDigit,
      duration: clampDuration(1, durationLimits),
      confidence: Math.min(88, Math.round(baseConfidence + maxPct * 1.4)),
      reason: `Targets digit ${strongestDigit}; it leads at ${maxPct.toFixed(1)}%.`,
    },
    {
      id: 'over-pulse',
      name: 'Over Pulse Bot',
      tradeType: 'over-under',
      contractMode: 'DIGITOVER',
      digit: highPressure >= lowPressure ? 4 : 3,
      duration: clampDuration(2, durationLimits),
      confidence: Math.min(90, Math.round(baseConfidence + Math.abs(highPressure - lowPressure) / 2)),
      reason: `High digit pressure: ${highPressure.toFixed(1)}%.`,
    },
    {
      id: 'under-sweep',
      name: 'Under Sweep Bot',
      tradeType: 'over-under',
      contractMode: 'DIGITUNDER',
      digit: lowPressure >= highPressure ? 5 : 6,
      duration: clampDuration(2, durationLimits),
      confidence: Math.min(90, Math.round(baseConfidence + Math.abs(lowPressure - highPressure) / 2)),
      reason: `Low digit pressure: ${lowPressure.toFixed(1)}%.`,
    },
    {
      id: 'odd-even',
      name: 'Odd Even Bot',
      tradeType: 'even-odd',
      contractMode: evenPressure >= oddPressure ? 'DIGITEVEN' : 'DIGITODD',
      digit: 0,
      duration: clampDuration(1, durationLimits),
      confidence: Math.min(89, Math.round(baseConfidence + Math.abs(evenPressure - oddPressure) / 2)),
      reason: `${evenPressure >= oddPressure ? 'Even' : 'Odd'} side leads at ${Math.max(evenPressure, oddPressure).toFixed(1)}%.`,
    },
  ];
}

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
  const [pendingBot, setPendingBot] = useState<BotPlan | null>(null);
  const botPlans = useMemo(
    () => buildBotPlans(digitStats, durationLimits),
    [digitStats, durationLimits]
  );
  const marketGroups = useMemo(() => {
    const groups = new Map<string, ActiveSymbol[]>();
    for (const symbol of symbols) {
      const existing = groups.get(symbol.market) ?? [];
      existing.push(symbol);
      groups.set(symbol.market, existing);
    }

    return Array.from(groups.entries())
      .map(([market, group]) => ({
        market,
        name: group[0]?.market_display_name ?? getMarketDisplayName(market),
        symbols: group.slice(0, 8),
        count: group.length,
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [symbols]);
  const accountBalance = activeAccount
    ? `${Number(activeAccount.balance).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })} ${activeAccount.currency}`
    : 'Connect account';

  function runBotTrade(plan: BotPlan) {
    if (!isAuthenticated || !isConnected || isBuying) return;

    setTradeType(plan.tradeType);
    setContractMode(plan.contractMode);
    setSelectedDigit(plan.digit);
    setDuration(plan.duration);
    if (!stake || Number(stake) <= 0) setStake('1');
    setPendingBot(plan);
  }

  useEffect(() => {
    if (!pendingBot || !isAuthenticated || !isConnected || isBuying || isProposalLoading || !proposal) return;

    const settingsReady =
      tradeType === pendingBot.tradeType &&
      contractMode === pendingBot.contractMode &&
      selectedDigit === pendingBot.digit &&
      duration === pendingBot.duration;

    if (!settingsReady) return;

    setPendingBot(null);
    void buyContract();
  }, [
    buyContract,
    contractMode,
    duration,
    isAuthenticated,
    isBuying,
    isConnected,
    isProposalLoading,
    pendingBot,
    proposal,
    selectedDigit,
    tradeType,
  ]);

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

      {!isAuthenticated ? (
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-5 pb-14">
          <section className="senior-login-page">
            <div className="senior-hero-copy">
              <div className="senior-kicker">
                <Sparkles className="h-4 w-4" />
                Senior Trader
              </div>
              <h2>Login first. Trade on the bot-builder screen.</h2>
              <p>
                A focused trading app with five market-analysis bots. Connect your Deriv account, then enter a
                dedicated trading workspace with live ticks, bot plans, and controlled execution.
              </p>
              <div className="senior-hero-actions">
                <Button
                  onClick={onLogin}
                  disabled={authState === 'authenticating'}
                  className="rounded-full bg-cyan-400 px-6 font-black text-slate-950 hover:bg-cyan-300"
                >
                  {authState === 'authenticating' ? 'Connecting...' : 'Login to dashboard'}
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
            <div className="senior-login-card">
              <strong>Next screen</strong>
              <span>Bot Builder</span>
              <p>After login, this page changes into a full bot-builder terminal. No trading happens on the intro page.</p>
            </div>
          </section>

          <section className="senior-login-steps">
            {['Login securely', 'Open bot builder', 'Run selected bot'].map((step, index) => (
              <div key={step}>
                <span>0{index + 1}</span>
                <strong>{step}</strong>
                <p>{index === 0 ? 'Use Deriv authentication.' : index === 1 ? 'View analysis and bot blocks.' : 'Click Run trade when ready.'}</p>
              </div>
            ))}
          </section>
        </div>
      ) : (
        <div className="senior-builder">
          <div className="senior-red-strip">
            DOLLARPRINTER STYLE - YOUR HUB FOR TRADING KNOWLEDGE, DERIV INDICES, AND BOT AUTOMATION
            <X className="h-5 w-5" />
          </div>

          <nav className="senior-blue-tabs">
            {[
              ['Dashboard', Blocks],
              ['Bot Builder', Bot],
              ['Charts', LineChart],
              ['Trading Bots', BrainCircuit],
              ['Analysis Tool', BarChart3],
              ['Strategies', ShieldCheck],
              ['Risk Calculator', Calculator],
              ['Copy Trading', Copy],
              ['DTrader', CandlestickChart],
            ].map(([label, Icon]) => {
              const TabIcon = Icon as typeof Bot;
              return (
                <button className={label === 'Bot Builder' ? 'active' : ''} key={label as string} type="button">
                  <TabIcon className="h-4 w-4" />
                  {label as string}
                </button>
              );
            })}
          </nav>

          <section className="senior-all-markets">
            <div>
              <span>All markets</span>
              <strong>{symbols.length} tradable symbols</strong>
            </div>
            <div className="senior-market-scroll">
              {marketGroups.map((group) => (
                <div className="senior-market-group" key={group.market}>
                  <b>{group.name}</b>
                  <small>{group.count} markets</small>
                  <div>
                    {group.symbols.map((symbol) => (
                      <button
                        className={activeSymbol?.underlying_symbol === symbol.underlying_symbol ? 'selected' : ''}
                        key={symbol.underlying_symbol}
                        onClick={() => selectSymbol(symbol.underlying_symbol)}
                        type="button"
                      >
                        {symbol.underlying_symbol_name}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="senior-builder-grid">
            <aside className="senior-blocks-menu">
              <button className="quick">Quick strategy</button>
              <div className="blocks-title">Blocks menu</div>
              <input placeholder="Search" />
              {BOT_MENU.map((item) => (
                <button key={item} type="button">{item}</button>
              ))}
              <span className="risk-chip">Risk Disclaimer</span>
            </aside>

            <section className="senior-builder-canvas">
              <div className="senior-toolbar">
                <FileText className="h-5 w-5" />
                <LineChart className="h-5 w-5" />
                <Zap className="h-5 w-5" />
                <span />
                <Activity className="h-5 w-5" />
              </div>

              {isLoading ? (
                <Skeleton className="h-[520px] w-full rounded-xl" />
              ) : (
                <div className="senior-block-board">
                  <div className="bot-block trade-params">
                    <h3>1. Trade parameters</h3>
                    <div className="block-row"><span>Market</span><b>{activeSymbol?.underlying_symbol_name ?? 'Select market'}</b></div>
                    <div className="block-row"><span>Trade type</span><b>{tradeType}</b></div>
                    <div className="block-row"><span>Contract</span><b>{contractMode}</b></div>
                    <div className="block-row"><span>Stake</span><b>{stake || '1'} USD</b></div>
                    <div className="block-row"><span>Duration</span><b>{duration} ticks</b></div>
                    <p>print Dollar mode activated - stay ready</p>
                  </div>

                  <div className="bot-block purchase">
                    <h3>2. Purchase conditions</h3>
                    <SymbolSelector symbols={symbols} activeSymbol={activeSymbol} onSymbolChange={selectSymbol} />
                    <TradeTypeChips value={tradeType} options={DIGIT_TRADE_TYPE_OPTIONS} onValueChange={setTradeType} />
                    <CurrentTickDisplay tick={currentTick} lastDigit={lastDigit} activeSymbol={activeSymbol} pipSize={pipSize} />
                  </div>

                  <div className="bot-block sell">
                    <h3>3. Sell conditions</h3>
                    <span className="mini-pill">Take profit: proposal payout</span>
                    <span className="mini-pill">Stop when signal weakens</span>
                  </div>

                  <div className="bot-block restart">
                    <h3>4. Restart trading conditions</h3>
                    <p>If result is win, notify success and reset trade amount.</p>
                    <p>If result is loss, reduce exposure and wait for the next bot signal.</p>
                  </div>

                  <div className="bot-block analytics">
                    <h3>Live digit analytics</h3>
                    <DigitStatsBar digitStats={digitStats} selectedDigit={selectedDigit} onDigitSelect={setSelectedDigit} />
                  </div>

                  <div className="bot-block controls">
                    <h3>Manual trade controls</h3>
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
              )}
            </section>

            <aside className="senior-run-panel">
              <button className="run-button" disabled={!isConnected || isBuying} onClick={() => runBotTrade(botPlans[0])} type="button">
                <Play className="h-5 w-5" />
                Run
              </button>
              <strong>{pendingBot ? `${pendingBot.name} is running` : 'Bot is not running'}</strong>
              <div className="run-tabs">
                <span className="active">Summary</span>
                <span>Transact...</span>
                <span>Journal</span>
              </div>
              <div className="summary-box">
                <p>{pendingBot ? pendingBot.reason : 'Choose a bot below or hit Run. Performance appears here after execution.'}</p>
                <div className="ai-badge">AI</div>
              </div>
              <div className="bot-list-runner">
                {botPlans.map((bot) => (
                  <button disabled={!isConnected || isBuying} key={bot.id} onClick={() => runBotTrade(bot)} type="button">
                    <span>{bot.name}</span>
                    <b>{bot.confidence}%</b>
                    <small>{bot.reason}</small>
                  </button>
                ))}
              </div>
              <div className="run-totals">
                <span>Total stake<br /><b>{stake || '0.00'} USD</b></span>
                <span>Total payout<br /><b>{proposal ? proposal.payout.toFixed(2) : '0.00'} USD</b></span>
                <span>No. of runs<br /><b>{pendingBot ? 1 : 0}</b></span>
              </div>
            </aside>
          </section>
        </div>
      )}

      <div className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-[#08111f]/90 py-2 text-center backdrop-blur-xl">
        <Footer />
      </div>
    </main>
  );
}
