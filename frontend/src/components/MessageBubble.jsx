import React from 'react';
import { CheckCheck, Check } from 'lucide-react';

const MessageBubble = ({ message, isStaff }) => {
  // Safety check
  if (!message || !message.message_text) {
    return null;
  }

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      // Today - show time only
      return date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      // Yesterday
      return 'Yesterday';
    } else if (diffDays < 7) {
      // This week - show day
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      // Older - show date
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }
  };

  return (
    <div className={`flex ${isStaff ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
          isStaff
            ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
            : 'bg-white/90 text-gray-800 border border-gray-200'
        }`}
      >
        {/* Sender Name (for customer messages) */}
        {!isStaff && message.sender_name && (
          <div className="text-xs font-semibold text-gray-600 mb-1">
            {message.sender_name}
          </div>
        )}

        {/* Message Text */}
        <div className="text-sm whitespace-pre-wrap break-words">
          {message.message_text}
        </div>

        {/* Timestamp and Status */}
        <div className={`flex items-center gap-1 mt-1 text-xs ${
          isStaff ? 'text-white/80' : 'text-gray-500'
        }`}>
          <span>{formatTime(message.timestamp || message.created_at)}</span>
          
          {/* Read receipts for staff messages */}
          {isStaff && (
            <CheckCheck className="w-3 h-3" />
          )}
        </div>

        {/* Message Type Indicator */}
        {message.message_type && message.message_type !== 'text' && (
          <div className="text-xs mt-1 opacity-75">
            {message.message_type === 'image' && '📷 Image'}
            {message.message_type === 'document' && '📄 Document'}
            {message.message_type === 'audio' && '🎵 Audio'}
            {message.message_type === 'video' && '🎥 Video'}
          </div>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;