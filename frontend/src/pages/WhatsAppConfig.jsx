import React, { useState, useEffect } from 'react';
import api from '../services/api';

export default function WhatsAppConfig() {
  const [config, setConfig] = useState({
    whatsapp_phone_number_id: '',
    whatsapp_business_account_id: '',
    whatsapp_access_token: '',
    whatsapp_app_secret: '',
    whatsapp_verify_token: ''
  });
  const [status, setStatus] = useState({ configured: false, active: false });
  const [webhookUrl, setWebhookUrl] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [step, setStep] = useState(1); // 1=form, 2=webhook setup, 3=done

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    try {
      const { data } = await api.get('/whatsapp-config');
      if (data.configured) {
        setStatus({ configured: true, active: data.active });
        setConfig(prev => ({ ...prev, ...data.config }));
        setWebhookUrl(data.config.webhook_url);
        setStep(3);
      } else if (data.config) {
        setConfig(prev => ({ ...prev, ...data.config }));
        setWebhookUrl(data.config.webhook_url);
      }
    } catch (err) {
      console.error('Failed to fetch config:', err);
    }
  };

  const handleSave = async () => {
    if (!config.whatsapp_phone_number_id || !config.whatsapp_access_token) {
      setTestResult({ success: false, error: 'Phone Number ID and Access Token are required.' });
      return;
    }

    setSaving(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/whatsapp-config', config);
      setWebhookUrl(data.webhook_url);
      setTestResult({ success: true, message: data.message });
      setStep(2);
    } catch (err) {
      setTestResult({ success: false, error: err.response?.data?.error || 'Failed to save' });
    }
    setSaving(false);
  };

  const handleTest = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const { data } = await api.post('/whatsapp-config/test', {});
      setTestResult(data);
      if (data.success) setStep(3);
    } catch (err) {
      setTestResult({ success: false, error: err.response?.data?.error || 'Test failed' });
    }
    setTesting(false);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-semibold text-gray-900 mb-2">WhatsApp Configuration</h1>
      <p className="text-gray-500 mb-8">
        Connect your WhatsApp Business account to start receiving messages.
      </p>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {[
          { n: 1, label: 'Enter credentials' },
          { n: 2, label: 'Configure webhook' },
          { n: 3, label: 'Connected' }
        ].map((s) => (
          <div key={s.n} className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
              ${step >= s.n
                ? 'bg-green-600 text-white'
                : 'bg-gray-200 text-gray-500'}`}>
              {step > s.n ? '✓' : s.n}
            </div>
            <span className={`text-sm ${step >= s.n ? 'text-gray-900' : 'text-gray-400'}`}>
              {s.label}
            </span>
            {s.n < 3 && <div className="w-8 h-px bg-gray-300" />}
          </div>
        ))}
      </div>

      {/* Step 1: Credentials Form */}
      {step <= 2 && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Meta API credentials</h2>
          <p className="text-sm text-gray-500 mb-6">
            Find these in your{' '}
            <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer"
              className="text-blue-600 underline">Meta Developer Console</a>
            {' → WhatsApp → API Setup'}
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. 123456789012345"
                value={config.whatsapp_phone_number_id}
                onChange={e => setConfig({...config, whatsapp_phone_number_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                  focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Meta App Dashboard → WhatsApp → API Setup → Phone Number ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Business Account ID
              </label>
              <input
                type="text"
                placeholder="e.g. 987654321098765"
                value={config.whatsapp_business_account_id}
                onChange={e => setConfig({...config, whatsapp_business_account_id: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                  focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Same page as above, listed next to Phone Number ID
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Access Token <span className="text-red-500">*</span>
              </label>
              <input
                type="password"
                placeholder="EAAGm0PX4ZC..."
                value={config.whatsapp_access_token}
                onChange={e => setConfig({...config, whatsapp_access_token: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono
                  focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                Use a permanent token from Business Settings → System Users → Generate Token
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">App Secret</label>
              <input
                type="password"
                placeholder="abc123def456..."
                value={config.whatsapp_app_secret}
                onChange={e => setConfig({...config, whatsapp_app_secret: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono
                  focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                App Settings → Basic → App Secret (click Show)
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Webhook Verify Token
              </label>
              <input
                type="text"
                placeholder="my_custom_verify_token"
                value={config.whatsapp_verify_token}
                onChange={e => setConfig({...config, whatsapp_verify_token: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm
                  focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                You create this — any random string. You'll paste the same value in Meta's webhook config.
              </p>
            </div>
          </div>

          <div className="flex gap-3 mt-6">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-green-600 text-white rounded-md text-sm font-medium
                hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed">
              {saving ? 'Saving...' : 'Save credentials'}
            </button>

            {step === 2 && (
              <button
                onClick={handleTest}
                disabled={testing}
                className="px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium
                  hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed">
                {testing ? 'Testing...' : 'Test connection'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Step 2: Webhook URL */}
      {step >= 2 && webhookUrl && (
        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-1">Configure webhook in Meta</h2>
          <p className="text-sm text-gray-500 mb-4">
            Go to your Meta App Dashboard → WhatsApp → Configuration → Webhook and paste these values:
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Callback URL
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono">
                  {webhookUrl}
                </code>
                <button onClick={() => copyToClipboard(webhookUrl)}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                  Copy
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1 uppercase tracking-wide">
                Verify Token
              </label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded text-sm font-mono">
                  {config.whatsapp_verify_token || 'Set a verify token above first'}
                </code>
                <button onClick={() => copyToClipboard(config.whatsapp_verify_token)}
                  className="px-3 py-2 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50">
                  Copy
                </button>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-3 mt-3">
              <p className="text-sm text-amber-800">
                After pasting the Callback URL and Verify Token in Meta, click "Verify and Save" in Meta's console.
                Then subscribe to: <strong>messages</strong> and <strong>message_template_status_updates</strong>.
              </p>
            </div>
          </div>

          {step === 2 && (
            <button
              onClick={handleTest}
              disabled={testing}
              className="mt-4 px-5 py-2 bg-blue-600 text-white rounded-md text-sm font-medium
                hover:bg-blue-700 disabled:opacity-50">
              {testing ? 'Verifying...' : 'Verify connection'}
            </button>
          )}
        </div>
      )}

      {/* Result banner */}
      {testResult && (
        <div className={`rounded-lg p-4 mb-6 ${
          testResult.success 
            ? 'bg-green-50 border border-green-200' 
            : 'bg-red-50 border border-red-200'}`}>
          {testResult.success ? (
            <div>
              <p className="text-green-800 font-medium">Connected successfully</p>
              {testResult.phone_number && (
                <p className="text-green-700 text-sm mt-1">
                  Phone: {testResult.phone_number} · Business: {testResult.business_name} · Quality: {testResult.quality}
                </p>
              )}
              <p className="text-green-600 text-sm mt-2">
                Your WhatsApp messages will now appear in the dashboard.
              </p>
            </div>
          ) : (
            <div>
              <p className="text-red-800 font-medium">Connection failed</p>
              <p className="text-red-600 text-sm mt-1">{testResult.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Step 3: Connected state */}
      {step === 3 && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <h2 className="text-lg font-medium text-green-900">WhatsApp is connected</h2>
          </div>
          <p className="text-sm text-green-700">
            All incoming WhatsApp messages to your business number will appear in the Inbox.
          </p>
          <button
            onClick={() => setStep(1)}
            className="mt-4 text-sm text-green-700 underline hover:text-green-900">
            Reconfigure
          </button>
        </div>
      )}

      {/* How-to guide */}
      <div className="mt-8 bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Where to find these values</h3>
        <ol className="text-sm text-gray-600 space-y-2 list-decimal list-inside">
          <li>Go to <a href="https://developers.facebook.com/apps" target="_blank" rel="noreferrer" className="text-blue-600 underline">developers.facebook.com/apps</a></li>
          <li>Open your app → Add WhatsApp product if not added</li>
          <li>WhatsApp → API Setup shows your Phone Number ID and Business Account ID</li>
          <li>For a permanent Access Token: Business Settings → System Users → Generate Token with <code className="px-1 py-0.5 bg-gray-200 rounded text-xs">whatsapp_business_messaging</code> permission</li>
          <li>For App Secret: App Settings → Basic → click Show next to App Secret</li>
          <li>The Verify Token is any string you create — paste the same value here and in Meta's webhook config</li>
        </ol>
      </div>
    </div>
  );
}
