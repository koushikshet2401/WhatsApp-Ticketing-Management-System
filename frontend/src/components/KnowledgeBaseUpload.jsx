import React, { useState, useEffect } from 'react';
import { Upload, File, Trash2, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import axios from 'axios';

const KnowledgeBaseUpload = () => {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

  // Load existing documents
  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API_URL}/api/knowledge-base/documents`);
      setUploadedDocs(response.data.documents);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      alert('Please select files to upload');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });

    try {
      await axios.post(
        `${API_URL}/api/knowledge-base/upload`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      alert('Documents uploaded successfully!');
      setFiles([]);
      loadDocuments();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Upload failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (filename) => {
    if (!confirm(`Delete ${filename}?`)) return;

    try {
      await axios.delete(`${API_URL}/api/knowledge-base/documents/${filename}`);
      alert('Document deleted successfully!');
      loadDocuments();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Delete failed');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg border border-gray-100">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Knowledge Base</h2>
          <p className="text-gray-500 mt-1">Manage documents that AI uses to answer customer queries.</p>
        </div>
        <div className="bg-primary-50 p-3 rounded-full">
          <File className="w-8 h-8 text-primary-600" />
        </div>
      </div>

      {/* Upload Section */}
      <div className="mb-10">
        <h3 className="text-lg font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Upload className="w-5 h-5 text-primary-500" />
          Upload New Documents
        </h3>
        
        <div className="relative border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center hover:border-primary-400 transition-colors group">
          <input
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md"
            onChange={handleFileSelect}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            id="file-upload"
          />
          
          <div className="flex flex-col items-center">
            <div className="w-16 h-16 bg-primary-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Upload className="w-8 h-8 text-primary-600" />
            </div>
            <p className="text-gray-600 font-medium mb-1">
              Click to upload or drag and drop
            </p>
            <p className="text-xs text-gray-400">
              Supported: PDF, DOCX, TXT, MD (Max 10MB per file)
            </p>
          </div>

          {files.length > 0 && (
            <div className="mt-8 p-4 bg-gray-50 rounded-xl border border-gray-100 text-left">
              <p className="text-sm font-semibold text-gray-700 mb-3 px-1">
                Selected Files ({files.length}):
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {files.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200 text-sm overflow-hidden">
                    <File className="w-4 h-4 text-gray-400 flex-shrink-0" />
                    <span className="truncate text-gray-600">{file.name}</span>
                  </div>
                ))}
              </div>
              
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="w-full mt-4 bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 disabled:bg-primary-300 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Processing & Embedding...
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Train AI on these Files
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Uploaded Documents List */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-700">Trained Documents</h3>
          <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs font-bold rounded-full uppercase tracking-wider">
            {uploadedDocs.length} Total
          </span>
        </div>
        
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <Loader2 className="w-10 h-10 text-primary-600 animate-spin mb-4" />
            <p className="text-gray-500 font-medium">Loading knowledge base...</p>
          </div>
        ) : uploadedDocs.length === 0 ? (
          <div className="text-center py-20 bg-gray-50 rounded-2xl border border-gray-100">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
              <File className="w-8 h-8 text-gray-300" />
            </div>
            <p className="text-gray-500 font-medium">No documents uploaded yet</p>
            <p className="text-sm text-gray-400 mt-1">Upload files to get started with AI automation.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {uploadedDocs.map((doc) => (
              <div
                key={doc.id}
                className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl hover:border-primary-200 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-primary-50 rounded-lg flex items-center justify-center group-hover:bg-primary-100 transition-colors">
                    <File className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{doc.filename}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-gray-400">
                        {new Date(doc.uploaded_at).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                      <span className="text-gray-300">•</span>
                      <span className="text-xs font-medium text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                        {doc.chunks_count} AI Chunks
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-1 px-3 py-1 bg-green-50 text-green-700 rounded-full text-xs font-bold border border-green-100">
                    <CheckCircle className="w-3 h-3" />
                    READY
                  </div>
                  
                  <button
                    onClick={() => handleDelete(doc.filename)}
                    className="p-2.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                    title="Delete document"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Card */}
      <div className="mt-10 p-5 bg-gradient-to-br from-primary-600 to-primary-800 rounded-2xl text-white shadow-lg">
        <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
          <AlertCircle className="w-5 h-5" />
          AI Automation Active
        </h4>
        <p className="text-primary-50 text-sm leading-relaxed opacity-90">
          The AI system is now training on these documents. When customers ask questions, the system will search through this content and respond as "Priya" (Human Agent). If the AI is unsure, it will automatically notify you via SMS/WhatsApp.
        </p>
      </div>
    </div>
  );
};

export default KnowledgeBaseUpload;
