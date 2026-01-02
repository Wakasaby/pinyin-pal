import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ChevronRight, Copy } from 'lucide-react';
import moment from 'moment';
import { toast } from 'sonner';

export default function ScanHistory({ history, onSelect, onClear }) {
    if (!history || history.length === 0) return null;

    const copyCharacters = (e, item) => {
        e.stopPropagation();
        const text = item.results.map(r => r.character).join('');
        navigator.clipboard.writeText(text);
        toast.success('Characters copied');
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
        >
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2 text-white/60">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm font-medium tracking-wide uppercase">Recent Scans</span>
                </div>
                <button
                    onClick={onClear}
                    className="text-white/40 hover:text-white/70 active:text-white text-xs flex items-center gap-1 transition-colors min-h-[44px] px-2"
                >
                    <Trash2 className="w-3 h-3" />
                    Clear all
                </button>
            </div>
            
            <div className="space-y-2">
                <AnimatePresence>
                    {history.map((item, index) => (
                        <motion.button
                            key={item.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: index * 0.05 }}
                            onClick={() => onSelect(item)}
                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/10 transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-2xl text-white/90">
                                    {item.preview}
                                </div>
                                <div className="text-left">
                                    <div className="text-orange-400/80 text-sm">
                                        {item.pinyinPreview}
                                    </div>
                                    <div className="text-white/30 text-xs">
                                        {moment(item.timestamp).fromNow()}
                                    </div>
                                </div>
                                </div>
                                <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => copyCharacters(e, item)}
                                    className="p-2 min-w-[44px] min-h-[44px] rounded-lg hover:bg-white/10 active:bg-white/20 text-white/40 hover:text-white/70 transition-colors flex items-center justify-center"
                                >
                                    <Copy className="w-5 h-5" />
                                </button>
                                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                                </div>
                                </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}