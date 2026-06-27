import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Send, MoreVertical, Flag, CheckCircle, Clock, X, Reply, Forward, ListTodo, MessageSquare } from 'lucide-react';
import api from '../services/api';
import CreateTicketModal from '../components/CreateTicketModal';

const TicketsInbox = () => {
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [showActionMenu, setShowActionMenu] = useState(null);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [contextMenuPosition, setContextMenuPosition] = useState(null);

  useEffect(() => {
    loadTickets();
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      loadMessages(selectedTicket.id);
    }
  }, [selectedTicket]);

  const loadTickets = async () => {
    try {
      const response = await api.get(`/tickets`);
      setTickets(response.data.data || []);
      if (response.data.data && response.data.data.length > 0) {
        setSelectedTicket(response.data.data[0]);
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading tickets:', error);
      setLoading(false);
    }
  };

  const loadMessages = async (ticketId) => {
    try {
      const response = await api.get(`/messages/${ticketId}`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    try {
      await api.post(`/messages/${selectedTicket.id}/reply`, {
        messageText: replyText
      });
      setReplyText('');
      loadMessages(selectedTicket.id);
    } catch (error) {
      console.error('Error sending reply:', error);
      alert('Failed to send message');
    }
  };

  const handleStatusChange = async (status) => {
    if (!selectedTicket) return;

    try {
      await api.put(`/tickets/${selectedTicket.id}/status`, { status });
      loadTickets();
      setSelectedTicket({ ...selectedTicket, status });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleContextMenu = (e, message) => {
    e.preventDefault();
    setSelectedMessage(message);
    setContextMenuPosition({ x: e.clientX, y: e.clientY });
    setShowActionMenu(message.id);
  };

  const handleCreateTicket = (message) => {
    setSelectedMessage(message);
    setShowCreateTicket(true);
    setShowActionMenu(null);
    setContextMenuPosition(null);
  };

  const handleFlagMessage = async (message) => {
    try {
      await api.post(`/messages/${message.id}/flag`);
      alert('Message flagged successfully!');
      setShowActionMenu(null);
      setContextMenuPosition(null);
    } catch (error) {
      console.error('Error flagging message:', error);
      alert('Failed to flag message');
    }
  };

  const handleTicketCreated = () => {
    loadTickets();
    setShowCreateTicket(false);
    setSelectedMessage(null);
  };

  const getStatusColor = (status) => {
    const colors = {
      open: 'bg-primary-100 text-primary-700',
      pending_reply: 'bg-yellow-100 text-yellow-700',
      no_reply: 'bg-orange-100 text-orange-700',
      closed: 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-700';
  };

  const getStatusIcon = (status) => {
    const icons = {
      open: Clock,
      pending_reply: Clock,
      closed: CheckCircle
    };
    const Icon = icons[status] || Clock;
    return <Icon className="w-4 h-4" />;
  };

  const filteredTickets = tickets.filter(ticket =>
    ticket.group_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ticket.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-gray-50">
      {/* LEFT: Ticket List */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Search */}
        <div className="p-4 border-b border-gray-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tickets..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        {/* Ticket List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-2">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-4 rounded-xl ticket-item group transition-all ${
                selectedTicket?.id === ticket.id 
                  ? 'ticket-item-active' 
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
            >
              <div className="flex items-start justify-between mb-1">
                <h3 className={`font-semibold truncate flex-1 ${
                  selectedTicket?.id === ticket.id ? 'text-primary-800' : 'text-gray-800'
                }`}>
                  {ticket.group_name || ticket.title || 'Unnamed Ticket'}
                </h3>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${getStatusColor(ticket.status)}`}>
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
              {ticket.description && (
                <p className="text-sm text-gray-500 line-clamp-1 mb-2 group-hover:text-gray-600 transition-colors">
                  {ticket.description}
                </p>
              )}
              <div className="flex items-center justify-between text-[11px] text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
                </div>
                {selectedTicket?.id === ticket.id && (
                  <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-pulse" />
                )}
              </div>
            </div>
          ))}

          {filteredTickets.length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <p>No tickets found</p>
            </div>
          )}
        </div>
      </div>

      {/* MIDDLE: Conversation */}
      <div className="flex-1 flex flex-col bg-white">
        {selectedTicket ? (
          <>
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white/80 backdrop-blur-sm sticky top-0 z-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary-100 rounded-2xl flex items-center justify-center text-primary-600 font-bold text-xl shadow-inner">
                  {(selectedTicket.group_name || selectedTicket.title || 'C')[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    {selectedTicket.group_name || selectedTicket.title || 'Conversation'}
                  </h2>
                  <p className="text-xs text-gray-400 font-medium flex items-center gap-1">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    {selectedTicket.group_id}
                  </p>
                </div>
              </div>
              <button
                onClick={loadTickets}
                className="p-2.5 hover:bg-gray-100 rounded-xl transition-all active:scale-95 group"
                title="Refresh Tickets"
              >
                <RefreshCw className="w-5 h-5 text-gray-400 group-hover:text-primary-600 transition-colors" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6 bg-gray-50/30">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_customer ? 'justify-start' : 'justify-end'} group relative message-bubble`}
                  onContextMenu={(e) => handleContextMenu(e, message)}
                >
                  <div
                    className={`max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm border ${
                      message.is_from_customer
                        ? 'bg-white text-gray-800 border-gray-100 rounded-tl-none'
                        : 'bg-primary-600 text-white border-primary-500 rounded-tr-none'
                    }`}
                  >
                    {message.is_from_customer && (
                      <p className="text-[11px] font-bold text-primary-600 uppercase tracking-wider mb-1.5">
                        {message.sender_name || message.sender_phone}
                      </p>
                    )}
                    <p className="text-[14px] leading-relaxed whitespace-pre-wrap">{message.message_text}</p>
                    <div className={`flex items-center justify-end gap-1.5 mt-2 ${
                      message.is_from_customer ? 'text-gray-400' : 'text-primary-100'
                    }`}>
                      <span className="text-[10px] font-medium">
                        {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {!message.is_from_customer && <CheckCircle className="w-3 h-3" />}
                    </div>
                  </div>

                  {/* Message Actions Menu Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      handleContextMenu(e, message);
                    }}
                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <MoreVertical className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Context Menu */}
                  {showActionMenu === message.id && contextMenuPosition && (
                    <div 
                      className="fixed bg-white border border-gray-200 rounded-lg shadow-xl z-50 min-w-[200px] py-2"
                      style={{
                        left: `${contextMenuPosition.x}px`,
                        top: `${contextMenuPosition.y}px`
                      }}
                    >
                      <button 
                        onClick={() => {
                          setReplyText(`@${message.sender_name || message.sender_phone}: `);
                          setShowActionMenu(null);
                          setContextMenuPosition(null);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <Reply className="w-4 h-4" />
                        Reply
                      </button>
                      <button 
                        onClick={() => {
                          navigator.clipboard.writeText(message.message_text);
                          setShowActionMenu(null);
                          setContextMenuPosition(null);
                          alert('Message copied to clipboard');
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <Forward className="w-4 h-4" />
                        Forward
                      </button>
                      <button 
                        onClick={() => handleCreateTicket(message)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Create Ticket
                      </button>
                      <button 
                        onClick={() => handleFlagMessage(message)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 flex items-center gap-2 text-sm"
                      >
                        <Flag className="w-4 h-4" />
                        Flag Message
                      </button>
                    </div>
                  )}
                </div>
              ))}

              {messages.length === 0 && (
                <div className="text-center text-gray-500 py-12">
                  <p>No messages yet</p>
                </div>
              )}
            </div>

            {/* Reply Box */}
            <div className="p-4 bg-white border-t border-gray-100">
              <div className="max-w-4xl mx-auto flex items-end gap-3">
                <div className="flex-1 relative group">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendReply();
                      }
                    }}
                    placeholder="Type your message..."
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-400 focus:bg-white resize-none transition-all custom-scrollbar min-h-[56px] max-h-32"
                    rows="1"
                  />
                </div>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="p-4 bg-primary-600 text-white rounded-2xl hover:bg-primary-700 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 flex items-center justify-center flex-shrink-0"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
              <p className="text-[10px] text-center text-gray-400 mt-2 font-medium">
                Press Enter to send, Shift + Enter for new line
              </p>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/50">
            <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-4">
              <MessageSquare className="w-10 h-10 text-gray-200" />
            </div>
            <p className="font-medium">Select a ticket to view conversation</p>
          </div>
        )}
      </div>

      {/* RIGHT: Ticket Details */}
      <div className="w-80 bg-white border-l border-gray-100 overflow-y-auto custom-scrollbar">
        {selectedTicket ? (
          <div className="p-6 space-y-8">
            {/* Overview */}
            <section>
              <h3 className="section-header">
                <ListTodo className="w-4 h-4" />
                Overview
              </h3>
              
              <div className="space-y-4 premium-card p-4">
                {/* Status */}
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase tracking-tight mb-2">Current Status</label>
                  <select
                    value={selectedTicket.status}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-400 text-sm font-medium transition-all"
                  >
                    <option value="open">Open</option>
                    <option value="pending_reply">Pending Reply</option>
                    <option value="no_reply">No Reply</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div className="pt-2 space-y-3">
                  {/* Created */}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-400 font-medium italic">Created</span>
                    <span className="text-gray-700 font-bold">{new Date(selectedTicket.created_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                  </div>

                  {/* Last Message */}
                  {selectedTicket.last_message_at && (
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-gray-400 font-medium italic">Last Activity</span>
                      <span className="text-gray-700 font-bold">{new Date(selectedTicket.last_message_at).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  )}
                </div>
              </div>
            </section>

            {/* Open Tickets */}
            <section>
              <h3 className="section-header">
                <Clock className="w-4 h-4" />
                Linked Tickets
              </h3>
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-medium">No linked tickets found</p>
              </div>
            </section>

            {/* Flagged Messages */}
            <section>
              <h3 className="section-header">
                <Flag className="w-4 h-4" />
                Flagged Content
              </h3>
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-medium">No flagged messages</p>
              </div>
            </section>

            {/* Open Tasks */}
            <section>
              <h3 className="section-header">
                <CheckCircle className="w-4 h-4" />
                Action Items
              </h3>
              <div className="p-8 text-center bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400 font-medium">No pending tasks</p>
              </div>
            </section>
          </div>
        ) : (
          <div className="p-12 text-center text-gray-400">
            <p className="text-sm font-medium">Select a ticket to see details</p>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreateTicket && selectedMessage && (
        <CreateTicketModal
          message={selectedMessage}
          onClose={() => {
            setShowCreateTicket(false);
            setSelectedMessage(null);
          }}
          onSuccess={handleTicketCreated}
        />
      )}
    </div>
  );
};

export default TicketsInbox;