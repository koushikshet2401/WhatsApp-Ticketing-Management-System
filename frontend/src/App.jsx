import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';
import AnalyticsDashboard from './pages/AnalyticsDashboard';
import TemplatesPage from './pages/TemplatesPage';
import ContactsPage from './pages/ContactsPage';
import BulkMessagingPage from './pages/BulkMessagingPage';
import PhoneNumbersPage from './pages/PhoneNumbersPage';
import KnowledgeBasePage from './pages/KnowledgeBasePage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import TicketsInbox from './pages/TicketsInbox';

function App() {
  return (
    <Router>
      <Routes>
        {/* Public Routes (No Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Protected Routes */}
        
        {/* INBOX - Full screen (no sidebar layout) */}
        <Route 
          path="/inbox" 
          element={
            <ProtectedRoute>
              <TicketsInbox />
            </ProtectedRoute>
          } 
        />
        
        {/* DASHBOARD - With Layout */}
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/analytics" 
          element={
            <ProtectedRoute>
              <Layout>
                <AnalyticsDashboard />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/templates" 
          element={
            <ProtectedRoute>
              <Layout>
                <TemplatesPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/contacts" 
          element={
            <ProtectedRoute>
              <Layout>
                <ContactsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/bulk-messaging" 
          element={
            <ProtectedRoute>
              <Layout>
                <BulkMessagingPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/phone-numbers" 
          element={
            <ProtectedRoute>
              <Layout>
                <PhoneNumbersPage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/knowledge-base" 
          element={
            <ProtectedRoute>
              <Layout>
                <KnowledgeBasePage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <Layout>
                <ProfilePage />
              </Layout>
            </ProtectedRoute>
          } 
        />
        
        {/* Default Route - Go to Login */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        
        {/* 404 Route - Go to Login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;