import React, { useRef, useEffect, useState } from 'react';
import { Button } from "@/components/ui/button";
import { Camera, SwitchCamera, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CameraView({ onCapture, isProcessing }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const [stream, setStream] = useState(null);
    const [facingMode, setFacingMode] = useState('environment');
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

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
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        const imageData = canvas.toDataURL('image/jpeg', 0.9);
        onCapture(imageData);
    };

    const toggleCamera = () => {
        setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    };

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
    );
}