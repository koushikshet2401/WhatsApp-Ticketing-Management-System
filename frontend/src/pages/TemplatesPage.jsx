import React, { useState, useEffect } from 'react';
import { MessageSquare, Plus, Edit2, Trash2, Copy, TrendingUp } from 'lucide-react';
import axios from 'axios';

const TemplatesPage = () => {
  const [templates, setTemplates] = useState([]);
  const [categories, setCategories] = useState(['greeting', 'orders', 'closing', 'follow_up', 'general']);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    content: '',
    category: 'general',
    variables: []
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    try {
      const response = await axios.get('http://localhost:8080/api/templates');
      setTemplates(response.data.data);
      setLoading(false);
    } catch (error) {
      console.error('Error loading templates:', error);
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setEditingTemplate(null);
    setFormData({ name: '', content: '', category: 'general', variables: [] });
    setShowModal(true);
  };

  const handleEdit = (template) => {
    setEditingTemplate(template);
    setFormData({
      name: template.name,
      content: template.content,
      category: template.category,
      variables: JSON.parse(template.variables || '[]')
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingTemplate) {
        await axios.put(`http://localhost:8080/api/templates/${editingTemplate.id}`, formData);
      } else {
        await axios.post('http://localhost:8080/api/templates', formData);
      }
      
      setShowModal(false);
      loadTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await axios.delete(`http://localhost:8080/api/templates/${id}`);
      loadTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template');
    }
  };

  const handleUseTemplate = async (template) => {
    try {
      const variables = {};
      const varMatches = template.content.match(/{{(\w+)}}/g) || [];
      
      varMatches.forEach(match => {
        const key = match.replace(/{{|}}/g, '');
        const value = prompt(`Enter value for ${key}:`);
        if (value) variables[key] = value;
      });

      const response = await axios.post(`http://localhost:8080/api/templates/${template.id}/use`, { variables });
      
      // Copy to clipboard
      navigator.clipboard.writeText(response.data.data.message);
      alert('Message copied to clipboard!');
    } catch (error) {
      console.error('Error using template:', error);
      alert('Failed to use template');
    }
  };

  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Message Templates</h1>
          <p className="text-gray-600 mt-1">Quick replies and saved responses</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Template
        </button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        <button
          onClick={() => setSelectedCategory('all')}
          className={`px-4 py-2 rounded-lg whitespace-nowrap ${
            selectedCategory === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-white text-gray-700 hover:bg-gray-100'
          }`}
        >
          All Templates ({templates.length})
        </button>
        {categories.map(category => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-4 py-2 rounded-lg whitespace-nowrap capitalize ${
              selectedCategory === category
                ? 'bg-blue-600 text-white'
                : 'bg-white text-gray-700 hover:bg-gray-100'
            }`}
          >
            {category} ({templates.filter(t => t.category === category).length})
          </button>
        ))}
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTemplates.map(template => (
          <div key={template.id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition-shadow">
            {/* Template Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-800">{template.name}</h3>
                <span className="inline-block mt-1 px-3 py-1 bg-blue-100 text-blue-700 text-xs rounded-full capitalize">
                  {template.category}
                </span>
              </div>
              <div className="flex items-center gap-1 text-gray-500">
                <TrendingUp className="w-4 h-4" />
                <span className="text-sm">{template.usage_count || 0}</span>
              </div>
            </div>

            {/* Template Content */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <p className="text-gray-700 text-sm whitespace-pre-wrap">{template.content}</p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button
                onClick={() => handleUseTemplate(template)}
                className="flex-1 flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                <Copy className="w-4 h-4" />
                Use
              </button>
              <button
                onClick={() => handleEdit(template)}
                className="flex items-center justify-center bg-blue-100 text-blue-600 px-3 py-2 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(template.id)}
                className="flex items-center justify-center bg-red-100 text-red-600 px-3 py-2 rounded-lg hover:bg-red-200 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No templates found</h3>
          <p className="text-gray-500">Create your first template to get started</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              {editingTemplate ? 'Edit Template' : 'Create Template'}
            </h2>
            
            <form onSubmit={handleSubmit}>
              {/* Name */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Template Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Welcome Message"
                  required
                />
              </div>

              {/* Category */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat} className="capitalize">{cat}</option>
                  ))}
                </select>
              </div>

              {/* Content */}
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Message Content</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows="6"
                  placeholder="Hi {{name}}! Welcome to our support..."
                  required
                />
                <p className="text-sm text-gray-500 mt-2">
                  Use double curly braces for variables: {'{{name}}'}, {'{{order_id}}'}
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  {editingTemplate ? 'Update Template' : 'Create Template'}
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

export default TemplatesPage;