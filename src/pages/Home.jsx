import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Info } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import CameraView from '@/components/CameraView';
import ResultDisplay from '@/components/ResultDisplay';
import ScanHistory from '@/components/ScanHistory';

export default function Home() {
    const [isProcessing, setIsProcessing] = useState(false);
    const [results, setResults] = useState([]);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const saved = localStorage.getItem('pinyinHistory');
        if (saved) {
            setHistory(JSON.parse(saved));
        }
    }, []);

    const saveToHistory = (newResults, translation) => {
        if (!newResults || newResults.length === 0) return;
        
        const historyItem = {
            id: Date.now(),
            preview: newResults.slice(0, 5).map(r => r.character).join(''),
            pinyinPreview: newResults.slice(0, 5).map(r => r.pinyin).join(' '),
            results: newResults,
            translation: translation,
            timestamp: new Date().toISOString()
        };
        
        const newHistory = [historyItem, ...history].slice(0, 10);
        setHistory(newHistory);
        localStorage.setItem('pinyinHistory', JSON.stringify(newHistory));
    };

    const handleCapture = async (imageData) => {
        setIsProcessing(true);
        setResults([]);
        
        try {
            // Convert base64 to blob for upload
            const response = await fetch(imageData);
            const blob = await response.blob();
            const file = new File([blob], 'capture.jpg', { type: 'image/jpeg' });
            
            // Upload the image
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            // Use LLM with vision to detect Chinese characters and get pinyin
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Analyze this image and identify ALL Chinese characters visible in it. 
                
For each Chinese character found, provide:
1. The character itself
2. Its pinyin with tone marks (e.g., nǐ, hǎo, shì)
3. A brief English meaning

IMPORTANT: 
- Only include actual Chinese characters (汉字), not punctuation or other symbols
- If no Chinese characters are found, return an empty array
- Be thorough and identify every Chinese character visible
- Include traditional and simplified characters`,
                file_urls: [file_url],
                response_json_schema: {
                    type: "object",
                    properties: {
                        characters: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    character: { type: "string", description: "The Chinese character" },
                                    pinyin: { type: "string", description: "Pinyin with tone marks" },
                                    meaning: { type: "string", description: "Brief English meaning" }
                                },
                                required: ["character", "pinyin"]
                            }
                        },
                        detected_text: { type: "string", description: "Full text detected in image" },
                        translation: { type: "string", description: "English translation of the full phrase/text" }
                    },
                    required: ["characters"]
                }
            });
            
            if (result.characters && result.characters.length > 0) {
                saveToHistory(result.characters, result.translation);
                toast.success(`Found ${result.characters.length} Chinese character${result.characters.length > 1 ? 's' : ''}. Check recent scans below.`);
            } else {
                toast.info('No Chinese characters detected in the image');
            }
        } catch (error) {
            console.error('OCR Error:', error);
            toast.error('Failed to process image. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    const clearResults = () => {
        setResults([]);
    };

    const clearHistory = () => {
        setHistory([]);
        localStorage.removeItem('pinyinHistory');
        toast.success('History cleared');
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
            {/* Ambient background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 -left-32 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl" />
            </div>
            
            <div className="relative z-10 max-w-lg mx-auto px-4 py-8 pb-24">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 mb-4">
                        <Sparkles className="w-4 h-4 text-orange-400" />
                        <span className="text-white/70 text-sm">AI-Powered OCR</span>
                    </div>
                    <h1 className="text-4xl font-light text-white tracking-tight mb-2">
                        Pinyin <span className="text-orange-400">Reader</span>
                    </h1>
                    <p className="text-white/50 text-sm">
                        Point your camera at Chinese text to see pinyin
                    </p>
                </motion.div>
                
                {/* Camera */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 }}
                >
                    <CameraView 
                        onCapture={handleCapture} 
                        isProcessing={isProcessing}
                    />
                </motion.div>
                
                {/* Instructions */}
                {results.length === 0 && !isProcessing && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.3 }}
                        className="flex items-start gap-3 mt-6 p-4 rounded-2xl bg-white/5 border border-white/5"
                    >
                        <Info className="w-5 h-5 text-orange-400/60 flex-shrink-0 mt-0.5" />
                        <div className="text-white/50 text-sm leading-relaxed">
                            Position Chinese text within the frame and tap the capture button. 
                            The AI will identify characters and show their pinyin pronunciation.
                        </div>
                    </motion.div>
                )}
                
                {/* Results */}
                <ResultDisplay 
                    results={Array.isArray(results) ? results : results.results}
                    translation={results.translation}
                    onClear={clearResults}
                />
                
                {/* History */}
                <ScanHistory 
                    history={history}
                    onSelect={(item) => setResults(item)}
                    onClear={clearHistory}
                />
            </div>
        </div>
    );
}