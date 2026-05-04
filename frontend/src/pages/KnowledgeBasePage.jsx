import React from 'react';
import KnowledgeBaseUpload from '../components/KnowledgeBaseUpload';

const KnowledgeBasePage = () => {
  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">AI Knowledge Base</h1>
        <p className="mt-2 text-sm text-gray-700">
          Upload documents to train your AI support agent. Supported formats include PDF, DOCX, TXT, and Markdown.
        </p>
      </div>

      <div className="mt-8">
        <KnowledgeBaseUpload />
      </div>
    </div>
  );
};

export default KnowledgeBasePage;
