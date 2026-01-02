import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, Copy, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ResultDisplay({ results, translation, onClear }) {
    if (!results || results.length === 0) return null;

    const copyToClipboard = () => {
        const text = results.map(r => `${r.character} (${r.pinyin})`).join(' ');
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard');
    };

    const speak = (text) => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'zh-CN';
        speechSynthesis.speak(utterance);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white/5 backdrop-blur-xl rounded-3xl border border-white/10 p-6 mt-6"
        >
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-white/90 font-medium text-sm tracking-wide uppercase">
                    Detected Characters
                </h3>
                <div className="flex items-center gap-2">
                    <button
                        onClick={copyToClipboard}
                        className="p-2 min-w-[44px] min-h-[44px] rounded-full hover:bg-white/10 active:bg-white/20 text-white/60 hover:text-white/90 transition-colors flex items-center justify-center"
                    >
                        <Copy className="w-5 h-5" />
                    </button>
                    <button
                        onClick={onClear}
                        className="p-2 min-w-[44px] min-h-[44px] rounded-full hover:bg-white/10 active:bg-white/20 text-white/60 hover:text-white/90 transition-colors flex items-center justify-center"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-3">
                <AnimatePresence>
                    {results.map((item, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => speak(item.character)}
                            className="group relative bg-gradient-to-br from-slate-800/80 to-slate-900/80 rounded-2xl p-4 border border-white/5 hover:border-orange-400/30 transition-all cursor-pointer hover:shadow-lg hover:shadow-orange-500/10"
                        >
                            <div className="text-4xl text-white mb-2 font-light tracking-wide">
                                {item.character}
                            </div>
                            <div className="text-orange-400 text-lg font-medium">
                                {item.pinyin}
                            </div>
                            {item.meaning && (
                                <div className="text-white/50 text-xs mt-1">
                                    {item.meaning}
                                </div>
                            )}
                            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Volume2 className="w-4 h-4 text-orange-400/60" />
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {translation && (
                <div className="mt-6 pt-4 border-t border-white/5">
                    <div className="text-white/40 text-xs uppercase tracking-wide mb-2">Full Translation</div>
                    <div className="text-white/80 text-sm leading-relaxed">{translation}</div>
                </div>
            )}
            </motion.div>
    );
}