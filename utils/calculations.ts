import { PlanConfig, DailyProjection, RiskAnalysis } from '../types';

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const calculateProjection = (config: PlanConfig): DailyProjection[] => {
  const projection: DailyProjection[] = [];
  let currentBalance = config.initialBalance;
  let day = 1;
  const maxSimulationDays = 365 * 5; // Allow longer simulation for smaller %

  // Generate projection until target is met
  while (currentBalance < config.targetBalance && day <= maxSimulationDays) {
    const dailyTargetValue = currentBalance * (config.dailyPercentage / 100);
    const endBalance = currentBalance + dailyTargetValue;
    
    const tradesNeeded = config.winAmount > 0 ? dailyTargetValue / config.winAmount : 0;

    projection.push({
      day,
      startBalance: currentBalance,
      dailyTargetValue,
      endBalance,
      tradesNeeded,
      accumulatedProfit: endBalance - config.initialBalance
    });

    currentBalance = endBalance;
    day++;
  }

  return projection;
};

// Finds which "Plan Day" corresponds to the given balance
export const findPlanDay = (balance: number, projection: DailyProjection[], initialBalance: number): number => {
  if (balance < initialBalance) return 0; // Below start
  if (projection.length === 0) return 0;

  // Find the last day where the balance is greater than or equal to that day's START balance
  // Basically, if I have 160, and Day 1 ends at 154, Day 2 ends at 159, Day 3 ends at 164.
  // I have completed Day 2, and am currently working on Day 3.
  
  // However, simpler logic: The "Plan Day" is the index in the projection where this balance fits.
  // We want to know: "This balance looks like the balance of Day X".
  
  for (let i = projection.length - 1; i >= 0; i--) {
    if (balance >= projection[i].startBalance) {
      return projection[i].day;
    }
  }
  
  return 1;
};

export const analyzeRisk = (balance: number, lossAmount: number): RiskAnalysis => {
  const riskPercentage = balance > 0 ? (lossAmount / balance) * 100 : 0;
  const isHighRisk = riskPercentage > 5; 
  const maxConsecutiveLosses = lossAmount > 0 ? Math.floor(balance / lossAmount) : 0;
  const recommendedStopLoss = balance * 0.03; 

  return {
    riskPercentage,
    isHighRisk,
    maxConsecutiveLosses,
    recommendedStopLoss
  };
};