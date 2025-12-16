'use client';

import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DashboardStats, InventoryItem } from '@/lib/types';

interface ChartsSectionProps {
  stats: DashboardStats;
  items: InventoryItem[];
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

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
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={locationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(props: any) => {
                  const { name, percent } = props;
                  return `${name || 'Unknown'}: ${percent !== undefined && percent !== null ? (percent * 100).toFixed(0) : 0}%`;
                }}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {locationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
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
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={belowParData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="location" />
              <YAxis />
              <Tooltip />
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

