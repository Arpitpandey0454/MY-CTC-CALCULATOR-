import React, { useState } from 'react';
import { Share2, Check } from 'lucide-react';
import Button from './Button';

const ShareButton = ({ onClick, className = "" }) => {
    const [copied, setCopied] = useState(false);

    const handleClick = async () => {
        const success = await onClick();
        if (success) {
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    return (
        <Button
            onClick={handleClick}
            variant="secondary"
            className={`flex items-center justify-center gap-2 ${className}`}
        >
            {copied ? <Check size={18} className="text-green-600" /> : <Share2 size={18} />}
            {copied ? 'Copied!' : 'Share'}
        </Button>
    );
};

export default ShareButton;
