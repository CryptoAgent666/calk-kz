import React from 'react';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';

// Цветовая палитра
const COLORS = [
  '#0ea5e9', // sky-500
  '#f97316', // orange-500
  '#22c55e', // green-500
  '#eab308', // yellow-500
  '#ef4444', // red-500
  '#8b5cf6', // violet-500
  '#ec4899', // pink-500
  '#06b6d4', // cyan-500
];

export interface PieChartDataItem {
  name: string;
  value: number;
  color?: string;
}

export interface PieChartProps {
  data: PieChartDataItem[];
  title?: string;
  showLegend?: boolean;
  height?: number;
  formatValue?: (value: number) => string;
}

export function TaxPieChart({
  data,
  title,
  showLegend = true,
  height = 300,
  formatValue = (v) => v.toLocaleString('ru-KZ') + ' ₸'
}: PieChartProps) {
  const total = data.reduce((sum, item) => sum + item.value, 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const percentage = ((item.value / total) * 100).toFixed(1);
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-medium text-gray-900">{item.name}</p>
          <p className="text-gray-600">{formatValue(item.value)}</p>
          <p className="text-sm text-gray-500">{percentage}%</p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {title && (
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            dataKey="value"
            label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
            labelLine={false}
          >
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.color || COLORS[index % COLORS.length]}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>

      {showLegend && (
        <div className="flex flex-wrap justify-center gap-3 mt-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || COLORS[index % COLORS.length] }}
              />
              <span className="text-sm text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export interface BarChartDataItem {
  name: string;
  [key: string]: string | number;
}

export interface BarChartProps {
  data: BarChartDataItem[];
  dataKeys: { key: string; name: string; color?: string }[];
  title?: string;
  height?: number;
  formatValue?: (value: number) => string;
}

export function ComparisonBarChart({
  data,
  dataKeys,
  title,
  height = 300,
  formatValue = (v) => v.toLocaleString('ru-KZ')
}: BarChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}: {formatValue(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {title && (
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={formatValue} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {dataKeys.map((dk, index) => (
            <Bar
              key={dk.key}
              dataKey={dk.key}
              name={dk.name}
              fill={dk.color || COLORS[index % COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export interface LineChartDataItem {
  name: string;
  [key: string]: string | number;
}

export interface LineChartProps {
  data: LineChartDataItem[];
  dataKeys: { key: string; name: string; color?: string }[];
  title?: string;
  height?: number;
  formatValue?: (value: number) => string;
  showArea?: boolean;
}

export function TrendLineChart({
  data,
  dataKeys,
  title,
  height = 300,
  formatValue = (v) => v.toLocaleString('ru-KZ'),
  showArea = false
}: LineChartProps) {
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 shadow-lg rounded-lg border border-gray-200">
          <p className="font-medium text-gray-900 mb-2">{label}</p>
          {payload.map((item: any, index: number) => (
            <p key={index} style={{ color: item.color }} className="text-sm">
              {item.name}: {formatValue(item.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const ChartComponent = showArea ? AreaChart : LineChart;

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      {title && (
        <h4 className="text-lg font-semibold text-gray-800 mb-4 text-center">{title}</h4>
      )}
      <ResponsiveContainer width="100%" height={height}>
        <ChartComponent data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="name" tick={{ fill: '#6b7280', fontSize: 12 }} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 12 }} tickFormatter={formatValue} />
          <Tooltip content={<CustomTooltip />} />
          <Legend />
          {dataKeys.map((dk, index) => (
            showArea ? (
              <Area
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color || COLORS[index % COLORS.length]}
                fill={dk.color || COLORS[index % COLORS.length]}
                fillOpacity={0.2}
                strokeWidth={2}
              />
            ) : (
              <Line
                key={dk.key}
                type="monotone"
                dataKey={dk.key}
                name={dk.name}
                stroke={dk.color || COLORS[index % COLORS.length]}
                strokeWidth={2}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            )
          ))}
        </ChartComponent>
      </ResponsiveContainer>
    </div>
  );
}

export { COLORS };
