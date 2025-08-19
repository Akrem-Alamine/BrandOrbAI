'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Target, BarChart3, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, CartesianGrid, XAxis, YAxis, LineChart, Line } from "recharts";

interface FinancialData {
  startup_costs?: number;
  revenue_projections?: number[];
}

interface FinancialBreakdownProps {
  financialData: FinancialData | null;
  currencySymbol: string;
  revenueStreamsData: () => Array<{
    name: string;
    value: number;
    fill: string;
  }>;
}

export default function FinancialBreakdown({ 
  financialData, 
  currencySymbol, 
  revenueStreamsData 
}: FinancialBreakdownProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cost Breakdown Pie Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Cost Breakdown
            </CardTitle>
            <CardDescription>
              Startup costs distribution
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={[
                    { name: 'Development', value: (financialData?.startup_costs || 300) * 0.4, fill: '#0088FE' },
                    { name: 'Marketing', value: (financialData?.startup_costs || 300) * 0.3, fill: '#00C49F' },
                    { name: 'Operations', value: (financialData?.startup_costs || 300) * 0.2, fill: '#FFBB28' },
                    { name: 'Legal & Licensing', value: (financialData?.startup_costs || 300) * 0.1, fill: '#FF8042' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: { name: any, percent: any }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[0, 1, 2, 3].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={['#0088FE', '#00C49F', '#FFBB28', '#FF8042'][index]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: any) => [`${currencySymbol}${value?.toLocaleString()}`, 'Amount']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Revenue Streams */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Revenue Streams
            </CardTitle>
            <CardDescription>
              Expected revenue sources
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart
                data={revenueStreamsData()}
                layout="horizontal"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="name" type="category" />
                <Tooltip formatter={(value: any) => [`${currencySymbol}${value?.toLocaleString()}`, 'Revenue']} />
                <Bar dataKey="value" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>

      {/* Break-even Analysis Line Chart */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.5 }}
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Break-even Analysis
            </CardTitle>
            <CardDescription>
              Path to profitability
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart
                data={Array.from({length: 12}, (_, i) => ({
                  month: i + 1,
                  cumulative: (financialData?.revenue_projections?.[Math.min(i, (financialData?.revenue_projections?.length || 1) - 1)] || 30) * (i + 1) - (financialData?.startup_costs || 300),
                  target: 0
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${currencySymbol}${value?.toLocaleString()}`, 
                    name === 'cumulative' ? 'Cumulative Profit' : 'Break-even Target'
                  ]} 
                />
                <Line type="monotone" dataKey="cumulative" stroke="#8884d8" strokeWidth={2} />
                <Line type="monotone" dataKey="target" stroke="#ff0000" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
