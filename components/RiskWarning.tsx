import React from 'react';
import { RiskAnalysis } from '../types';
import { formatCurrency } from '../utils/calculations';
import { AlertTriangle, ShieldCheck } from 'lucide-react';

interface RiskWarningProps {
  analysis: RiskAnalysis;
  currentBalance: number;
}

const RiskWarning: React.FC<RiskWarningProps> = ({ analysis, currentBalance }) => {
  if (analysis.isHighRisk) {
    return (
      <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 flex items-start gap-3">
        <AlertTriangle className="text-red-500 shrink-0 mt-1" size={24} />
        <div>
          <h4 className="font-bold text-red-400">Risco Elevado Detectado!</h4>
          <p className="text-sm text-red-200 mt-1">
            Seu Stop Loss ({formatCurrency(analysis.recommendedStopLoss / 0.03 * (analysis.riskPercentage/100))}) representa 
            <span className="font-bold"> {analysis.riskPercentage.toFixed(1)}%</span> da sua banca inicial.
          </p>
          <p className="text-sm text-slate-300 mt-2">
            Recomendação: Ajuste o Loss para no máximo <span className="text-emerald-400 font-bold">{formatCurrency(analysis.recommendedStopLoss)}</span> (3%).
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
      <ShieldCheck className="text-emerald-500 shrink-0" size={24} />
      <div>
        <h4 className="font-bold text-emerald-400">Gestão de Risco Saudável</h4>
        <p className="text-sm text-emerald-200/70">
          Seu risco por operação está dentro dos limites aceitáveis ({analysis.riskPercentage.toFixed(2)}%).
        </p>
      </div>
    </div>
  );
};

export default RiskWarning;