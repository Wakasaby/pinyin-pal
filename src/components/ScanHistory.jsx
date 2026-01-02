import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trash2, ChevronRight } from 'lucide-react';
import moment from 'moment';

export default function ScanHistory({ history, onSelect, onClear }) {
    if (!history || history.length === 0) return null;

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
                    className="text-white/40 hover:text-white/70 text-xs flex items-center gap-1 transition-colors"
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
                            onClick={() => onSelect(item.results)}
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
                            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/50 transition-colors" />
                        </motion.button>
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
}