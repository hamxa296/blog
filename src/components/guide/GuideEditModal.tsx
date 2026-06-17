import React from 'react';
import type { GuideEditForm } from '../../types/guide';

interface GuideEditModalProps {
  editForm: GuideEditForm;
  editingSectionId: string;
  onClose: () => void;
  onSave: () => void;
  onFormChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onFaqChange: (index: number, field: 'question' | 'answer', value: string) => void;
  onAddFaq: () => void;
  onRemoveFaq: (index: number) => void;
  onWarningChange: (index: number, value: string) => void;
  onAddWarning: () => void;
  onRemoveWarning: (index: number) => void;
}

export const GuideEditModal: React.FC<GuideEditModalProps> = ({
  editForm,
  editingSectionId,
  onClose,
  onSave,
  onFormChange,
  onFaqChange,
  onAddFaq,
  onRemoveFaq,
  onWarningChange,
  onAddWarning,
  onRemoveWarning,
}) => {
  const isJsonSection =
    editingSectionId === 'important-contacts' || editingSectionId === 'societies-events';

  return (
    <div className="fixed inset-0 bg-gray-600/75 flex items-center justify-center p-4 z-50">
      <div className="bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full p-6 sm:p-8 max-h-[90vh] overflow-y-auto border border-gray-600">
        <div className="flex justify-between items-center border-b border-gray-600 pb-4 mb-4">
          <h3 className="text-2xl font-serif font-bold text-blue-400">Edit {editForm.tag}</h3>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Close edit modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Tag</label>
            <input
              type="text"
              name="tag"
              value={editForm.tag}
              onChange={onFormChange}
              className="w-full p-2 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Short Description</label>
            <textarea
              name="shortDescription"
              value={editForm.shortDescription}
              onChange={onFormChange}
              rows={2}
              className="w-full p-2 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-100"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Full Content ({isJsonSection ? 'JSON formatted content' : 'Plain Text'})
            </label>
            <textarea
              name="fullContent"
              value={editForm.fullContent}
              onChange={onFormChange}
              rows={6}
              className="w-full p-2 border border-gray-600 rounded-md focus:ring-blue-500 focus:border-blue-500 bg-gray-700 text-gray-100 font-mono text-sm"
            />
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">FAQs</label>
              <button
                type="button"
                onClick={onAddFaq}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors shadow-md"
              >
                Add FAQ
              </button>
            </div>
            {editForm.faqs.map((faq, index) => (
              <div key={index} className="flex space-x-2 mb-2 p-2 bg-gray-700 rounded-md border border-gray-600">
                <input
                  type="text"
                  placeholder="Question"
                  value={faq.question}
                  onChange={(e) => onFaqChange(index, 'question', e.target.value)}
                  className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-600 text-gray-100"
                />
                <input
                  type="text"
                  placeholder="Answer"
                  value={faq.answer}
                  onChange={(e) => onFaqChange(index, 'answer', e.target.value)}
                  className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-600 text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => onRemoveFaq(index)}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Remove FAQ"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.381 21H7.618a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m10 0H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium text-gray-300">Warnings</label>
              <button
                type="button"
                onClick={onAddWarning}
                className="bg-blue-600 text-white px-3 py-1 rounded-md text-sm hover:bg-blue-700 transition-colors shadow-md"
              >
                Add Warning
              </button>
            </div>
            {editForm.warnings.map((warning, index) => (
              <div key={index} className="flex space-x-2 mb-2 p-2 bg-gray-700 rounded-md border border-gray-600">
                <input
                  type="text"
                  placeholder="Warning message"
                  value={warning}
                  onChange={(e) => onWarningChange(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-600 rounded-md bg-gray-600 text-gray-100"
                />
                <button
                  type="button"
                  onClick={() => onRemoveWarning(index)}
                  className="text-red-400 hover:text-red-300"
                  aria-label="Remove warning"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.381 21H7.618a2 2 0 01-1.993-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1H9a1 1 0 00-1 1v3m10 0H4" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
          <div className="flex justify-end space-x-4 pt-4 border-t border-gray-600">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-bold text-gray-300 border border-gray-600 hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onSave}
              className="px-4 py-2 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
