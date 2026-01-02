import React, { useRef } from 'react';
import { Upload, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function UploadButton({ onUpload, isProcessing }) {
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = () => {
            onUpload(reader.result);
        };
        reader.readAsDataURL(file);
        
        // Reset input
        e.target.value = '';
    };

    return (
        <>
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
            />
            <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-orange-400/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {isProcessing ? (
                    <>
                        <Loader2 className="w-5 h-5 text-orange-400 animate-spin" />
                        <span className="text-white/70 font-medium">Processing...</span>
                    </>
                ) : (
                    <>
                        <Upload className="w-5 h-5 text-orange-400" />
                        <span className="text-white/70 font-medium">Upload Photo</span>
                    </>
                )}
            </motion.button>
        </>
    );
}