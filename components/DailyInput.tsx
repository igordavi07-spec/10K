import React, { useState } from 'react';
import { Save, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../utils/calculations';

interface DailyInputProps {
  currentBalance: number;
  dailyGoal: number;
  onFinishDay: (result: number) => void;
}

const DailyInput: React.FC<DailyInputProps> = ({ currentBalance, dailyGoal, onFinishDay }) => {
  const [result, setResult] = useState<string>('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(result);
    if (!isNaN(val)) {
      onFinishDay(val);
      setResult('');
    }
  };

  const projectedBalance = currentBalance + parseFloat(result || '0');
  const isLoss = parseFloat(result || '0') < 0;

  return (
    <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <Save size={20} className="text-emerald-500" />
          Finalizar Dia
        </h3>
        <span className="text-xs text-slate-400 bg-slate-900 px-2 py-1 rounded">
          Meta hoje: <span className="text-emerald-400 font-bold">{formatCurrency(dailyGoal)}</span>
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1">
            Resultado do Dia (R$)
          </label>
          <div className="relative">
            <input
              type="number"
              step="0.01"
              value={result}
              onChange={(e) => setResult(e.target.value)}
              placeholder="Ex: 15.50 ou -10.00"
              className={`w-full bg-slate-900 border rounded-lg p-3 text-lg font-bold outline-none transition focus:ring-2 ${
                isLoss 
                  ? 'border-red-500/50 text-red-400 focus:ring-red-500' 
                  : 'border-slate-600 text-white focus:ring-emerald-500'
              }`}
            />
            <span className="absolute right-4 top-3.5 text-slate-500 text-sm">BRL</span>
          </div>
        </div>

        {result && (
          <div className="p-3 bg-slate-900/50 rounded border border-slate-700 flex justify-between items-center text-sm">
            <span className="text-slate-400">Novo Saldo Estimado:</span>
            <span className={`font-bold ${isLoss ? 'text-amber-400' : 'text-emerald-400'}`}>
              {formatCurrency(projectedBalance)}
            </span>
          </div>
        )}

        <button
          type="submit"
          disabled={!result}
          className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-3 rounded-lg transition-all flex items-center justify-center gap-2"
        >
          Confirmar e Atualizar Plano
        </button>
      </form>

      <div className="mt-4 flex items-start gap-2 text-xs text-slate-500">
        <AlertCircle size={14} className="mt-0.5 shrink-0" />
        <p>Ao finalizar, o sistema recalculará seu "Dia de Plano" atual baseando-se no novo saldo (Juros Compostos).</p>
      </div>
    </div>
  );
};

export default DailyInput;