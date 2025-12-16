export interface PlanConfig {
  initialBalance: number;
  targetBalance: number;
  winAmount: number;
  lossAmount: number;
  dailyPercentage: number;
  maxTradesPerDay?: number;
}

export interface DailyProjection {
  day: number;
  startBalance: number;
  dailyTargetValue: number;
  endBalance: number;
  tradesNeeded: number;
  accumulatedProfit: number;
}

export interface RiskAnalysis {
  riskPercentage: number; // Loss Amount / Current Balance
  isHighRisk: boolean;
  maxConsecutiveLosses: number; // How many losses until bankruptcy (simplistic)
  recommendedStopLoss: number; // 2-3% of balance
}

export interface TradeHistory {
  id: string;
  date: string; // ISO string
  startBalance: number;
  resultValue: number; // Profit or Loss amount
  endBalance: number;
  startPlanDay: number;
  endPlanDay: number;
  dayShift: number; // +2 days, -5 days, etc.
  note?: string;
}