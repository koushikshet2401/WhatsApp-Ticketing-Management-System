import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { Settings, Save, AlertCircle, Phone, Key, Link as LinkIcon, Loader2 } from 'lucide-react';

const CompanySettings = () => {
  let user = null;
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      user = JSON.parse(userStr);
    }
  } catch (e) {
    console.error('Error parsing user');
  }
  const [settings, setSettings] = useState({
    name: '',
    whatsapp_phone_number_id: '',
    whatsapp_access_token: '',
    webhook_url: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const res = await api.get('/api/company/settings');
      if (res.data.success) {
        setSettings({
          name: res.data.data.name || '',
          whatsapp_phone_number_id: res.data.data.whatsapp_phone_number_id || '',
          whatsapp_access_token: res.data.data.whatsapp_access_token || '',
          webhook_url: `${window.location.origin}/webhook` // Provide hint for webhook
        });
      }
    } catch (error) {
      console.error('Failed to fetch settings', error);
      setMessage({ type: 'error', text: 'Failed to load company settings.' });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setMessage(null);
      const res = await api.put('/api/company/settings', {
        whatsapp_phone_number_id: settings.whatsapp_phone_number_id,
        whatsapp_access_token: settings.whatsapp_access_token
      });
      if (res.data.success) {
        setMessage({ type: 'success', text: 'Settings saved successfully.' });
        fetchSettings(); // Refresh to mask token again
      }
    } catch (error) {
      console.error('Failed to save settings', error);
      setMessage({ type: 'error', text: 'Failed to save settings.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-2" />
          You do not have permission to view this page.
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-primary-600" />
            Company Settings
          </h1>
          <p className="text-gray-500 mt-1">Manage your business account and WhatsApp integration</p>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center ${
          message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'
        }`}>
          <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-lg font-semibold text-gray-800">WhatsApp Cloud API Credentials</h2>
          <p className="text-sm text-gray-500 mt-1">Configure your WhatsApp integration parameters here.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Phone Number ID */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              WhatsApp Phone Number ID
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="whatsapp_phone_number_id"
                value={settings.whatsapp_phone_number_id}
                onChange={handleChange}
                placeholder="e.g. 101234567890123"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Find this in your Meta App Dashboard under WhatsApp &gt; API Setup.</p>
          </div>

          {/* Access Token */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Permanent Access Token
            </label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                name="whatsapp_access_token"
                value={settings.whatsapp_access_token}
                onChange={handleChange}
                placeholder="EAAL..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent font-mono text-sm"
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">Generate a permanent token from the Meta Business Settings (System Users).</p>
          </div>

          <div className="bg-blue-50 text-blue-800 p-4 rounded-lg flex items-start gap-3 mt-4">
            <LinkIcon className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Webhook URL</p>
              <p className="text-sm mt-1">Configure this URL in your Meta App Webhook settings:</p>
              <code className="bg-blue-100 text-blue-900 px-2 py-1 rounded mt-2 block font-mono text-xs break-all">
                {settings.webhook_url}
              </code>
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={saving}
              className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CompanySettings;
