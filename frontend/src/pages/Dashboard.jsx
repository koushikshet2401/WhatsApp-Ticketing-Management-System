import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  MessageSquare, 
  Users, 
  Send, 
  Clock, 
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Phone,
  FileText,
  BarChart3,
  RefreshCw
} from 'lucide-react';
import axios from 'axios';

const Dashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    totalChats: 0,
    unreadChats: 0,
    openTickets: 0,
    closedTickets: 0,
    totalMessages: 0,
    activePhones: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/analytics/stats');
      const data = response.data.data;
      
      setStats({
        totalChats: data.totalTickets || 0,
        unreadChats: data.openTickets || 0,
        openTickets: data.openTickets || 0,
        closedTickets: data.closedTickets || 0,
        totalMessages: data.totalMessages || 0,
        activePhones: 1
      });
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      // Set default values on error
      setStats({
        totalChats: 0,
        unreadChats: 0,
        openTickets: 0,
        closedTickets: 0,
        totalMessages: 0,
        activePhones: 1
      });
      setLoading(false);
    }
  };

  const quickLinks = [
    {
      title: 'View All Chats',
      description: 'See all customer conversations',
      icon: MessageSquare,
      color: 'bg-blue-500',
      hoverColor: 'hover:bg-blue-600',
      onClick: () => navigate('/inbox')
    },
    {
      title: 'Send Bulk Message',
      description: 'Message multiple customers at once',
      icon: Send,
      color: 'bg-green-500',
      hoverColor: 'hover:bg-green-600',
      onClick: () => navigate('/bulk-messaging')
    },
    {
      title: 'View Analytics',
      description: 'Charts, reports and insights',
      icon: BarChart3,
      color: 'bg-purple-500',
      hoverColor: 'hover:bg-purple-600',
      onClick: () => navigate('/analytics')
    },
    {
      title: 'Message Templates',
      description: 'Quick reply templates',
      icon: FileText,
      color: 'bg-orange-500',
      hoverColor: 'hover:bg-orange-600',
      onClick: () => navigate('/templates')
    },
    {
      title: 'Manage Contacts',
      description: 'Customer database & CRM',
      icon: Users,
      color: 'bg-pink-500',
      hoverColor: 'hover:bg-pink-600',
      onClick: () => navigate('/contacts')
    },
    {
      title: 'Phone Numbers',
      description: 'Manage WhatsApp accounts',
      icon: Phone,
      color: 'bg-indigo-500',
      hoverColor: 'hover:bg-indigo-600',
      onClick: () => navigate('/phone-numbers')
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">Dashboard</h1>
          <p className="text-gray-600">Overview of your WhatsApp support system</p>
        </div>
        <button
          onClick={loadStats}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Chats */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Chats</p>
          <p className="text-4xl font-bold text-gray-800">{stats.totalChats}</p>
          <p className="text-xs text-gray-500 mt-2">All conversations</p>
        </div>

        {/* Unread Chats */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-yellow-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Unread Chats</p>
          <p className="text-4xl font-bold text-gray-800">{stats.unreadChats}</p>
          <p className="text-xs text-gray-500 mt-2">Needs attention</p>
        </div>

        {/* Open Tickets */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-orange-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Open Tickets</p>
          <p className="text-4xl font-bold text-gray-800">{stats.openTickets}</p>
          <p className="text-xs text-gray-500 mt-2">In progress</p>
        </div>

        {/* Total Messages */}
        <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-500 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <p className="text-gray-600 text-sm font-medium mb-1">Total Messages</p>
          <p className="text-4xl font-bold text-gray-800">{stats.totalMessages}</p>
          <p className="text-xs text-gray-500 mt-2">All time</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quickLinks.map((link, index) => {
            const Icon = link.icon;
            return (
              <button
                key={index}
                onClick={link.onClick}
                className="bg-white rounded-xl shadow-md p-6 hover:shadow-xl transition-all text-left group transform hover:-translate-y-1"
              >
                <div className={`w-14 h-14 ${link.color} rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">{link.title}</h3>
                <p className="text-gray-600 text-sm">{link.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* System Status */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">System Status</h2>
          <span className="flex items-center gap-2 text-green-600 font-semibold">
            <div className="w-3 h-3 bg-green-600 rounded-full animate-pulse"></div>
            All Systems Online
          </span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl">
            <Phone className="w-10 h-10 text-blue-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-800">{stats.activePhones}</p>
            <p className="text-sm text-gray-600 font-medium mt-1">Active Phone Numbers</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <Users className="w-10 h-10 text-green-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-800">1</p>
            <p className="text-sm text-gray-600 font-medium mt-1">Team Members Online</p>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl">
            <TrendingUp className="w-10 h-10 text-purple-600 mx-auto mb-3" />
            <p className="text-3xl font-bold text-gray-800">
              {stats.totalChats > 0 ? Math.round((stats.closedTickets / stats.totalChats) * 100) : 0}%
            </p>
            <p className="text-sm text-gray-600 font-medium mt-1">Resolution Rate</p>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <p className="text-gray-500 text-sm">
          Last updated: {new Date().toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;