// Format date to readable format
export const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  // Less than 1 minute
  if (diff < 60000) {
    return 'Just now';
  }
  
  // Less than 1 hour
  if (diff < 3600000) {
    const minutes = Math.floor(diff / 60000);
    return `${minutes}m ago`;
  }
  
  // Less than 24 hours
  if (diff < 86400000) {
    const hours = Math.floor(diff / 3600000);
    return `${hours}h ago`;
  }
  
  // Less than 7 days
  if (diff < 604800000) {
    const days = Math.floor(diff / 86400000);
    return `${days}d ago`;
  }
  
  // Format as date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

// Format time only
export const formatTime = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
};

// Get status badge color
export const getStatusColor = (status) => {
  const colors = {
    'open': 'bg-green-100 text-green-700 border-green-200',
    'pending_reply': 'bg-yellow-100 text-yellow-700 border-yellow-200',
    'no_reply': 'bg-red-100 text-red-700 border-red-200',
    'closed': 'bg-gray-100 text-gray-700 border-gray-200',
  };
  
  return colors[status] || colors['open'];
};

// Format status text
export const formatStatus = (status) => {
  const statusMap = {
    'open': 'Open',
    'pending_reply': 'Pending Reply',
    'no_reply': 'No Reply',
    'closed': 'Closed',
  };
  
  return statusMap[status] || status;
};

// Truncate text
export const truncateText = (text, maxLength = 50) => {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength) + '...';
};

// Get initials from name
export const getInitials = (name) => {
  if (!name) return '?';
  
  const parts = name.split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
};