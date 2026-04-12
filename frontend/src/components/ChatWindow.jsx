import React, { useState, useEffect, useRef } from 'react';
import { Send, AlertCircle, Loader2, User, RefreshCw } from 'lucide-react';
import MessageBubble from './MessageBubble';
import axios from 'axios';

const ChatWindow = ({ ticket, onMessageSent }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  
  // Staff assignment
  const [staff, setStaff] = useState([]);
  const [assignedStaff, setAssignedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-refresh messages every 5 seconds
  useEffect(() => {
    if (ticket) {
      loadMessages();
      const interval = setInterval(loadMessages, 5000);
      return () => clearInterval(interval);
    }
  }, [ticket?.id]);

  // Load staff on mount
  useEffect(() => {
    loadStaff();
  }, []);

  // Load assigned staff when ticket changes
  useEffect(() => {
    if (ticket) {
      loadAssignedStaff();
      inputRef.current?.focus();
    }
  }, [ticket?.id]);

  // Scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadStaff = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/staff');
      if (response.data.success) {
        setStaff(response.data.data || []);
      }
    } catch (err) {
      console.error('Error loading staff:', err);
    }
  };

  const loadAssignedStaff = async () => {
    if (!ticket) return;
    
    try {
      const response = await axios.get(`http://localhost:8080/api/tickets/${ticket.id}/staff`);
      if (response.data.success && response.data.data.length > 0) {
        setAssignedStaff(response.data.data[0].id.toString());
      } else {
        setAssignedStaff('');
      }
    } catch (err) {
      console.error('Error loading assigned staff:', err);
    }
  };

  // ⭐ FIXED: Load messages from database
  const loadMessages = async () => {
    if (!ticket) return;

    setLoading(true);
    setError(null);

    try {
      console.log(`📥 Loading messages for ticket ${ticket.id}`);
      
      const response = await axios.get(`http://localhost:8080/api/messages/${ticket.id}`);
      
      console.log('Messages API response:', response.data);
      
      if (response.data.success && Array.isArray(response.data.data)) {
        setMessages(response.data.data);
        console.log(`✅ Loaded ${response.data.data.length} messages`);
      } else {
        setMessages([]);
        console.log('⚠️ No messages in response');
      }
    } catch (err) {
      console.error('❌ Error loading messages:', err);
      setError('Failed to load messages');
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // ⭐ FIXED: Send reply via WhatsApp
  const handleSendMessage = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || sending) return;

    setSending(true);
    setError(null);

    try {
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      const staffName = user.name || 'Admin';
      
      console.log(`📤 Sending message to ticket ${ticket.id}`);
      
      const response = await axios.post(
        `http://localhost:8080/api/messages/${ticket.id}/reply`,
        {
          message: newMessage.trim(),
          staffName: staffName
        }
      );

      console.log('Send response:', response.data);

      if (response.data.success) {
        setNewMessage('');
        
        // Reload messages immediately
        await loadMessages();
        
        if (onMessageSent) {
          onMessageSent();
        }
      }
    } catch (err) {
      console.error('❌ Error sending message:', err);
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleAssignStaff = async (staffId) => {
    if (!staffId || assigning) return;

    setAssigning(true);
    try {
      const response = await axios.post('http://localhost:8080/api/tickets/assign', {
        ticketId: ticket.id,
        staffId: parseInt(staffId)
      });
      
      if (response.data.success) {
        setAssignedStaff(staffId);
        console.log('✅ Staff assigned successfully');
      }
    } catch (err) {
      console.error('Error assigning staff:', err);
      setError('Failed to assign staff');
    } finally {
      setAssigning(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  if (!ticket) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="text-center animate-fadeIn">
          <div className="w-24 h-24 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-12 h-12 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Ticket Selected</h3>
          <p className="text-gray-500">Select a ticket from the sidebar to view conversation</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Chat Header */}
      <div className="border-b border-gray-200 px-6 py-4 bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
              {ticket.group_name || 'Unnamed Ticket'}
            </h2>
            <p className="text-sm text-gray-500">
              Ticket #{ticket.id} • {messages.length} message{messages.length !== 1 ? 's' : ''}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            {/* Refresh Button */}
            <button
              onClick={loadMessages}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
              title="Refresh messages"
            >
              <RefreshCw className={`w-4 h-4 text-gray-600 group-hover:text-blue-600 transition-colors ${loading ? 'animate-spin' : ''}`} />
            </button>

            {/* Status Badge */}
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              ticket.status === 'open' ? 'bg-green-100 text-green-700' :
              ticket.status === 'pending_reply' ? 'bg-yellow-100 text-yellow-700' :
              ticket.status === 'no_reply' ? 'bg-red-100 text-red-700' :
              'bg-gray-100 text-gray-700'
            }`}>
              {ticket.status.replace('_', ' ').toUpperCase()}
            </span>

            {/* Staff Assignment */}
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" />
              <select
                value={assignedStaff}
                onChange={(e) => handleAssignStaff(e.target.value)}
                disabled={assigning}
                className="px-3 py-1.5 rounded-lg border border-gray-300 text-sm bg-white hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-400 transition-colors"
              >
                <option value="">Assign to...</option>
                {staff.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-4 bg-gradient-to-br from-gray-50 to-white">
        {loading && messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin mx-auto mb-3" />
              <p className="text-gray-500">Loading messages...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex items-center justify-center h-full animate-fadeIn">
            <div className="text-center">
              <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-10 h-10 text-blue-500" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">No messages yet</h3>
              <p className="text-gray-500 text-sm">
                Messages will appear here when customer sends WhatsApp
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages
              .filter(msg => msg && msg.id)
              .map((message, index) => (
                <div key={message.id} className="message-enter" style={{animationDelay: `${index * 0.05}s`}}>
                  <MessageBubble
                    message={message}
                    isStaff={!message.is_from_customer}
                  />
                </div>
              ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-6 py-3 bg-red-50 border-t border-red-200 animate-slideDown">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-600">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Input Area */}
      <div className="border-t border-gray-200 px-6 py-4 bg-white">
        <form onSubmit={handleSendMessage} className="flex items-end gap-3">
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type your message... (will be sent via WhatsApp)"
              rows="2"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white resize-none custom-scrollbar transition-all duration-200"
              disabled={sending}
            />
          </div>

          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg hover:scale-105 active:scale-95 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center gap-2"
          >
            {sending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="font-medium">Sending...</span>
              </>
            ) : (
              <>
                <Send className="w-5 h-5" />
                <span className="font-medium">Send</span>
              </>
            )}
          </button>
        </form>
        <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          Messages are sent via WhatsApp Cloud API
        </p>
      </div>
    </div>
  );
};

export default ChatWindow;