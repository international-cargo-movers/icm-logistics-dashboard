"use client"

import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend
} from 'recharts'

export function RevenueChart({ data }: { data: any[] }) {
  // Safe fallback if database is completely empty
  const chartData = data.length > 0 ? data : [
    { name: 'Jan', Invoiced: 0, Received: 0 }
  ];

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
  };

  return (
    <div className="h-[350px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="name" 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            dy={10} 
          />
          <YAxis 
            stroke="#64748b" 
            fontSize={12} 
            tickLine={false} 
            axisLine={false} 
            tickFormatter={(value) => `₹${(value / 100000).toFixed(1)}L`} // Formats Y-axis to Lakhs for cleanliness
          />
          <Tooltip 
            cursor={{ fill: '#f1f5f9' }}
            contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            formatter={(value: number) => [formatCurrency(value), ""]}
          />
          <Legend wrapperStyle={{ paddingTop: '20px' }} />
          
          {/* Two Bars for comparison */}
          <Bar dataKey="Invoiced" fill="#94a3b8" radius={[4, 4, 0, 0]} name="Billed Amount" />
          <Bar dataKey="Received" fill="#10b981" radius={[4, 4, 0, 0]} name="Payment Received" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

// A palette of clean colors for the pie slices
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ef4444', '#64748b'];

export function JobModeChart({ data }: { data: any[] }) {
  const chartData = data.length > 0 ? data : [
    { name: 'No Data', value: 1 }
  ];

  return (
    <div className="h-[300px] w-full mt-4">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={70}
            outerRadius={100}
            paddingAngle={5}
            dataKey="value"
            stroke="none"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
            ))}
          </Pie>
          <Tooltip 
             contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          />
          <Legend verticalAlign="bottom" height={36} iconType="circle" />
        </PieChart>
      </ResponsiveContainer>
    </div>
  )
}