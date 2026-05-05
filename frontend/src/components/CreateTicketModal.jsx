import React, { useState } from 'react';
import { X, Tag } from 'lucide-react';
import axios from 'axios';

const CreateTicketModal = ({ message, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: message?.message_text || '',
    status: 'open',
    priority: 'medium',
    labels: []
  });

  const priorityOptions = ['low', 'medium', 'high', 'urgent'];
  const labelOptions = ['Bug', 'Feature Request', 'Support', 'Question', 'Urgent', 'Follow-up'];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      await axios.post('http://localhost:8080/api/tickets', {
        ...formData,
        group_id: message?.ticket_id || `ticket_${Date.now()}`,
        group_name: formData.title
      });
      
      alert('Ticket created successfully!');
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error creating ticket:', error);
      alert('Failed to create ticket');
    }
  };

  const toggleLabel = (label) => {
    if (formData.labels.includes(label)) {
      setFormData({
        ...formData,
        labels: formData.labels.filter(l => l !== label)
      });
    } else {
      setFormData({
        ...formData,
        labels: [...formData.labels, label]
      });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-800">Create Ticket</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Title */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Title *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              placeholder="Brief description of the issue"
              required
            />
          </div>

          {/* Description */}
          <div className="mb-4">
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              rows="4"
              placeholder="Detailed description..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* Status */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Status *</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="open">Open</option>
                <option value="pending_reply">Pending Reply</option>
                <option value="no_reply">No Reply</option>
                <option value="closed">Closed</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-gray-700 font-medium mb-2">Priority *</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {priorityOptions.map(priority => (
                  <option key={priority} value={priority}>
                    {priority.charAt(0).toUpperCase() + priority.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Labels */}
          <div className="mb-6">
            <label className="block text-gray-700 font-medium mb-2">Labels</label>
            <div className="flex flex-wrap gap-2">
              {labelOptions.map(label => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                    formData.labels.includes(label)
                      ? 'bg-primary-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Create Ticket
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTicketModal;