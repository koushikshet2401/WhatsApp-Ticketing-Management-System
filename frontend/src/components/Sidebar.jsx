import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, MessageSquare, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Sidebar = ({ onTicketSelect, selectedTicketId }) => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  // Load tickets on component mount and when filter changes
  useEffect(() => {
    loadTickets();
    // Auto-refresh every 10 seconds
    const interval = setInterval(loadTickets, 10000);
    return () => clearInterval(interval);
  }, [filter]);

  // Load tickets from API
  const loadTickets = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/tickets?filter=${filter}`);
      
      console.log('API Response:', response.data); // Debug log
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setTickets(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} tickets`);
      } else {
        setTickets([]);
        console.log('⚠️ No tickets in response');
      }
    } catch (error) {
      console.error('❌ Error loading tickets:', error);
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  // Filter tickets by search term
  const filteredTickets = tickets.filter(ticket => 
    ticket.group_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.group_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Format time ago
  const timeAgo = (date) => {
    if (!date) return '';
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  // Get status badge color
  const getStatusBadge = (status) => {
    const badges = {
      'open': { color: 'bg-primary-100 text-primary-600', label: 'Open' },
      'pending_reply': { color: 'bg-yellow-100 text-yellow-600', label: 'Pending' },
      'no_reply': { color: 'bg-red-100 text-red-600', label: 'No Reply' },
      'closed': { color: 'bg-gray-100 text-gray-600', label: 'Closed' }
    };
    return badges[status] || badges['open'];
  };

  return (
    <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">TICKETS</h2>
          <button
            onClick={loadTickets}
            disabled={loading}
            className="p-2 hover:bg-gray-100 rounded-lg transition"
          >
            <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search tickets..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 px-4 py-3 border-b border-gray-200">
        <button
          onClick={() => setFilter('all')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          All
        </button>
        <button
          onClick={() => setFilter('no_reply')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'no_reply'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Clock className="w-4 h-4" />
          No Reply
        </button>
        <button
          onClick={() => setFilter('pending_tasks')}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition ${
            filter === 'pending_tasks'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <CheckCircle className="w-4 h-4" />
          Pending Tasks
        </button>
      </div>

      {/* Tickets List */}
      <div className="flex-1 overflow-y-auto">
        {loading && filteredTickets.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <RefreshCw className="w-8 h-8 text-primary-500 animate-spin" />
          </div>
        ) : filteredTickets.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageSquare className="w-16 h-16 mb-4" />
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-sm">Tickets will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 p-4">
            {filteredTickets.map((ticket) => {
              const badge = getStatusBadge(ticket.status);
              const isSelected = ticket.id === selectedTicketId;

              return (
                <div
                  key={ticket.id}
                  onClick={() => onTicketSelect(ticket)}
                  className={`p-4 rounded-lg cursor-pointer transition ${
                    isSelected
                      ? 'bg-primary-50 border-2 border-primary-500'
                      : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-800 truncate flex-1">
                      {ticket.group_name || 'Unnamed Ticket'}
                    </h3>
                    <span className={`text-xs px-2 py-1 rounded-full ${badge.color}`}>
                      {badge.label}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-2">
                    Ticket #{ticket.id}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>{timeAgo(ticket.updated_at || ticket.created_at)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-4 border-t border-gray-200 bg-gray-50">
        <div className="text-sm text-gray-600">
          <span className="font-medium">{filteredTickets.length}</span> ticket(s) found
        </div>
      </div>
    </div>
  );
};

export default Sidebar;