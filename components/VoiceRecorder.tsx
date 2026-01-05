import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Trash2 } from 'lucide-react';

interface VoiceRecorderProps {
    onRecordingComplete: (audioBase64: string | null) => void;
    hasRecording: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
    onRecordingComplete,
    hasRecording
}) => {
    const [isRecording, setIsRecording] = useState(false);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const [recordingTime, setRecordingTime] = useState(0);
    const [error, setError] = useState<string | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<number | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    const MAX_RECORDING_TIME = 60; // 60 seconds max

    useEffect(() => {
        return () => {
            if (timerRef.current) clearInterval(timerRef.current);
            if (audioUrl) URL.revokeObjectURL(audioUrl);
        };
    }, [audioUrl]);

    const startRecording = async () => {
        try {
            setError(null);
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });

            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                const url = URL.createObjectURL(audioBlob);
                setAudioUrl(url);

                stream.getTracks().forEach(track => track.stop());

                // Convert to base64 and pass to parent
                const reader = new FileReader();
                reader.onloadend = () => {
                    const base64 = reader.result as string;
                    onRecordingComplete(base64);
                };
                reader.readAsDataURL(audioBlob);
            };

            mediaRecorder.start(1000);
            setIsRecording(true);
            setRecordingTime(0);

            timerRef.current = window.setInterval(() => {
                setRecordingTime(prev => {
                    if (prev >= MAX_RECORDING_TIME - 1) {
                        stopRecording();
                        return MAX_RECORDING_TIME;
                    }
                    return prev + 1;
                });
            }, 1000);

        } catch (err: any) {
            console.error('Failed to start recording:', err);
            setError('Microphone access denied. Please allow microphone permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
            if (timerRef.current) {
                clearInterval(timerRef.current);
                timerRef.current = null;
            }
        }
    };

    const clearRecording = () => {
        if (audioUrl) {
            URL.revokeObjectURL(audioUrl);
        }
        setAudioUrl(null);
        setRecordingTime(0);
        audioChunksRef.current = [];
        onRecordingComplete(null);
    };

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="flex items-center gap-3">
            {!audioUrl ? (
                <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium transition ${isRecording
                            ? 'bg-red-600 text-white animate-pulse'
                            : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                        }`}
                >
                    {isRecording ? (
                        <>
                            <Square size={16} fill="white" />
                            <span>{formatTime(recordingTime)}</span>
                        </>
                    ) : (
                        <>
                            <Mic size={16} />
                            <span>Record Voice</span>
                        </>
                    )}
                </button>
            ) : (
                <div className="flex items-center gap-2">
                    <audio ref={audioRef} src={audioUrl} className="hidden" />
                    <button
                        type="button"
                        onClick={() => audioRef.current?.play()}
                        className="flex items-center gap-2 px-4 py-2.5 bg-green-600 text-white rounded-xl font-medium hover:bg-green-500"
                    >
                        <Play size={16} /> Play
                    </button>
                    <button
                        type="button"
                        onClick={clearRecording}
                        className="p-2.5 bg-slate-700 text-slate-300 rounded-xl hover:bg-slate-600"
                    >
                        <Trash2 size={16} />
                    </button>
                    <span className="text-green-400 text-sm">✓ Voice recorded</span>
                </div>
            )}

            {error && (
                <span className="text-red-400 text-sm">{error}</span>
            )}
        </div>
    );
};
