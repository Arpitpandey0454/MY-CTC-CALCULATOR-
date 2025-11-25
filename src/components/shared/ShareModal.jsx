import React, { useState } from 'react';
import { X, Link, MessageCircle, Check } from 'lucide-react';
import Modal from './Modal';

const ShareModal = ({ isOpen, onClose, shareUrl }) => {
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(shareUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Failed to copy:', err);
        }
    };

    const handleWhatsApp = () => {
        const text = `Check out my salary calculation: ${shareUrl}`;
        const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Share Calculation">
            <div className="space-y-4">
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                    Share your salary breakdown with others via WhatsApp or copy the link.
                </p>

                <div className="grid grid-cols-1 gap-3">
                    <button
                        onClick={handleWhatsApp}
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-xl font-medium transition-colors"
                    >
                        <MessageCircle size={20} />
                        Share on WhatsApp
                    </button>

                    <button
                        onClick={handleCopy}
                        className="flex items-center justify-center gap-3 w-full py-3 px-4 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-medium transition-colors border border-gray-200 dark:border-gray-700"
                    >
                        {copied ? <Check size={20} className="text-green-600" /> : <Link size={20} />}
                        {copied ? 'Link Copied!' : 'Copy Link'}
                    </button>
                </div>

                <div className="mt-2">
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-500 uppercase tracking-wider">Share Link</label>
                    <div className="mt-1 flex items-center gap-2 p-2 bg-gray-50 dark:bg-gray-900/50 rounded-lg border border-gray-200 dark:border-gray-700">
                        <input
                            type="text"
                            readOnly
                            value={shareUrl}
                            className="flex-1 bg-transparent text-sm text-gray-600 dark:text-gray-400 focus:outline-none"
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
};

export default ShareModal;
