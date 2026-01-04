'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardStats, InventoryItem } from '@/lib/types';

interface ChartsSectionProps {
  stats: DashboardStats;
  items: InventoryItem[];
}

// Extended color palette with more distinct colors
const COLORS = [
  '#0088FE', // Blue
  '#00C49F', // Teal
  '#FFBB28', // Yellow
  '#FF8042', // Orange
  '#8884d8', // Purple
  '#82ca9d', // Green
  '#FF6B9D', // Pink
  '#4ECDC4', // Cyan
  '#45B7D1', // Light Blue
  '#96CEB4', // Mint
  '#FFEAA7', // Light Yellow
  '#DDA15E', // Tan
  '#BC6C25', // Brown
  '#6C5CE7', // Indigo
  '#A29BFE', // Lavender
  '#FD79A8', // Rose
  '#FDCB6E', // Gold
  '#E17055', // Coral
  '#00B894', // Emerald
  '#00CEC9', // Turquoise
];

export default function ChartsSection({ stats, items }: ChartsSectionProps) {
  // Prepare data for pie chart (stock by location)
  const locationData = Object.entries(stats.stockByLocation).map(([location, stock]) => ({
    name: location,
    value: stock,
  }));

  // Prepare data for bar chart (items below par by location)
  const belowParByLocation: Record<string, number> = {};
  items.filter(item => item.isBelowPar).forEach(item => {
    belowParByLocation[item.location] = (belowParByLocation[item.location] || 0) + 1;
  });

  const belowParData = Object.entries(belowParByLocation).map(([location, count]) => ({
    location,
    count,
  }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Stock Distribution by Location */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Distribution by Location</h3>
        {locationData.length > 0 ? (
          <ResponsiveContainer width="100%" height={500}>
            <PieChart margin={{ top: 20, right: 20, bottom: 80, left: 20 }}>
              <Pie
                data={locationData}
                cx="50%"
                cy="40%"
                labelLine={(entry: any) => {
                  // Only show label line if the label will be shown
                  const percent = entry.percent * 100;
                  return percent >= 2; // Return boolean: true to show, false to hide
                }}
                label={(entry: any) => {
                  const percent = entry.percent * 100;
                  // Only show percentage if it's significant enough to avoid clutter
                  if (percent < 2) return ''; // Hide very small percentages
                  // Format: show 1 decimal for small percentages, whole number for larger
                  return percent < 5 ? `${percent.toFixed(1)}%` : `${percent.toFixed(0)}%`;
                }}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {locationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                formatter={(value: any, name: string, props: any) => {
                  const percent = props.payload.percent * 100;
                  return [`${value.toLocaleString()} (${percent.toFixed(1)}%)`, 'Stock'];
                }}
                labelFormatter={(label: string) => `Location: ${label}`}
              />
              <Legend 
                verticalAlign="bottom" 
                align="center"
                height={80}
                wrapperStyle={{ paddingTop: '10px' }}
                iconType="circle"
                formatter={(value: string) => {
                  // Truncate long names for legend
                  return value.length > 25 ? value.substring(0, 25) + '...' : value;
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <p className="text-gray-500 text-center py-8">No data available</p>
        )}
      </div>

      {/* Items Below Par by Location */}
      <div className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Items Below Par by Location</h3>
        {belowParData.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={belowParData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="location" 
                angle={-45}
                textAnchor="end"
                height={80}
                interval={0}
                tick={{ fontSize: 12 }}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: any) => [value, 'Items Below Par']}
                labelFormatter={(label: string) => `Location: ${label}`}
              />
              <Legend />
              <Bar dataKey="count" fill="#ef4444" name="Items Below Par" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="text-center py-8">
            <p className="text-green-600 font-medium">No items below par</p>
            <p className="text-gray-500 text-sm mt-2">All locations are well stocked</p>
          </div>
        )}
      </div>
    </div>
  );
}

