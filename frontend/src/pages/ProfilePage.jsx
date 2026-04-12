import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Calendar, Award, MessageSquare, Clock, TrendingUp, Edit2, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ProfilePage = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    totalTickets: 0,
    resolvedTickets: 0,
    avgResponseTime: '0m',
    todayMessages: 0,
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  const [profile, setProfile] = useState({
    name: user.name || '',
    email: user.email || '',
    phone: user.phone || '',
    joinedDate: user.created_at || new Date().toISOString(),
  });

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      // In real app: fetch from API
      // For now: mock data
      setStats({
        totalTickets: 24,
        resolvedTickets: 18,
        avgResponseTime: '5m 30s',
        todayMessages: 47,
      });
    } catch (err) {
      console.error('Error loading stats:', err);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      // In real app: save to backend
      // For now: save to localStorage
      const updatedUser = { ...user, ...profile };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (err) {
      console.error('Error saving profile:', err);
      alert('Failed to save profile');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <button
              onClick={() => navigate('/dashboard')}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-2"
            >
              ← Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-500 mt-1">Manage your account information</p>
          </div>

          {editing ? (
            <div className="flex gap-3">
              <button
                onClick={() => setEditing(false)}
                className="px-6 py-3 border border-gray-300 rounded-xl hover:bg-gray-50 transition-all duration-200"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
              >
                <Save className="w-5 h-5" />
                <span>{loading ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          ) : (
            <button
              onClick={() => setEditing(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all duration-200"
            >
              <Edit2 className="w-5 h-5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-8 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
              {/* Avatar */}
              <div className="w-32 h-32 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-16 h-16 text-white" />
              </div>

              {/* Name */}
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                {profile.name}
              </h2>

              {/* Role Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-full text-sm font-medium mb-6">
                <Award className="w-4 h-4" />
                <span>Support Staff</span>
              </div>

              {/* Quick Stats */}
              <div className="space-y-4 mt-8">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Joined</span>
                  <span className="font-medium text-gray-800">
                    {formatDate(profile.joinedDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Status</span>
                  <span className="flex items-center gap-2 text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                    Online
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Details & Stats */}
          <div className="lg:col-span-2 space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Personal Information</h3>
              
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <User className="w-4 h-4" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
                    }`}
                  />
                </div>

                {/* Phone */}
                <div>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
                    <Phone className="w-4 h-4" />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                    disabled={!editing}
                    className={`w-full px-4 py-3 border border-gray-300 rounded-lg ${
                      editing ? 'focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
                    }`}
                  />
                </div>
              </div>
            </div>

            {/* Performance Stats */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Performance Stats</h3>
              
              <div className="grid grid-cols-2 gap-6">
                {/* Total Tickets */}
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-8 h-8 text-blue-600" />
                    <TrendingUp className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="text-3xl font-bold text-blue-700">{stats.totalTickets}</p>
                  <p className="text-sm text-blue-600 mt-1">Total Tickets</p>
                </div>

                {/* Resolved */}
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Award className="w-8 h-8 text-green-600" />
                    <span className="text-xs font-medium text-green-600">
                      {Math.round((stats.resolvedTickets / stats.totalTickets) * 100)}%
                    </span>
                  </div>
                  <p className="text-3xl font-bold text-green-700">{stats.resolvedTickets}</p>
                  <p className="text-sm text-green-600 mt-1">Resolved</p>
                </div>

                {/* Avg Response Time */}
                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="w-8 h-8 text-purple-600" />
                  </div>
                  <p className="text-3xl font-bold text-purple-700">{stats.avgResponseTime}</p>
                  <p className="text-sm text-purple-600 mt-1">Avg Response</p>
                </div>

                {/* Today Messages */}
                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6">
                  <div className="flex items-center justify-between mb-2">
                    <MessageSquare className="w-8 h-8 text-orange-600" />
                    <Calendar className="w-5 h-5 text-orange-500" />
                  </div>
                  <p className="text-3xl font-bold text-orange-700">{stats.todayMessages}</p>
                  <p className="text-sm text-orange-600 mt-1">Today</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;