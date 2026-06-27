import React from 'react';
import { Info, MessageSquare, BookOpen, Settings, Zap } from 'lucide-react';

const AboutPage = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-4 mb-12">
        <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <Info className="w-8 h-8 text-primary-600" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900">Welcome to WhatsApp Support System</h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto">
          Your complete multi-tenant WhatsApp ticketing solution for managing customer support directly from WhatsApp Business API.
        </p>
      </div>

      {/* Main Features */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Inbox */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center mb-4">
            <MessageSquare className="w-6 h-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Smart Inbox</h3>
          <p className="text-gray-600 leading-relaxed">
            All customer messages arrive in real-time. Each customer is automatically assigned a ticket.
            You can reply directly, resolve tickets, and flag important messages without ever leaving the dashboard.
          </p>
        </div>

        {/* Knowledge Base */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
            <BookOpen className="w-6 h-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">AI Knowledge Base</h3>
          <p className="text-gray-600 leading-relaxed">
            Upload PDFs and documents in the Knowledge Base tab. Our system automatically processes them
            so that the AI can instantly draft smart replies to your customers based on your actual business documents.
          </p>
        </div>

        {/* Automation */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-yellow-50 rounded-xl flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-yellow-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Bulk Messaging & Templates</h3>
          <p className="text-gray-600 leading-relaxed">
            Create WhatsApp pre-approved templates and send bulk broadcasts to your contacts.
            Perfect for marketing campaigns, status updates, or alerting users of downtime.
          </p>
        </div>

        {/* Multi-tenant Config */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-50 rounded-xl flex items-center justify-center mb-4">
            <Settings className="w-6 h-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">Multi-Tenant Architecture</h3>
          <p className="text-gray-600 leading-relaxed">
            The entire backend is built to support multiple companies (tenants) simultaneously.
            Each tenant configures their own WhatsApp API keys and phone number in the <b>WhatsApp Config</b> page.
          </p>
        </div>
      </div>

      {/* Getting Started Guide */}
      <div className="mt-12 bg-gray-900 rounded-3xl p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary-600 rounded-full blur-3xl opacity-20 -mr-20 -mt-20"></div>
        <h2 className="text-2xl font-bold mb-6 relative z-10">🚀 How to configure WhatsApp API</h2>
        
        <div className="space-y-6 relative z-10">
          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold">1</div>
            <div>
              <h4 className="font-bold text-lg mb-1">Create Meta Developer App</h4>
              <p className="text-gray-300">Go to developers.facebook.com and create a new WhatsApp Business API app.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold">2</div>
            <div>
              <h4 className="font-bold text-lg mb-1">Enter Credentials in Dashboard</h4>
              <p className="text-gray-300">Copy your Phone Number ID and Access Token from the Meta dashboard. Go to <b>Settings &gt; WhatsApp Config</b> in this app and paste them in.</p>
            </div>
          </div>

          <div className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center font-bold">3</div>
            <div>
              <h4 className="font-bold text-lg mb-1">Configure the Webhook</h4>
              <p className="text-gray-300">In the Meta dashboard, set up a webhook pointing to your Render deployment URL:<br/>
                <code className="bg-black/30 px-2 py-1 rounded text-primary-300 text-sm mt-2 inline-block">https://your-app.onrender.com/api/webhook</code><br/>
                Use the verify token you set in the WhatsApp Config page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutPage;
