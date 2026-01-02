import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Download, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnotatedImage({ imageData, results, onClose, onRetry }) {
    const [imageLoaded, setImageLoaded] = useState(false);

    const downloadImage = () => {
        const link = document.createElement('a');
        link.href = imageData;
        link.download = `pinyin-${Date.now()}.jpg`;
        link.click();
        toast.success('Image saved');
    };

    // Group characters that appear consecutively
    const groupedResults = results.reduce((groups, char, idx) => {
        if (idx === 0 || groups.length === 0) {
            groups.push([char]);
        } else {
            const lastGroup = groups[groups.length - 1];
            // Add to last group if it's reasonably sized
            if (lastGroup.length < 8) {
                lastGroup.push(char);
            } else {
                groups.push([char]);
            }
        }
        return groups;
    }, []);

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-sm"
        >
            <div className="h-full flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/5">
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                    <span className="text-white/70 text-sm font-medium">
                        {results.length} character{results.length > 1 ? 's' : ''} detected
                    </span>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={downloadImage}
                            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                        >
                            <Download className="w-5 h-5" />
                        </button>
                        <button
                            onClick={onRetry}
                            className="p-2 rounded-full hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                        >
                            <RotateCcw className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Image with overlay */}
                <div className="flex-1 overflow-auto p-4">
                    <div className="max-w-2xl mx-auto relative">
                        <img
                            src={imageData}
                            alt="Captured"
                            onLoad={() => setImageLoaded(true)}
                            className="w-full rounded-2xl shadow-2xl"
                        />
                        
                        {imageLoaded && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.3 }}
                                className="absolute inset-0 pointer-events-none"
                            >
                                {/* Overlay with pinyin annotations */}
                                <div className="absolute inset-0 flex flex-col justify-center items-center gap-6 p-8">
                                    {groupedResults.map((group, groupIdx) => (
                                        <motion.div
                                            key={groupIdx}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.4 + groupIdx * 0.1 }}
                                            className="bg-slate-900/90 backdrop-blur-md rounded-2xl p-4 border border-white/10 shadow-2xl"
                                        >
                                            {/* Pinyin row */}
                                            <div className="flex justify-center gap-4 mb-2">
                                                {group.map((char, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-orange-400 font-medium text-lg min-w-[2rem] text-center"
                                                    >
                                                        {char.pinyin}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Characters row */}
                                            <div className="flex justify-center gap-4">
                                                {group.map((char, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-white text-3xl font-light min-w-[2rem] text-center"
                                                    >
                                                        {char.character}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Meanings (if available) */}
                                            {group.some(c => c.meaning) && (
                                                <div className="flex justify-center gap-4 mt-2 text-white/50 text-xs">
                                                    {group.map((char, idx) => (
                                                        <div
                                                            key={idx}
                                                            className="min-w-[2rem] text-center truncate max-w-[4rem]"
                                                            title={char.meaning}
                                                        >
                                                            {char.meaning}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </motion.div>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Bottom instruction */}
                <div className="p-4 border-t border-white/5 text-center text-white/40 text-sm">
                    Pinyin displayed above each character
                </div>
            </div>
        </motion.div>
    );
}