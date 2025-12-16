import React, { useState, useMemo, useEffect } from 'react';
import { PlanConfig, TradeHistory } from './types';
import { calculateProjection, analyzeRisk, findPlanDay, formatCurrency } from './utils/calculations';
import ConfigPanel from './components/ConfigPanel';
import GrowthChart from './components/GrowthChart';
import GrowthTable from './components/GrowthTable';
import RiskWarning from './components/RiskWarning';
import DailyInput from './components/DailyInput';
import HistoryLog from './components/HistoryLog';
import { Activity, Calendar, Award, AlertOctagon, ListOrdered, RefreshCw } from 'lucide-react';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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

  const totalDays = projection.length;
  const progressPercent = Math.min(100, (currentPlanDay / totalDays) * 100);
  const currentPlanData = projection.find(p => p.day === currentPlanDay) || projection[0];
  const dailyGoalValue = currentBalance * (config.dailyPercentage / 100);

  // --- SUPABASE INTEGRATION ---

  // 1. Fetch Data on Mount
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch Config
        const { data: configData, error: configError } = await supabase
          .from('plan_config')
          .select('*')
          .single(); // Assuming single user/single config for now

        if (configData && !configError) {
          setConfig({
            initialBalance: configData.initial_balance,
            targetBalance: configData.target_balance,
            winAmount: configData.win_amount,
            lossAmount: configData.loss_amount,
            dailyPercentage: configData.daily_percentage,
            maxTradesPerDay: configData.max_trades_per_day
          });
        }

        // Fetch History
        const { data: historyData, error: historyError } = await supabase
          .from('trade_history')
          .select('*')
          .order('date', { ascending: true }); // Oldest first to calculate chain

        if (historyData && !historyError) {
          // Map snake_case to camelCase
          const mappedHistory: TradeHistory[] = historyData.map((item: any) => ({
            id: item.id,
            date: item.date,
            resultValue: item.result_value,
            // These calculated fields might be stale in DB, we will recalculate them below
            startBalance: item.start_balance,
            endBalance: item.end_balance,
            startPlanDay: item.start_plan_day,
            endPlanDay: item.end_plan_day,
            dayShift: item.day_shift
          }));
          
          // Important: Recalculate chain using the config we just loaded (or default)
          const startBal = configData ? configData.initial_balance : 150;
          recalculateHistoryChain(mappedHistory, startBal);
        } else {
           // If no history, just sync balance
           setCurrentBalance(configData ? configData.initial_balance : 150);
        }

      } catch (error) {
        console.error("Error loading data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // 2. Save Config Debounced
  useEffect(() => {
    if (loading) return;

    const timer = setTimeout(async () => {
      setSaving(true);
      const { error } = await supabase
        .from('plan_config')
        .upsert({
          id: 1, // Force singleton row
          initial_balance: config.initialBalance,
          target_balance: config.targetBalance,
          win_amount: config.winAmount,
          loss_amount: config.lossAmount,
          daily_percentage: config.dailyPercentage,
          max_trades_per_day: config.maxTradesPerDay
        });
      
      if (error) console.error("Error saving config", error);
      setSaving(false);
      
      // When config changes (e.g. initial balance), we must recalculate history
      recalculateHistoryChain(history, config.initialBalance);

    }, 1000); // Save 1s after last change

    return () => clearTimeout(timer);
  }, [config]);


  // CORE FUNCTION: Recalculates the entire timeline
  // Now simpler: it just updates state. The persistence happens in the event handlers.
  const recalculateHistoryChain = (currentHistory: TradeHistory[], startBal: number) => {
    let runningBalance = startBal;
    
    // Use current (or passed) config for projection logic
    // Note: If config state isn't updated yet, this might use old config. 
    // Ideally calculateProjection should take the startBal passed in.
    const tempConfig = { ...config, initialBalance: startBal }; 
    const currentProjection = calculateProjection(tempConfig);

    const updatedHistory = currentHistory.map(trade => {
       const startBalance = runningBalance;
       const endBalance = startBalance + trade.resultValue;
       
       const startPlanDay = findPlanDay(startBalance, currentProjection, startBal);
       const endPlanDay = findPlanDay(endBalance, currentProjection, startBal);
       
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

  // --- HANDLERS (With Supabase) ---

  const handleFinishDay = async (result: number) => {
    // 1. Optimistic Update (Optional) - skipped for simplicity, we wait for DB ID
    
    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from('trade_history')
      .insert({
        date: new Date().toISOString(),
        result_value: result,
        // We insert 0s for calc fields, they are derived in frontend mostly
        start_balance: currentBalance,
        end_balance: currentBalance + result,
        start_plan_day: 0,
        end_plan_day: 0,
        day_shift: 0
      })
      .select()
      .single();

    if (error) {
      alert("Erro ao salvar dados.");
      console.error(error);
      return;
    }

    if (data) {
      // 3. Update Local State & Recalculate
      const newEntry: TradeHistory = {
        id: data.id, // UUID from Supabase
        date: data.date,
        resultValue: data.result_value,
        startBalance: 0, // Will be calc'd
        endBalance: 0,
        startPlanDay: 0,
        endPlanDay: 0,
        dayShift: 0
      };
      recalculateHistoryChain([...history, newEntry], config.initialBalance);
    }
  };

  const handleDeleteHistory = async (id: string) => {
    // 1. Delete from Supabase
    const { error } = await supabase
      .from('trade_history')
      .delete()
      .eq('id', id);

    if (error) {
      console.error("Error deleting", error);
      return;
    }

    // 2. Update Local
    const newHistory = history.filter(item => item.id !== id);
    recalculateHistoryChain(newHistory, config.initialBalance);
  };

  const handleEditHistory = async (id: string, newResult: number) => {
    // 1. Update Supabase
    const { error } = await supabase
      .from('trade_history')
      .update({ result_value: newResult })
      .eq('id', id);

    if (error) {
      console.error("Error updating", error);
      return;
    }

    // 2. Update Local
    const newHistory = history.map(item => {
      if (item.id === id) {
        return { ...item, resultValue: newResult };
      }
      return item;
    });
    
    recalculateHistoryChain(newHistory, config.initialBalance);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-emerald-500">
        <RefreshCw className="animate-spin mr-2" /> Carregando seus dados...
      </div>
    );
  }

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
             {saving && <span className="text-xs text-slate-500 animate-pulse">Salvando...</span>}
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