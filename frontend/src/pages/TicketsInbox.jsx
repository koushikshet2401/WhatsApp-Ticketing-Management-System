import React, { useState, useEffect } from 'react';
import { Search, RefreshCw, Send, MoreVertical, Flag, CheckCircle, Clock, X, Reply, Forward, ListTodo } from 'lucide-react';
import axios from 'axios';
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
      const response = await axios.get('http://localhost:8080/api/tickets');
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
      const response = await axios.get(`http://localhost:8080/api/messages/${ticketId}`);
      setMessages(response.data.data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      setMessages([]);
    }
  };

  const handleSendReply = async () => {
    if (!replyText.trim() || !selectedTicket) return;

    try {
      await axios.post(`http://localhost:8080/api/messages/${selectedTicket.id}/reply`, {
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
      await axios.put(`http://localhost:8080/api/tickets/${selectedTicket.id}/status`, { status });
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
      await axios.post(`http://localhost:8080/api/messages/${message.id}/flag`);
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
        <div className="flex-1 overflow-y-auto">
          {filteredTickets.map((ticket) => (
            <div
              key={ticket.id}
              onClick={() => setSelectedTicket(ticket)}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors ${
                selectedTicket?.id === ticket.id ? 'bg-primary-50 border-l-4 border-l-primary-500' : ''
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-gray-800 flex-1 truncate">
                  {ticket.group_name || ticket.title || 'Unnamed Ticket'}
                </h3>
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>
              {ticket.description && (
                <p className="text-sm text-gray-600 truncate mb-2">{ticket.description}</p>
              )}
              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>{new Date(ticket.created_at).toLocaleDateString()}</span>
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
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedTicket.group_name || selectedTicket.title || 'Conversation'}
                </h2>
                <p className="text-sm text-gray-500">{selectedTicket.group_id}</p>
              </div>
              <button
                onClick={loadTickets}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.is_from_customer ? 'justify-start' : 'justify-end'} group relative`}
                  onContextMenu={(e) => handleContextMenu(e, message)}
                >
                  <div
                    className={`max-w-2xl rounded-lg p-4 ${
                      message.is_from_customer
                        ? 'bg-gray-100 text-gray-800'
                        : 'bg-primary-600 text-white'
                    }`}
                  >
                    {message.is_from_customer && (
                      <p className="text-xs font-semibold mb-1">
                        {message.sender_name || message.sender_phone}
                      </p>
                    )}
                    <p className="whitespace-pre-wrap">{message.message_text}</p>
                    <p className={`text-xs mt-2 ${message.is_from_customer ? 'text-gray-500' : 'text-primary-100'}`}>
                      {new Date(message.created_at).toLocaleTimeString()}
                    </p>
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
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-end gap-2">
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
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows="3"
                />
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim()}
                  className="px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  <Send className="w-5 h-5" />
                  Send
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <p>Select a ticket to view conversation</p>
          </div>
        )}
      </div>

      {/* RIGHT: Ticket Details */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto">
        {selectedTicket ? (
          <div className="p-4">
            {/* Overview */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-4">Overview</h3>
              
              {/* Status */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                <select
                  value={selectedTicket.status}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="open">Open</option>
                  <option value="pending_reply">Pending Reply</option>
                  <option value="no_reply">No Reply</option>
                  <option value="closed">Closed</option>
                </select>
              </div>

              {/* Created */}
              <div className="text-sm text-gray-600 mb-2">
                <span className="font-medium">Created:</span>{' '}
                {new Date(selectedTicket.created_at).toLocaleString()}
              </div>

              {/* Last Message */}
              {selectedTicket.last_message_at && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Last Message:</span>{' '}
                  {new Date(selectedTicket.last_message_at).toLocaleString()}
                </div>
              )}
            </div>

            {/* Open Tickets */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Open Tickets</h3>
              <p className="text-sm text-gray-500">No open tickets</p>
            </div>

            {/* Flagged Messages */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-gray-800 mb-2">Flagged Messages</h3>
              <p className="text-sm text-gray-500">No flagged messages</p>
            </div>

            {/* Open Tasks */}
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-2">Open Tasks</h3>
              <p className="text-sm text-gray-500">No open tasks</p>
            </div>
          </div>
        ) : (
          <div className="p-4 text-center text-gray-500">
            <p>No ticket selected</p>
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