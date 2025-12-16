import React, { useEffect, useRef } from 'react';
import { DailyProjection } from '../types';
import { formatCurrency } from '../utils/calculations';

interface GrowthTableProps {
  data: DailyProjection[];
  winAmount: number;
  currentPlanDay: number;
}

const GrowthTable: React.FC<GrowthTableProps> = ({ data, winAmount, currentPlanDay }) => {
  const activeRowRef = useRef<HTMLTableRowElement>(null);

  // Auto-scroll to current day on load or update
  useEffect(() => {
    if (activeRowRef.current) {
      activeRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentPlanDay]);

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700 max-h-[500px]">
      <table className="min-w-full divide-y divide-slate-700 bg-slate-800">
        <thead className="bg-slate-900 sticky top-0 z-10">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Dia
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Banca Inicial
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-emerald-400 uppercase tracking-wider">
              Meta ($)
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-400 uppercase tracking-wider">
              Wins Estimados
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
              Banca Final
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {data.map((row) => {
            const isActive = row.day === currentPlanDay;
            return (
              <tr 
                key={row.day} 
                ref={isActive ? activeRowRef : null}
                className={`transition-colors ${isActive ? 'bg-indigo-900/40 border-l-4 border-indigo-500' : 'hover:bg-slate-700/50'}`}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-300">
                  <span className={isActive ? 'text-indigo-400 font-bold' : ''}>Dia {row.day}</span>
                  {isActive && <span className="ml-2 text-[10px] bg-indigo-500 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">Você está aqui</span>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                  {formatCurrency(row.startBalance)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-400 font-bold">
                  + {formatCurrency(row.dailyTargetValue)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-300">
                  {row.tradesNeeded.toFixed(1)} <span className="text-xs text-slate-500">x R$ {winAmount}</span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-white font-semibold">
                  {formatCurrency(row.endBalance)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default GrowthTable;