import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, Loader2, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function CameraView({ onCapture, isProcessing }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [realtimeAnnotations, setRealtimeAnnotations] = useState([]);
    const [isScanning, setIsScanning] = useState(false);
    const [showAnnotations, setShowAnnotations] = useState(true);
    const scanIntervalRef = useRef(null);
    const lastScanTimeRef = useRef(0);

    const startCamera = async (facing) => {
        setIsLoading(true);
        setError(null);
        
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }

        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facing,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                }
            });
            
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                setStream(mediaStream);
            }
        } catch (err) {
            console.error('Camera error:', err);
            setError('Unable to access camera. Please ensure camera permissions are granted.');
        } finally {
            setIsLoading(false);
        }
    };

    const scanFrame = async () => {
        if (!videoRef.current || !canvasRef.current || isProcessing) return;
        
        // Throttle scans to every 3 seconds minimum
        const now = Date.now();
        if (now - lastScanTimeRef.current < 3000) return;
        lastScanTimeRef.current = now;
        
        setIsScanning(true);
        
        try {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            
            const imageData = canvas.toDataURL('image/jpeg', 0.7);
            
            // Convert to blob for upload
            const response = await fetch(imageData);
            const blob = await response.blob();
            const file = new File([blob], 'scan.jpg', { type: 'image/jpeg' });
            
            const { file_url } = await base44.integrations.Core.UploadFile({ file });
            
            const result = await base44.integrations.Core.InvokeLLM({
                prompt: `Quickly identify ALL Chinese characters in this image. For each character provide:
1. The character
2. Its pinyin with tone marks

Return only characters that are clearly visible. If no Chinese characters found, return empty array.`,
                file_urls: [file_url],
                response_json_schema: {
                    type: "object",
                    properties: {
                        characters: {
                            type: "array",
                            items: {
                                type: "object",
                                properties: {
                                    character: { type: "string" },
                                    pinyin: { type: "string" }
                                },
                                required: ["character", "pinyin"]
                            }
                        }
                    },
                    required: ["characters"]
                }
            });
            
            if (result.characters && result.characters.length > 0) {
                setRealtimeAnnotations(result.characters);
            }
        } catch (error) {
            console.error('Realtime scan error:', error);
        } finally {
            setIsScanning(false);
        }
    };

    useEffect(() => {
        startCamera(facingMode);
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
            if (scanIntervalRef.current) {
                clearInterval(scanIntervalRef.current);
            }
        };
    }, [facingMode]);

    // Start continuous scanning when camera is ready
    useEffect(() => {
        if (!isLoading && !error && showAnnotations) {
            // Initial scan after 1 second
            const timeout = setTimeout(() => {
                scanFrame();
            }, 1000);
            
            // Set up interval for continuous scanning
            scanIntervalRef.current = setInterval(() => {
                scanFrame();
            }, 4000); // Scan every 4 seconds
            
            return () => {
                clearTimeout(timeout);
                if (scanIntervalRef.current) {
                    clearInterval(scanIntervalRef.current);
                }
            };
        }
    }, [isLoading, error, isProcessing, showAnnotations]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
    };

    const toggleCamera = () => {
        setRealtimeAnnotations([]);
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const toggleAnnotations = () => {
        setShowAnnotations(prev => !prev);
        if (showAnnotations) {
            setRealtimeAnnotations([]);
        }
    };

    // Group characters for display
    const groupedAnnotations = realtimeAnnotations.reduce((groups, char, idx) => {
        if (idx === 0 || groups.length === 0) {
            groups.push([char]);
        } else {
            const lastGroup = groups[groups.length - 1];
            if (lastGroup.length < 6) {
                lastGroup.push(char);
            } else {
                groups.push([char]);
            }
        }
        return groups;
    }, []);

    return (
        <div className="relative w-full aspect-[3/4] max-h-[70vh] rounded-3xl overflow-hidden bg-slate-900/50 backdrop-blur-sm border border-white/10">
            {error ? (
                <div className="absolute inset-0 flex items-center justify-center p-6 text-center">
                    <div className="text-white/70 text-sm">{error}</div>
                </div>
            ) : (
                <>
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        onLoadedMetadata={() => setIsLoading(false)}
                        className="w-full h-full object-cover"
                    />
                    
                    {isLoading && (
                        <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
                            <Loader2 className="w-8 h-8 text-white/50 animate-spin" />
                        </div>
                    )}
                    
                    {/* Scan overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <div className="absolute inset-8 border-2 border-white/20 rounded-2xl" />
                        <div className="absolute top-8 left-8 w-8 h-8 border-l-2 border-t-2 border-orange-400 rounded-tl-lg" />
                        <div className="absolute top-8 right-8 w-8 h-8 border-r-2 border-t-2 border-orange-400 rounded-tr-lg" />
                        <div className="absolute bottom-8 left-8 w-8 h-8 border-l-2 border-b-2 border-orange-400 rounded-bl-lg" />
                        <div className="absolute bottom-8 right-8 w-8 h-8 border-r-2 border-b-2 border-orange-400 rounded-br-lg" />
                        
                        {/* Scanning indicator */}
                        {isScanning && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/20 backdrop-blur-md border border-orange-400/30"
                            >
                                <Loader2 className="w-3 h-3 text-orange-400 animate-spin" />
                                <span className="text-orange-400 text-xs font-medium">Scanning...</span>
                            </motion.div>
                        )}
                        
                        {/* Real-time annotations */}
                        <AnimatePresence>
                            {showAnnotations && groupedAnnotations.length > 0 && (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="absolute inset-0 flex flex-col justify-center items-center gap-3 p-12"
                                >
                                    {groupedAnnotations.map((group, groupIdx) => (
                                        <motion.div
                                            key={groupIdx}
                                            initial={{ opacity: 0, scale: 0.9 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            transition={{ delay: groupIdx * 0.05 }}
                                            className="bg-slate-900/80 backdrop-blur-md rounded-xl px-4 py-3 border border-orange-400/30 shadow-lg"
                                        >
                                            {/* Pinyin row */}
                                            <div className="flex justify-center gap-3 mb-1">
                                                {group.map((char, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-orange-400 font-medium text-sm min-w-[1.5rem] text-center"
                                                    >
                                                        {char.pinyin}
                                                    </div>
                                                ))}
                                            </div>
                                            {/* Characters row */}
                                            <div className="flex justify-center gap-3">
                                                {group.map((char, idx) => (
                                                    <div
                                                        key={idx}
                                                        className="text-white text-2xl font-light min-w-[1.5rem] text-center"
                                                    >
                                                        {char.character}
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleAnnotations}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
                    >
                        {showAnnotations ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
                    </motion.button>
                    
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={toggleCamera}
                        className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
                    >
                        <SwitchCamera className="w-5 h-5" />
                    </motion.button>
                </div>
                
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleCapture}
                    disabled={isProcessing || isLoading || error}
                    className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isProcessing ? (
                        <Loader2 className="w-8 h-8 text-white animate-spin" />
                    ) : (
                        <Camera className="w-8 h-8 text-white" />
                    )}
                </motion.button>
                
                <div className="w-12 h-12" /> {/* Spacer for balance */}
            </div>
        </div>
    );
}