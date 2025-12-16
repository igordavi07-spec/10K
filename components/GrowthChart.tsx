import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { DailyProjection } from '../types';
import { formatCurrency } from '../utils/calculations';

interface GrowthChartProps {
  data: DailyProjection[];
}

const GrowthChart: React.FC<GrowthChartProps> = ({ data }) => {
  // Downsample data if too large for performance
  const displayData = data.length > 100 
    ? data.filter((_, index) => index % Math.ceil(data.length / 100) === 0) 
    : data;

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={displayData}
          margin={{
            top: 10,
            right: 30,
            left: 0,
            bottom: 0,
          }}
        >
          <defs>
            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
          <XAxis 
            dataKey="day" 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
            tickFormatter={(value) => `Dia ${value}`}
          />
          <YAxis 
            stroke="#94a3b8" 
            tick={{fontSize: 12}}
            tickFormatter={(value) => `R$${value}`}
            width={80}
          />
          <Tooltip 
            contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f8fafc' }}
            itemStyle={{ color: '#10b981' }}
            formatter={(value: number) => [formatCurrency(value), 'Banca']}
            labelFormatter={(label) => `Dia ${label}`}
          />
          <Area
            type="monotone"
            dataKey="endBalance"
            stroke="#10b981"
            fillOpacity={1}
            fill="url(#colorBalance)"
            name="Banca"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default GrowthChart;