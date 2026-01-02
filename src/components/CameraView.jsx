import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, Loader2, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Slider } from "@/components/ui/slider";

export default function CameraView({ onCapture, isProcessing }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [scanAreaHeight, setScanAreaHeight] = useState(30); // Percentage of height

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

    useEffect(() => {
        startCamera(facingMode);
        
        return () => {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [facingMode]);

    const handleCapture = () => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        // Calculate the crop area - wide rectangle (full width, adjustable height)
        const videoWidth = video.videoWidth;
        const videoHeight = video.videoHeight;
        const horizontalPadding = videoWidth * 0.05; // 5% padding on sides
        const cropWidth = videoWidth - (horizontalPadding * 2);
        const cropHeight = videoHeight * (scanAreaHeight / 100);
        const cropX = horizontalPadding;
        const cropY = (videoHeight - cropHeight) / 2;
        
        // Set canvas to cropped size
        canvas.width = cropWidth;
        canvas.height = cropHeight;
        
        // Draw only the cropped portion
        ctx.drawImage(
            video,
            cropX, cropY, cropWidth, cropHeight,  // Source rectangle
            0, 0, cropWidth, cropHeight            // Destination rectangle
        );
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

    const adjustScanArea = (delta) => {
        setScanAreaHeight(prev => Math.max(15, Math.min(100, prev + delta)));
    };

    const resetScanArea = () => {
        setScanAreaHeight(30);
    };

    return (
        <div className="space-y-4">
            {/* Scan Area Controls */}
            <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/5 backdrop-blur-xl rounded-2xl border border-white/10 p-4"
            >
                <div className="flex items-center justify-between mb-3">
                    <span className="text-white/70 text-sm font-medium">Frame Height</span>
                    <button
                        onClick={resetScanArea}
                        className="text-orange-400/70 hover:text-orange-400 text-xs flex items-center gap-1 transition-colors"
                    >
                        <Maximize2 className="w-3 h-3" />
                        Reset
                    </button>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => adjustScanArea(-5)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                    >
                        <ZoomOut className="w-4 h-4" />
                    </button>
                    <Slider
                        value={[scanAreaHeight]}
                        onValueChange={(value) => setScanAreaHeight(value[0])}
                        min={15}
                        max={100}
                        step={5}
                        className="flex-1"
                    />
                    <button
                        onClick={() => adjustScanArea(5)}
                        className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/90 transition-colors"
                    >
                        <ZoomIn className="w-4 h-4" />
                    </button>
                </div>
                <div className="mt-2 text-center">
                    <span className="text-orange-400 text-xs font-medium">{scanAreaHeight}%</span>
                    <span className="text-white/40 text-xs ml-1">of screen height</span>
                </div>
            </motion.div>

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
                    
                    {/* Scan overlay with wide rectangle */}
                    <div className="absolute inset-0 pointer-events-none">
                        {/* Darkened areas outside scan zone - horizontal letterbox */}
                        <div 
                            className="absolute inset-0 transition-all duration-300"
                            style={{
                                background: `
                                    linear-gradient(to bottom,
                                        rgba(0,0,0,0.7) 0%,
                                        rgba(0,0,0,0.7) ${(100 - scanAreaHeight) / 2}%,
                                        transparent ${(100 - scanAreaHeight) / 2}%,
                                        transparent ${50 + scanAreaHeight / 2}%,
                                        rgba(0,0,0,0.7) ${50 + scanAreaHeight / 2}%,
                                        rgba(0,0,0,0.7) 100%
                                    )
                                `
                            }}
                        />
                        
                        {/* Active scan frame - wide rectangle */}
                        <motion.div 
                            className="absolute border-2 border-orange-400/60 rounded-xl transition-all duration-300"
                            style={{
                                left: '5%',
                                right: '5%',
                                top: `${(100 - scanAreaHeight) / 2}%`,
                                bottom: `${(100 - scanAreaHeight) / 2}%`,
                            }}
                            animate={{
                                boxShadow: [
                                    '0 0 0px rgba(251, 146, 60, 0.3)',
                                    '0 0 20px rgba(251, 146, 60, 0.5)',
                                    '0 0 0px rgba(251, 146, 60, 0.3)',
                                ]
                            }}
                            transition={{
                                duration: 2,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        >
                            {/* Corner indicators - thinner for wide rectangle */}
                            <div className="absolute -top-1 -left-1 w-8 h-5 border-l-4 border-t-4 border-orange-400 rounded-tl-lg" />
                            <div className="absolute -top-1 -right-1 w-8 h-5 border-r-4 border-t-4 border-orange-400 rounded-tr-lg" />
                            <div className="absolute -bottom-1 -left-1 w-8 h-5 border-l-4 border-b-4 border-orange-400 rounded-bl-lg" />
                            <div className="absolute -bottom-1 -right-1 w-8 h-5 border-r-4 border-b-4 border-orange-400 rounded-br-lg" />
                            
                            {/* Center line indicator */}
                            <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-0.5 bg-orange-400/40" />
                        </motion.div>
                    </div>
                </>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Controls */}
            <div className="absolute bottom-6 left-0 right-0 flex items-center justify-center gap-6">
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={toggleCamera}
                    className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white/80 hover:bg-white/20 transition-colors"
                >
                    <SwitchCamera className="w-5 h-5" />
                </motion.button>
                
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
        </div>
    );
}