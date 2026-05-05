import React, { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, Tag, X, Filter } from 'lucide-react';
import axios from 'axios';

const ContactsPage = () => {
  const [contacts, setContacts] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLabel, setSelectedLabel] = useState('All Contacts');
  const [showModal, setShowModal] = useState(false);
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [labelContact, setLabelContact] = useState(null);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    phoneNumber: '',
    email: '',
    company: ''
  });

  const labelOptions = [
    { name: 'All Contacts', color: 'gray', count: 0 },
    { name: 'VIP', color: 'purple', count: 0 },
    { name: 'New Customer', color: 'blue', count: 0 },
    { name: 'Issue', color: 'red', count: 0 },
    { name: 'Follow Up', color: 'yellow', count: 0 },
    { name: 'Archived', color: 'gray', count: 0 },
    { name: 'Premium', color: 'green', count: 0 },
    { name: 'Urgent', color: 'orange', count: 0 }
  ];

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/contacts');
      setContacts(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading contacts:', error);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingContact(null);
    setFormData({ name: '', phoneNumber: '', email: '', company: '' });
    setShowModal(true);
  };

  const handleEdit = (contact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phoneNumber: contact.phone_number,
      email: contact.email || '',
      company: contact.company || ''
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingContact) {
        await axios.put(`http://localhost:8080/api/contacts/${editingContact.id}`, formData);
      } else {
        await axios.post('http://localhost:8080/api/contacts', formData);
      }
      setShowModal(false);
      loadContacts();
      alert('Contact saved successfully!');
    } catch (error) {
      console.error('Error saving contact:', error);
      alert('Failed to save contact');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await axios.delete(`http://localhost:8080/api/contacts/${id}`);
      loadContacts();
      alert('Contact deleted successfully!');
    } catch (error) {
      console.error('Error deleting contact:', error);
      alert('Failed to delete contact');
    }
  };

  const handleAssignLabel = (contact) => {
    setLabelContact(contact);
    setShowLabelModal(true);
  };

  const handleAddLabel = async (labelName) => {
    if (!labelContact) return;
    try {
      await axios.post(`http://localhost:8080/api/contacts/${labelContact.id}/labels`, {
        label: labelName
      });
      loadContacts();
      setShowLabelModal(false);
      setLabelContact(null);
      alert('Label assigned successfully!');
    } catch (error) {
      console.error('Error assigning label:', error);
      alert('Failed to assign label');
    }
  };

  const handleRemoveLabel = async (contactId, labelName) => {
    try {
      await axios.delete(`http://localhost:8080/api/contacts/${contactId}/labels/${labelName}`);
      loadContacts();
      alert('Label removed successfully!');
    } catch (error) {
      console.error('Error removing label:', error);
      alert('Failed to remove label');
    }
  };

  const getLabelColor = (labelName) => {
    const label = labelOptions.find(l => l.name === labelName);
    return label?.color || 'gray';
  };

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contact.phone_number?.includes(searchQuery) ||
      contact.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLabel = 
      selectedLabel === 'All Contacts' ||
      contact.labels?.includes(selectedLabel);
    
    return matchesSearch && matchesLabel;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Contacts</h1>
          <p className="text-gray-600 mt-1">Manage your customer relationships</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          Add Contact
        </button>
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, phone, email, or company..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <select
            value={selectedLabel}
            onChange={(e) => setSelectedLabel(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            {labelOptions.map(label => (
              <option key={label.name} value={label.name}>
                {label.name}
              </option>
            ))}
          </select>
        </div>

        {/* Label Filters */}
        <div className="flex flex-wrap gap-2">
          {labelOptions.map(label => (
            <button
              key={label.name}
              onClick={() => setSelectedLabel(label.name)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedLabel === label.name
                  ? `bg-${label.color}-600 text-white`
                  : `bg-${label.color}-100 text-${label.color}-700 hover:bg-${label.color}-200`
              }`}
            >
              {label.name}
            </button>
          ))}
        </div>
      </div>

      {/* Contacts Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Company</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Labels</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Messages</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Contact</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {filteredContacts.map((contact) => (
              <tr key={contact.id} className="hover:bg-gray-50">
                <td className="px-6 py-4">
                  <div>
                    <div className="font-semibold text-gray-800">{contact.name}</div>
                    <div className="text-sm text-gray-500">{contact.phone_number}</div>
                    {contact.email && <div className="text-sm text-gray-500">{contact.email}</div>}
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{contact.company || '-'}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-wrap gap-1">
                    {contact.labels?.map((label, idx) => (
                      <span
                        key={idx}
                        className={`px-2 py-1 rounded-full text-xs font-medium bg-${getLabelColor(label)}-100 text-${getLabelColor(label)}-700 flex items-center gap-1`}
                      >
                        {label}
                        <button
                          onClick={() => handleRemoveLabel(contact.id, label)}
                          className="hover:bg-red-200 rounded-full p-0.5"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                    <button
                      onClick={() => handleAssignLabel(contact)}
                      className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600 hover:bg-gray-200"
                    >
                      + Add Label
                    </button>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-600">{contact.message_count || 0}</td>
                <td className="px-6 py-4 text-gray-600">
                  {contact.last_message_at 
                    ? new Date(contact.last_message_at).toLocaleDateString()
                    : 'Never'}
                </td>
                <td className="px-6 py-4">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEdit(contact)}
                      className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filteredContacts.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No contacts found</p>
          </div>
        )}
      </div>

      {/* Add/Edit Contact Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingContact ? 'Edit Contact' : 'Add Contact'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Company</label>
                  <input
                    type="text"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
                >
                  {editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Label Assignment Modal */}
      {showLabelModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Assign Label</h2>
            
            <div className="space-y-2 mb-6">
              {labelOptions.filter(l => l.name !== 'All Contacts').map(label => (
                <button
                  key={label.name}
                  onClick={() => handleAddLabel(label.name)}
                  className={`w-full text-left px-4 py-3 rounded-lg bg-${label.color}-50 text-${label.color}-700 hover:bg-${label.color}-100 transition-colors font-medium`}
                >
                  {label.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowLabelModal(false)}
              className="w-full px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContactsPage;