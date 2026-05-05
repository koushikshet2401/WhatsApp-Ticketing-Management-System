import React, { useState, useEffect } from 'react';
import { Phone, Plus, Edit2, Trash2, Check, X, Power } from 'lucide-react';
import axios from 'axios';

const PhoneNumbersPage = () => {
  const [phones, setPhones] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editingPhone, setEditingPhone] = useState(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    phoneNumber: '',
    displayName: '',
    whatsappPhoneId: '',
    whatsappToken: ''
  });

  useEffect(() => {
    loadPhones();
  }, []);

  const loadPhones = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/phones');
      setPhones(response.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading phones:', error);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingPhone(null);
    setFormData({
      phoneNumber: '',
      displayName: '',
      whatsappPhoneId: '',
      whatsappToken: ''
    });
    setShowModal(true);
  };

  const handleEdit = (phone) => {
    setEditingPhone(phone);
    setFormData({
      phoneNumber: phone.phone_number,
      displayName: phone.display_name,
      whatsappPhoneId: phone.whatsapp_phone_id,
      whatsappToken: phone.whatsapp_token
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingPhone) {
        await axios.put(`http://localhost:8080/api/phones/${editingPhone.id}`, formData);
      } else {
        await axios.post('http://localhost:8080/api/phones', formData);
      }
      
      setShowModal(false);
      loadPhones();
      alert('Phone number saved successfully!');
    } catch (error) {
      console.error('Error saving phone:', error);
      alert(error.response?.data?.error || 'Failed to save phone number');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this phone number?')) return;
    
    try {
      await axios.delete(`http://localhost:8080/api/phones/${id}`);
      loadPhones();
      alert('Phone number deleted successfully!');
    } catch (error) {
      console.error('Error deleting phone:', error);
      alert('Failed to delete phone number');
    }
  };

  const handleToggleActive = async (phone) => {
    try {
      await axios.patch(`http://localhost:8080/api/phones/${phone.id}/toggle`);
      loadPhones();
    } catch (error) {
      console.error('Error toggling phone:', error);
      alert('Failed to update phone status');
    }
  };

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
          <h1 className="text-3xl font-bold text-gray-800">Phone Numbers</h1>
          <p className="text-gray-600 mt-1">Manage multiple WhatsApp business numbers</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Phone Number
        </button>
      </div>

      {/* Phone Numbers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {phones.map((phone) => (
          <div
            key={phone.id}
            className="bg-white rounded-xl shadow-md p-6 border-l-4 border-primary-500 hover:shadow-lg transition-shadow"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 ${phone.is_active ? 'bg-green-100' : 'bg-gray-100'} rounded-lg flex items-center justify-center`}>
                  <Phone className={`w-6 h-6 ${phone.is_active ? 'text-green-600' : 'text-gray-400'}`} />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800">{phone.display_name}</h3>
                  <p className="text-sm text-gray-500">{phone.phone_number}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleActive(phone)}
                className={`p-2 rounded-lg transition-colors ${
                  phone.is_active
                    ? 'bg-green-100 text-green-600 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                }`}
                title={phone.is_active ? 'Active' : 'Inactive'}
              >
                <Power className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">WhatsApp Phone ID:</span>
                <span className="font-mono text-gray-800 truncate ml-2">{phone.whatsapp_phone_id}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Status:</span>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  phone.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                }`}>
                  {phone.is_active ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 pt-4 border-t border-gray-200">
              <button
                onClick={() => handleEdit(phone)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-50 text-primary-600 px-4 py-2 rounded-lg hover:bg-primary-100 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDelete(phone.id)}
                className="flex items-center justify-center bg-red-50 text-red-600 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {phones.length === 0 && (
        <div className="text-center py-12">
          <Phone className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No phone numbers yet</h3>
          <p className="text-gray-500 mb-6">Add your first WhatsApp business number to get started</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
          >
            <Plus className="w-5 h-5" />
            Add Phone Number
          </button>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingPhone ? 'Edit Phone Number' : 'Add Phone Number'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 mb-6">
                {/* Display Name */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Display Name *</label>
                  <input
                    type="text"
                    value={formData.displayName}
                    onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="e.g., Primary Business Line"
                    required
                  />
                </div>

                {/* Phone Number */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Phone Number *</label>
                  <input
                    type="tel"
                    value={formData.phoneNumber}
                    onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="1234567890"
                    required
                    disabled={!!editingPhone}
                  />
                </div>

                {/* WhatsApp Phone ID */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">WhatsApp Phone ID *</label>
                  <input
                    type="text"
                    value={formData.whatsappPhoneId}
                    onChange={(e) => setFormData({ ...formData, whatsappPhoneId: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    placeholder="From Meta Business Manager"
                    required
                  />
                </div>

                {/* WhatsApp Token */}
                <div>
                  <label className="block text-gray-700 font-medium mb-2">WhatsApp Access Token *</label>
                  <textarea
                    value={formData.whatsappToken}
                    onChange={(e) => setFormData({ ...formData, whatsappToken: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    rows="3"
                    placeholder="Permanent access token from Meta"
                    required
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors font-medium"
                >
                  {editingPhone ? 'Update Phone' : 'Add Phone'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PhoneNumbersPage;