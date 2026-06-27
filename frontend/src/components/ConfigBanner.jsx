import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

export default function ConfigBanner() {
  const [show, setShow] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkConfig();
  }, []);

  const checkConfig = async () => {
    try {
      const { data } = await api.get('/whatsapp-config');
      setShow(!data.configured);
    } catch {
      setShow(true);
    }
  };

  if (!show) return null;

  return (
    <div className="bg-amber-50 border border-amber-300 rounded-lg p-4 mb-6 flex items-center justify-between shadow-sm">
      <div>
        <p className="font-medium text-amber-900">WhatsApp is not configured</p>
        <p className="text-sm text-amber-700 mt-1">
          Connect your WhatsApp Business account to start receiving customer messages.
        </p>
      </div>
      <button
        onClick={() => navigate('/settings/whatsapp')}
        className="px-4 py-2 bg-amber-600 text-white rounded-md text-sm font-medium
          hover:bg-amber-700 whitespace-nowrap shadow-sm transition-colors">
        Configure now
      </button>
    </div>
  );
}
