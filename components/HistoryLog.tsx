import React, { useState } from 'react';
import { TradeHistory } from '../types';
import { formatCurrency } from '../utils/calculations';
import { ArrowUp, ArrowDown, Minus, Trash2, Edit2, Check, X } from 'lucide-react';

interface HistoryLogProps {
  history: TradeHistory[];
  onDelete: (id: string) => void;
  onEdit: (id: string, newResult: number) => void;
}

const HistoryLog: React.FC<HistoryLogProps> = ({ history, onDelete, onEdit }) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState<string>('');

  if (history.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500 border border-dashed border-slate-700 rounded-xl">
        <p>Nenhum dia finalizado ainda.</p>
        <p className="text-sm">Opere, registre o resultado e veja seu progresso.</p>
      </div>
    );
  }

  // Reverse to show newest first
  const displayHistory = [...history].reverse();

  const startEditing = (entry: TradeHistory) => {
    setEditingId(entry.id);
    setEditValue(entry.resultValue.toString());
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue('');
  };

  const saveEditing = (id: string) => {
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      onEdit(id, val);
      setEditingId(null);
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-700">
      <table className="min-w-full divide-y divide-slate-700 bg-slate-800">
        <thead className="bg-slate-900">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Data</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Saldo Inicial</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Resultado</th>
            <th className="px-4 py-3 text-left text-xs font-medium text-slate-400 uppercase">Saldo Final</th>
            <th className="px-4 py-3 text-center text-xs font-medium text-slate-400 uppercase">Impacto</th>
            <th className="px-4 py-3 text-right text-xs font-medium text-slate-400 uppercase">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {displayHistory.map((entry) => {
            const isEditing = editingId === entry.id;

            return (
              <tr key={entry.id} className="hover:bg-slate-700/50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-400">
                  {new Date(entry.date).toLocaleDateString('pt-BR')}
                </td>
                <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-300">
                  {formatCurrency(entry.startBalance)}
                </td>
                
                {/* Editable Result Cell */}
                <td className="px-4 py-3 whitespace-nowrap text-sm font-bold">
                  {isEditing ? (
                    <input 
                      type="number"
                      step="0.01"
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="w-24 bg-slate-900 border border-slate-500 rounded px-2 py-1 text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                    />
                  ) : (
                    <span className={entry.resultValue >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                      {entry.resultValue >= 0 ? '+' : ''}{formatCurrency(entry.resultValue)}
                    </span>
                  )}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-white font-semibold">
                  {/* If editing, show projected end balance based on input, otherwise show stored */}
                  {isEditing 
                    ? formatCurrency(entry.startBalance + (parseFloat(editValue) || 0)) 
                    : formatCurrency(entry.endBalance)}
                </td>

                <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                  <div className={`inline-flex items-center gap-1 px-2 py-1 rounded font-bold text-xs
                    ${entry.dayShift > 0 ? 'bg-emerald-500/20 text-emerald-400' : 
                      entry.dayShift < 0 ? 'bg-red-500/20 text-red-400' : 'bg-slate-700 text-slate-300'}`}>
                    
                    {entry.dayShift > 0 && <ArrowUp size={12} />}
                    {entry.dayShift < 0 && <ArrowDown size={12} />}
                    {entry.dayShift === 0 && <Minus size={12} />}
                    
                    {entry.dayShift > 0 ? `+${entry.dayShift}` : 
                     entry.dayShift < 0 ? `${entry.dayShift}` : '-'}
                  </div>
                </td>

                {/* Actions Column */}
                <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                  {isEditing ? (
                    <div className="flex justify-end gap-2">
                       <button onClick={() => saveEditing(entry.id)} className="text-emerald-400 hover:text-emerald-300 p-1 hover:bg-slate-700 rounded transition">
                        <Check size={16} />
                      </button>
                      <button onClick={cancelEditing} className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-700 rounded transition">
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="flex justify-end gap-2">
                      <button 
                        onClick={() => startEditing(entry)} 
                        className="text-indigo-400 hover:text-indigo-300 p-1 hover:bg-slate-700 rounded transition"
                        title="Editar"
                      >
                        <Edit2 size={16} />
                      </button>
                      <button 
                        onClick={() => onDelete(entry.id)} 
                        className="text-slate-500 hover:text-red-400 p-1 hover:bg-slate-700 rounded transition"
                        title="Excluir"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default HistoryLog;