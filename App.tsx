import React, { useState, useMemo, useEffect } from 'react';
import { PlanConfig, TradeHistory } from './types';
import { calculateProjection, analyzeRisk, findPlanDay, formatCurrency } from './utils/calculations';
import ConfigPanel from './components/ConfigPanel';
import GrowthChart from './components/GrowthChart';
import GrowthTable from './components/GrowthTable';
import RiskWarning from './components/RiskWarning';
import DailyInput from './components/DailyInput';
import HistoryLog from './components/HistoryLog';
import { Activity, Calendar, Award, AlertOctagon, ListOrdered } from 'lucide-react';

const App: React.FC = () => {
  // Config state
  const [config, setConfig] = useState<PlanConfig>({
    initialBalance: 150,
    targetBalance: 10000,
    winAmount: 3.0,
    lossAmount: 20.0,
    dailyPercentage: 3.0,
    maxTradesPerDay: 5
  });

  // Application State
  const [currentBalance, setCurrentBalance] = useState<number>(config.initialBalance);
  const [history, setHistory] = useState<TradeHistory[]>([]);

  // Derived state: Projection Roadmap
  const projection = useMemo(() => calculateProjection(config), [config]);
  
  // Calculate Current Plan Day based on Balance
  const currentPlanDay = useMemo(() => {
    return findPlanDay(currentBalance, projection, config.initialBalance);
  }, [currentBalance, projection, config.initialBalance]);

  const riskAnalysis = useMemo(() => analyzeRisk(currentBalance, config.lossAmount), [currentBalance, config.lossAmount]);

  // Derived Values
  const totalDays = projection.length;
  const daysRemaining = Math.max(0, totalDays - currentPlanDay);
  const progressPercent = Math.min(100, (currentPlanDay / totalDays) * 100);
  
  // Get today's goal based on the projected plan day
  // If we are at Day 5, we want to achieve the growth for Day 5
  const currentPlanData = projection.find(p => p.day === currentPlanDay) || projection[0];
  const dailyGoalValue = currentBalance * (config.dailyPercentage / 100);

  // Reset current balance if user changes initial balance drastically (optional safety, or just sync)
  useEffect(() => {
    // If history is empty, sync current balance with config initial
    if (history.length === 0) {
      setCurrentBalance(config.initialBalance);
    } else {
      // If config changes, we should technically recalculate history based on new initial balance
      // but to preserve user data integrity we trigger a recalculation
      recalculateHistoryChain(history, config.initialBalance);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config.initialBalance]);

  // CORE FUNCTION: Recalculates the entire timeline to ensure math is always consistent
  const recalculateHistoryChain = (currentHistory: TradeHistory[], startBal: number) => {
    let runningBalance = startBal;
    
    // We need to use the current projection logic
    const currentProjection = calculateProjection(config);

    const updatedHistory = currentHistory.map(trade => {
       const startBalance = runningBalance;
       const endBalance = startBalance + trade.resultValue;
       
       const startPlanDay = findPlanDay(startBalance, currentProjection, config.initialBalance);
       const endPlanDay = findPlanDay(endBalance, currentProjection, config.initialBalance);
       
       runningBalance = endBalance;
       
       return {
         ...trade,
         startBalance,
         endBalance,
         startPlanDay,
         endPlanDay,
         dayShift: endPlanDay - startPlanDay
       };
    });

    setHistory(updatedHistory);
    setCurrentBalance(runningBalance);
  };

  const handleFinishDay = (result: number) => {
    // Simple ID generator fallback
    const newId = Math.random().toString(36).substring(2, 11);
    
    const newEntry: TradeHistory = {
      id: newId,
      date: new Date().toISOString(),
      startBalance: 0, // Placeholder, will be calculated
      resultValue: result,
      endBalance: 0, // Placeholder
      startPlanDay: 0,
      endPlanDay: 0,
      dayShift: 0
    };

    recalculateHistoryChain([...history, newEntry], config.initialBalance);
  };

  const handleDeleteHistory = (id: string) => {
    // Removed window.confirm to ensure action executes immediately
    const newHistory = history.filter(item => item.id !== id);
    recalculateHistoryChain(newHistory, config.initialBalance);
  };

  const handleEditHistory = (id: string, newResult: number) => {
    const newHistory = history.map(item => {
      if (item.id === id) {
        return { ...item, resultValue: newResult };
      }
      return item;
    });
    
    recalculateHistoryChain(newHistory, config.initialBalance);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans selection:bg-emerald-500/30">
      
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="text-emerald-500" size={28} />
            <h1 className="text-xl sm:text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">
              TraderPlan Pro
            </h1>
          </div>
          <div className="flex items-center gap-3">
             <div className="text-right hidden sm:block">
                <p className="text-xs text-slate-400">Banca Atual</p>
                <p className="text-lg font-bold text-white leading-none">{formatCurrency(currentBalance)}</p>
             </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Configuration */}
          <div className="lg:col-span-3 space-y-6">
             {/* Status Card (Mobile/Desktop) */}
            <div className={`p-5 rounded-xl border shadow-lg ${
                history.length > 0 && history[history.length-1].dayShift < 0 
                ? 'bg-red-900/10 border-red-500/30' 
                : 'bg-indigo-900/20 border-indigo-500/30'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-slate-400 text-sm uppercase font-bold tracking-wider">Dia do Plano</span>
                <Calendar className="text-indigo-400" size={20} />
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-white">{currentPlanDay}</span>
                <span className="text-sm text-slate-400">de {totalDays}</span>
              </div>
              
              <div className="mt-4">
                <div className="flex justify-between text-xs mb-1 text-slate-300">
                  <span>Progresso</span>
                  <span>{progressPercent.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-indigo-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>

              {history.length > 0 && (
                <div className="mt-4 pt-4 border-t border-slate-700/50 text-sm">
                  <p className="text-slate-400 mb-1">Último Fechamento:</p>
                  {history[history.length-1].dayShift > 0 ? (
                    <p className="text-emerald-400 font-bold flex items-center gap-1">
                      <Award size={14}/> Avançou {history[history.length-1].dayShift} dias!
                    </p>
                  ) : history[history.length-1].dayShift < 0 ? (
                    <p className="text-red-400 font-bold flex items-center gap-1">
                      <AlertOctagon size={14}/> Regrediu {Math.abs(history[history.length-1].dayShift)} dias
                    </p>
                  ) : (
                    <p className="text-slate-300">Dia Neutro</p>
                  )}
                </div>
              )}
            </div>

            <ConfigPanel config={config} onChange={setConfig} />
          </div>

          {/* Right Column: Visualization */}
          <div className="lg:col-span-9 space-y-6">
            
            <RiskWarning analysis={riskAnalysis} currentBalance={currentBalance} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Input Section */}
                <DailyInput 
                    currentBalance={currentBalance} 
                    dailyGoal={dailyGoalValue}
                    onFinishDay={handleFinishDay}
                />

                {/* Info Card */}
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg flex flex-col justify-center space-y-4">
                    <h3 className="text-lg font-semibold text-slate-300">Próximos Passos</h3>
                    
                    <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                        <span className="text-slate-400 text-sm">Meta para sair do Dia {currentPlanDay}</span>
                        <span className="font-mono text-emerald-400 font-bold">
                            {formatCurrency(currentPlanData?.endBalance || 0)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                        <span className="text-slate-400 text-sm">Faltam para a Meta Final</span>
                        <span className="font-mono text-cyan-400 font-bold">
                             {formatCurrency(config.targetBalance - currentBalance)}
                        </span>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-900 rounded-lg">
                        <span className="text-slate-400 text-sm">Operações Necessárias (Hoje)</span>
                        <span className="font-mono text-white font-bold">
                            ~{Math.ceil(dailyGoalValue / config.winAmount)} wins
                        </span>
                    </div>
                </div>
            </div>

            {/* History Table */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
              <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <Calendar size={20} className="text-slate-400"/>
                Diário de Bordo
              </h3>
              <HistoryLog 
                history={history} 
                onDelete={handleDeleteHistory}
                onEdit={handleEditHistory}
              />
            </div>

             {/* Plan Table */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl">
               <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                 <ListOrdered size={20} className="text-emerald-500"/>
                 Tabela do Plano
               </h3>
               <p className="text-sm text-slate-400 mb-4">Visualize sua jornada completa. A linha destacada é onde seu saldo atual te coloca no plano.</p>
               <GrowthTable 
                 data={projection} 
                 winAmount={config.winAmount} 
                 currentPlanDay={currentPlanDay} 
                />
            </div>

            {/* Chart Section */}
            <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-xl opacity-80 hover:opacity-100 transition-opacity">
               <h3 className="text-sm font-semibold text-slate-400 mb-4 uppercase">Gráfico de Evolução (Projeção)</h3>
               <GrowthChart data={projection} />
            </div>

          </div>
        </div>
      </main>
    </div>
  );
};

export default App;