import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { MessageSquare, Users, TrendingUp, Clock, Phone, CheckCircle, AlertCircle } from 'lucide-react';
import axios from 'axios';

const AnalyticsDashboard = () => {
  const [stats, setStats] = useState({
    totalTickets: 0,
    openTickets: 0,
    closedTickets: 0,
    totalMessages: 0,
    avgResponseTime: '0m',
    activePhones: 0,
  });

  const [chartData, setChartData] = useState({
    daily: [],
    byStatus: [],
    byPhone: [],
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
    const interval = setInterval(loadAnalytics, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, []);

  const loadAnalytics = async () => {
    try {
      // Load statistics
      const statsRes = await axios.get('http://localhost:8080/api/analytics/stats');
      setStats(statsRes.data.data);

      // Load chart data
      const chartsRes = await axios.get('http://localhost:8080/api/analytics/charts');
      setChartData(chartsRes.data.data);
      
      setLoading(false);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#4B672D', '#83a436', '#c1d67a', '#F59E0B', '#EF4444'];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">Real-time insights into your WhatsApp support operations</p>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Tickets */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-primary-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-primary-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-primary-600" />
            </div>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Tickets</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.totalTickets}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>

        {/* Open Tickets */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-orange-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-orange-100 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Open Tickets</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.openTickets}</p>
          <p className="text-xs text-gray-500 mt-2">Needs attention</p>
        </div>

        {/* Closed Tickets */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-green-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Resolved</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.closedTickets}</p>
          <p className="text-xs text-gray-500 mt-2">
            {stats.totalTickets > 0 ? Math.round((stats.closedTickets / stats.totalTickets) * 100) : 0}% success rate
          </p>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-2xl shadow-lg p-6 border-l-4 border-purple-500 hover:shadow-xl transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-purple-100 rounded-lg">
              <MessageSquare className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-gray-500 text-sm font-medium mb-1">Total Messages</h3>
          <p className="text-3xl font-bold text-gray-800">{stats.totalMessages}</p>
          <p className="text-xs text-gray-500 mt-2">Avg response: {stats.avgResponseTime}</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Daily Messages Chart */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Messages Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData.daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="messages" stroke="#4B672D" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets by Status */}
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Tickets by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={chartData.byStatus}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.byStatus.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Phone Numbers Performance */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Performance by Phone Number</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData.byPhone}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="tickets" fill="#4B672D" />
            <Bar dataKey="messages" fill="#83a436" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Active Phone Numbers */}
      <div className="mt-6 bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-3 mb-4">
          <Phone className="w-6 h-6 text-primary-600" />
          <h3 className="text-lg font-semibold text-gray-800">Active Phone Numbers</h3>
          <span className="ml-auto bg-primary-100 text-primary-600 px-3 py-1 rounded-full text-sm font-medium">
            {stats.activePhones} Active
          </span>
        </div>
        <p className="text-gray-600 text-sm">
          Manage multiple WhatsApp business numbers from a single dashboard
        </p>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;