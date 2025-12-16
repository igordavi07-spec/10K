import React from 'react';
import { PlanConfig } from '../types';
import { Settings, Calculator, Target, TrendingUp, AlertOctagon } from 'lucide-react';

interface ConfigPanelProps {
  config: PlanConfig;
  onChange: (newConfig: PlanConfig) => void;
}

const ConfigPanel: React.FC<ConfigPanelProps> = ({ config, onChange }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onChange({
      ...config,
      [name]: parseFloat(value) || 0,
    });
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-fit">
      <div className="flex items-center gap-2 mb-6 text-emerald-400">
        <Settings size={24} />
        <h2 className="text-xl font-bold">Configurações</h2>
      </div>

      <div className="space-y-5">
        {/* Banca Inicial */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
            <Calculator size={16} /> Banca Inicial (R$)
          </label>
          <input
            type="number"
            name="initialBalance"
            value={config.initialBalance}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        {/* Meta Final */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
            <Target size={16} /> Meta Final (R$)
          </label>
          <input
            type="number"
            name="targetBalance"
            value={config.targetBalance}
            onChange={handleChange}
            className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
          />
        </div>

        {/* Meta Diária % */}
        <div>
          <label className="block text-sm font-medium text-slate-400 mb-1 flex items-center gap-2">
            <TrendingUp size={16} /> Meta Diária (%)
          </label>
          <div className="relative">
            <input
              type="number"
              name="dailyPercentage"
              value={config.dailyPercentage}
              onChange={handleChange}
              step="0.1"
              className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-white focus:ring-2 focus:ring-emerald-500 outline-none transition"
            />
            <span className="absolute right-3 top-2.5 text-slate-500">%</span>
          </div>
        </div>

        <div className="border-t border-slate-700 my-4"></div>

        <h3 className="text-sm font-semibold text-emerald-500 mb-3 uppercase tracking-wider">Operacional</h3>

        <div className="grid grid-cols-2 gap-3">
          {/* Win Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Win (R$)
            </label>
            <input
              type="number"
              name="winAmount"
              value={config.winAmount}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-green-900/50 rounded-lg p-2 text-green-400 focus:ring-2 focus:ring-green-500 outline-none"
            />
          </div>

          {/* Loss Amount */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Max Loss (R$)
            </label>
            <input
              type="number"
              name="lossAmount"
              value={config.lossAmount}
              onChange={handleChange}
              className="w-full bg-slate-900 border border-red-900/50 rounded-lg p-2 text-red-400 focus:ring-2 focus:ring-red-500 outline-none"
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="bg-slate-900/50 p-3 rounded border border-slate-700 mt-4">
          <p className="text-xs text-slate-400 leading-relaxed">
            <AlertOctagon size={12} className="inline mr-1 text-amber-500"/>
            Ajuste a % diária para ver como os juros compostos aceleram o crescimento. Mantenha o Loss controlado.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfigPanel;