import React, { useState, useEffect } from 'react';
import { Send, Upload, Eye, Calendar, Download, FileText, Plus } from 'lucide-react';
import axios from 'axios';

const BulkMessagingPage = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: '',
    templateId: '',
    customMessage: '',
    recipientType: 'manual',
    selectedContacts: [],
    csvFile: null,
    scheduledFor: '',
    variables: {}
  });

  const [csvContacts, setCsvContacts] = useState([]);
  const [previewMessage, setPreviewMessage] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [campaignsRes, templatesRes] = await Promise.all([
        axios.get('http://localhost:8080/api/bulk-messages'),
        axios.get('http://localhost:8080/api/templates')
      ]);
      setCampaigns(campaignsRes.data.data || []);
      setTemplates(templatesRes.data.data || []);
      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleTemplateChange = (templateId) => {
    const template = templates.find(t => t.id === parseInt(templateId));
    setFormData({
      ...formData,
      templateId,
      customMessage: template?.message || ''
    });
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const contacts = [];
      for (let i = 1; i < lines.length; i++) {
        if (!lines[i].trim()) continue;
        
        const values = lines[i].split(',').map(v => v.trim());
        const contact = {};
        headers.forEach((header, idx) => {
          contact[header.toLowerCase()] = values[idx];
        });
        
        if (contact.phone || contact.phonenumber || contact.mobile) {
          contacts.push({
            name: contact.name || 'Unknown',
            phone: contact.phone || contact.phonenumber || contact.mobile,
            company: contact.company || '',
            ...contact
          });
        }
      }
      
      setCsvContacts(contacts);
      setFormData({ ...formData, csvFile: file });
      alert(`Loaded ${contacts.length} contacts from CSV`);
    };
    
    reader.readAsText(file);
  };

  const downloadCSVTemplate = () => {
    const template = 'name,phone,company,custom1,custom2\nJohn Doe,1234567890,Acme Inc,Value1,Value2\nJane Smith,0987654321,Tech Corp,Value3,Value4';
    const blob = new Blob([template], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contacts-template.csv';
    a.click();
  };

  const replaceVariables = (message, contact) => {
    let result = message;
    
    // Replace {{name}}
    result = result.replace(/\{\{name\}\}/gi, contact.name || 'Customer');
    
    // Replace {{company}}
    result = result.replace(/\{\{company\}\}/gi, contact.company || 'your company');
    
    // Replace {{phone}}
    result = result.replace(/\{\{phone\}\}/gi, contact.phone || '');
    
    // Replace custom variables
    Object.keys(contact).forEach(key => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'gi');
      result = result.replace(regex, contact[key] || '');
    });
    
    return result;
  };

  const handlePreview = () => {
    if (csvContacts.length > 0) {
      const sample = replaceVariables(formData.customMessage, csvContacts[0]);
      setPreviewMessage(sample);
    } else {
      setPreviewMessage(formData.customMessage);
    }
    setShowPreview(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.recipientType === 'csv' && csvContacts.length === 0) {
      alert('Please upload a CSV file with contacts');
      return;
    }

    try {
      const recipients = formData.recipientType === 'csv' 
        ? csvContacts.map(c => c.phone)
        : formData.selectedContacts;

      await axios.post('http://localhost:8080/api/bulk-messages', {
        name: formData.name,
        message: formData.customMessage,
        recipients,
        scheduled_for: formData.scheduledFor || null
      });

      setShowModal(false);
      loadData();
      alert('Campaign created successfully!');
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
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
          <h1 className="text-3xl font-bold text-gray-800">Bulk Messaging</h1>
          <p className="text-gray-600 mt-1">Send messages to multiple contacts at once</p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
        >
          <Plus className="w-5 h-5" />
          New Campaign
        </button>
      </div>

      {/* Campaigns List */}
      <div className="grid grid-cols-1 gap-6">
        {campaigns.map((campaign) => (
          <div key={campaign.id} className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-bold text-gray-800">{campaign.name}</h3>
                <p className="text-gray-600 mt-1">{campaign.message}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                campaign.status === 'sent' ? 'bg-green-100 text-green-700' :
                campaign.status === 'scheduled' ? 'bg-yellow-100 text-yellow-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {campaign.status}
              </span>
            </div>
            
            <div className="grid grid-cols-3 gap-4 text-sm text-gray-600">
              <div>
                <span className="font-medium">Recipients:</span> {campaign.total_recipients}
              </div>
              <div>
                <span className="font-medium">Sent:</span> {campaign.sent_count || 0}
              </div>
              <div>
                <span className="font-medium">Created:</span> {new Date(campaign.created_at).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {campaigns.length === 0 && (
        <div className="text-center py-12">
          <Send className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-6">Create your first bulk messaging campaign</p>
        </div>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl p-8 max-w-3xl w-full mx-4 my-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Create Campaign</h2>
            
            <form onSubmit={handleSubmit}>
              {/* Campaign Name */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="e.g., Holiday Promotion 2024"
                  required
                />
              </div>

              {/* Template Selection */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Use Template (Optional)</label>
                <select
                  value={formData.templateId}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">-- Select Template --</option>
                  {templates.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>

              {/* Message */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Message *</label>
                <textarea
                  value={formData.customMessage}
                  onChange={(e) => setFormData({ ...formData, customMessage: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="5"
                  placeholder="Hi {{name}}, we have a special offer for {{company}}..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  💡 Available variables: <code>{'{{name}}'}</code>, <code>{'{{company}}'}</code>, <code>{'{{phone}}'}</code>, or any custom column from CSV
                </p>
              </div>

              {/* Recipient Type */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Recipients *</label>
                <div className="flex gap-4 mb-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="manual"
                      checked={formData.recipientType === 'manual'}
                      onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                      className="mr-2"
                    />
                    Manual Selection
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      value="csv"
                      checked={formData.recipientType === 'csv'}
                      onChange={(e) => setFormData({ ...formData, recipientType: e.target.value })}
                      className="mr-2"
                    />
                    Upload CSV
                  </label>
                </div>

                {formData.recipientType === 'csv' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="text-center">
                      <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <label className="cursor-pointer">
                        <span className="bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 inline-block">
                          Upload CSV File
                        </span>
                        <input
                          type="file"
                          accept=".csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-sm text-gray-500 mt-4">
                        {csvContacts.length > 0 
                          ? `✅ ${csvContacts.length} contacts loaded`
                          : 'Upload a CSV file with phone numbers'}
                      </p>
                      <button
                        type="button"
                        onClick={downloadCSVTemplate}
                        className="text-primary-600 text-sm mt-2 hover:underline flex items-center gap-1 mx-auto"
                      >
                        <Download className="w-4 h-4" />
                        Download CSV Template
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Schedule */}
              <div className="mb-6">
                <label className="block text-gray-700 font-medium mb-2">Schedule (Optional)</label>
                <input
                  type="datetime-local"
                  value={formData.scheduledFor}
                  onChange={(e) => setFormData({ ...formData, scheduledFor: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-sm text-gray-500 mt-1">Leave blank to send immediately</p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handlePreview}
                  className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
                >
                  <Eye className="w-5 h-5" />
                  Preview
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700"
                >
                  Create Campaign
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

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Message Preview</h2>
            <div className="bg-gray-50 rounded-lg p-6 mb-6">
              <p className="whitespace-pre-wrap">{previewMessage}</p>
            </div>
            {csvContacts.length > 0 && (
              <p className="text-sm text-gray-500 mb-4">
                Preview shown with first contact: {csvContacts[0].name}
              </p>
            )}
            <button
              onClick={() => setShowPreview(false)}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default BulkMessagingPage;