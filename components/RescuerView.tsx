import React, { useState, useEffect, useRef } from 'react';
import { Phone, MapPin, CheckCircle, Navigation, BrainCircuit, X, Camera, Loader2, List, Filter, Clock, MessageCircle, Plus, ArrowLeft } from 'lucide-react';
import { SOSRequest, Severity, Status, AIAnalysisResult, UserRole } from '../types';
import { RescueStore, AuthService } from '../services/firebase';
import { analyzeSituation } from '../services/geminiService';
import { ChatComponent } from './ChatComponent';

interface RescuerViewProps {
  requests: SOSRequest[];
  selectedRequest: SOSRequest | null;
  onSelectRequest: (req: SOSRequest | null) => void;
  userLocation: { lat: number; lng: number } | null;
  onChatToggle?: (isOpen: boolean) => void;
}

export const RescuerView: React.FC<RescuerViewProps> = ({
  requests,
  selectedRequest,
  onSelectRequest,
  userLocation,
  onChatToggle
}) => {
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showChat, setShowChat] = useState(false);

  // Track previous request ID to prevent resetting state on updates
  const prevRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = selectedRequest?.id || null;
    if (currentId !== prevRequestIdRef.current) {
        setAiAnalysis(null);
        setProofImages([]);
        setIsCompleting(false);
        setShowChat(false);
        prevRequestIdRef.current = currentId;
    }
    if (selectedRequest) setShowList(false);
  }, [selectedRequest]);

  useEffect(() => {
    if (onChatToggle) onChatToggle(showChat);
  }, [showChat, onChatToggle]);

  const handleCall = () => {
    if (selectedRequest) window.location.href = `tel:${selectedRequest.contactPhone}`;
  };

  const handleGo = async () => {
    if (selectedRequest && AuthService.currentUser()) {
      await RescueStore.updateStatus(selectedRequest.id, Status.IN_PROGRESS, AuthService.currentUser()?.uid);
    }
  };

  const handleResolve = async () => {
    if (selectedRequest && proofImages.length > 0 && AuthService.currentUser()) {
      setIsCompleting(true);
      try {
          // Change to PENDING_CONFIRMATION instead of RESOLVED
          await RescueStore.updateStatus(selectedRequest.id, Status.PENDING_CONFIRMATION, AuthService.currentUser()?.uid, proofImages);
          onSelectRequest(null);
      } finally {
          setIsCompleting(false);
      }
    }
  };

  const handleAnalyze = async () => {
    if (!selectedRequest) return;
    setIsAnalyzing(true);
    const result = await analyzeSituation(selectedRequest.note, selectedRequest.severity);
    setAiAnalysis(result);
    setIsAnalyzing(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
        const filesArray = Array.from(e.target.files);
        const remainingSlots = 5 - proofImages.length;
        if (remainingSlots <= 0) {
          alert("Maximum 5 proof images allowed.");
          return;
        }
        const filesToProcess = filesArray.slice(0, remainingSlots);
        const newImages = filesToProcess.map(file => URL.createObjectURL(file as Blob));
        setProofImages(prev => [...prev, ...newImages]);
    }
  };

  const removeProofImage = (index: number) => {
    setProofImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSendMessage = async (text: string) => {
     if(selectedRequest) {
         await RescueStore.sendMessage(selectedRequest.id, text, 'RESCUER');
     }
  };

  const getDistance = (req: SOSRequest) => {
    if (!userLocation) return null;
    return (Math.sqrt(Math.pow(req.location.lat - userLocation.lat, 2) + Math.pow(req.location.lng - userLocation.lng, 2)) * 111).toFixed(1);
  };

  const sortedRequests = [...requests].sort((a, b) => {
    // 1. Critical requests first
    if (a.severity === Severity.CRITICAL && b.severity !== Severity.CRITICAL) return -1;
    if (b.severity === Severity.CRITICAL && a.severity !== Severity.CRITICAL) return 1;
    
    // 2. Sort by timestamp (Newest first) as a secondary major factor
    // This ensures that if severity is equal, the new request you just made pops to the top
    return b.timestamp - a.timestamp;
  });

  const isRecent = (timestamp: number) => {
      // Created in last 15 minutes
      return (Date.now() - timestamp) < (15 * 60 * 1000);
  };

  if (selectedRequest) {
    if (showChat) {
        return (
            <ChatComponent 
                messages={selectedRequest.messages}
                onSendMessage={handleSendMessage}
                onClose={() => setShowChat(false)}
                currentUserRole={UserRole.RESCUER}
                recipientName={selectedRequest.contactName}
                recipientPhone={selectedRequest.contactPhone}
            />
        );
    }

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-slate-900 rounded-t-3xl shadow-2xl border-t border-slate-700 max-h-[85vh] overflow-y-auto z-[1000] animate-in slide-in-from-bottom-10 transition-transform duration-300">
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto mt-3 mb-5" />
        
        <div className="px-6 pb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                {selectedRequest.contactName}
                {selectedRequest.status === Status.IN_PROGRESS && (
                  <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-1 rounded-full border border-yellow-500/50">In Progress</span>
                )}
                {selectedRequest.status === Status.PENDING_CONFIRMATION && (
                  <span className="text-xs bg-blue-500/20 text-blue-500 px-2 py-1 rounded-full border border-blue-500/50">Waiting Confirm</span>
                )}
              </h2>
              <div className="flex items-center gap-2 text-slate-400 text-sm mt-1">
                <MapPin size={14} />
                <span>{userLocation ? `${getDistance(selectedRequest)} km away` : 'Distance unknown'}</span>
              </div>
            </div>
            <button onClick={() => onSelectRequest(null)} className="p-2 bg-slate-800 rounded-full text-slate-400 hover:bg-slate-700"><X size={20} /></button>
          </div>

          <div className="mb-6">
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${selectedRequest.severity === Severity.CRITICAL ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'}`}>{selectedRequest.severity}</span>
          </div>
          
          {selectedRequest.requestImageUrls && selectedRequest.requestImageUrls.length > 0 && (
            <div className="mb-6">
                 <div className="text-xs text-slate-400 uppercase mb-2 font-semibold">Situation Photos</div>
                 <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                    {selectedRequest.requestImageUrls.map((url, i) => (
                        <div key={i} className="flex-shrink-0 h-40 w-auto rounded-xl overflow-hidden border border-slate-700 bg-black">
                            <img src={url} alt="Situation" className="h-full w-auto object-cover" />
                        </div>
                    ))}
                 </div>
            </div>
          )}

          <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
              <p className="text-slate-300 italic">"{selectedRequest.note}"</p>
          </div>

          {selectedRequest.status !== Status.RESOLVED && (
            <div className="mb-6">
              {!aiAnalysis ? (
                  <button onClick={handleAnalyze} disabled={isAnalyzing} className="w-full py-3 bg-indigo-600/20 border border-indigo-500/30 rounded-xl text-indigo-400 flex items-center justify-center gap-2 font-medium hover:bg-indigo-600/30 transition">
                      {isAnalyzing ? <Loader2 className="animate-spin" size={18} /> : <BrainCircuit size={18} />} Gemini Risk Assessment
                  </button>
              ) : (
                  <div className="bg-indigo-950/30 border border-indigo-500/30 p-4 rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-indigo-300 font-semibold border-b border-indigo-500/20 pb-2"><BrainCircuit size={18} /> AI Assessment</div>
                      <div className="grid grid-cols-2 gap-4">
                          <div><span className="text-xs text-slate-400 uppercase">Risk Level</span><p className="text-white font-bold">{aiAnalysis.riskLevel}</p></div>
                          <div><span className="text-xs text-slate-400 uppercase">Hazards</span><p className="text-white text-sm">{aiAnalysis.hazards.slice(0, 2).join(", ")}</p></div>
                      </div>
                      <div>
                          <span className="text-xs text-slate-400 uppercase">Recommended Gear</span>
                          <div className="flex flex-wrap gap-2 mt-1">
                              {aiAnalysis.recommendedGear.map((gear, i) => (<span key={i} className="text-xs bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded">{gear}</span>))}
                          </div>
                      </div>
                  </div>
              )}
            </div>
          )}

          <div className="flex flex-col gap-3">
            {selectedRequest.status === Status.OPEN && (
              <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCall} className="py-3 bg-slate-800 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-slate-700"><Phone size={20} /> Call</button>
                  <button onClick={handleGo} className="py-3 bg-yellow-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-yellow-700 shadow-lg shadow-yellow-900/20"><Navigation size={20} /> I'm Going</button>
              </div>
            )}

            {selectedRequest.status === Status.IN_PROGRESS && (
               <div className="space-y-3">
                   <div className="text-center text-sm text-yellow-500 font-bold mb-2 animate-pulse">Rescue in progress - Navigating to location...</div>
                   <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => setShowChat(true)} className="py-3 bg-blue-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-blue-700"><MessageCircle size={20} /> Chat</button>
                        <button onClick={handleCall} className="py-3 bg-slate-800 rounded-xl font-bold text-white flex items-center justify-center gap-2"><Phone size={20} /> Call</button>
                   </div>
                  <div className="mt-4 border-t border-slate-700 pt-4">
                      <h4 className="text-sm font-bold text-slate-400 mb-2">Completion Proof</h4>
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-700">
                        {proofImages.map((img, idx) => (
                            <div key={idx} className="relative w-20 h-20 flex-shrink-0 rounded-lg overflow-hidden border border-slate-700">
                                <img src={img} className="w-full h-full object-cover" />
                                <button onClick={() => removeProofImage(idx)} className="absolute top-0 right-0 p-1 bg-black/60 text-white rounded-bl-lg hover:bg-red-600/80 transition"><X size={12} /></button>
                            </div>
                        ))}
                        {proofImages.length < 5 && (
                             <label className="w-20 h-20 flex-shrink-0 border-2 border-dashed border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-slate-800 hover:border-slate-500 transition">
                                <Plus size={24} />
                                <span className="text-[10px]">Add</span>
                                <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                            </label>
                        )}
                      </div>
                      {proofImages.length === 0 && <p className="text-xs text-slate-500 italic">Take at least 1 photo to complete rescue.</p>}
                  </div>

                  <button onClick={handleResolve} disabled={isCompleting || proofImages.length === 0} className={`w-full py-3 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 transition ${proofImages.length > 0 ? 'bg-green-600 hover:bg-green-500 shadow-green-900/20' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                      {isCompleting ? <Loader2 className="animate-spin" /> : <CheckCircle size={20} />} Rescued Successfully
                  </button>
               </div>
            )}

            {selectedRequest.status === Status.PENDING_CONFIRMATION && (
                <div className="p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl flex flex-col items-center justify-center gap-2 text-blue-400 font-bold text-center"><Clock size={24} /> <span>Waiting for victim to confirm safety...</span></div>
            )}

            {selectedRequest.status === Status.RESOLVED && (
                <div className="p-4 bg-green-900/20 border border-green-500/30 rounded-xl flex items-center justify-center gap-2 text-green-500 font-bold"><CheckCircle size={24} /> Mission Accomplished</div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {!showList && (
         <div className="absolute bottom-6 right-6 z-[900]">
            <button onClick={() => setShowList(true)} className="w-16 h-16 bg-blue-600 rounded-full shadow-2xl shadow-blue-900/50 flex items-center justify-center text-white hover:bg-blue-500 transition-transform active:scale-95"><List size={32} /></button>
         </div>
      )}

      {showList && (
        <div className="absolute inset-0 z-[1100] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-20">
            <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur sticky top-0 z-10">
                <h2 className="text-xl font-bold flex items-center gap-2"><Filter size={20} className="text-blue-500"/> Active Requests</h2>
                <button 
                  onClick={() => setShowList(false)} 
                  className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
                >
                  <X size={24} />
                </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-20">
                {sortedRequests.length === 0 && <div className="text-center text-slate-500 mt-10">No active SOS requests.</div>}
                {sortedRequests.map(req => (
                    <div key={req.id} onClick={() => { onSelectRequest(req); setShowList(false); }} className={`p-4 rounded-xl border bg-slate-900 cursor-pointer active:scale-[0.98] transition-all flex justify-between items-center ${req.severity === Severity.CRITICAL ? 'border-red-900/50 hover:border-red-500/50' : 'border-slate-800 hover:border-slate-600'}`}>
                        <div>
                            <div className="flex items-center gap-2 mb-1">
                                <span className={`w-2 h-2 rounded-full ${req.severity === Severity.CRITICAL ? 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]' : 'bg-orange-500'}`} />
                                <span className="font-bold text-lg text-white">{req.contactName}</span>
                                {isRecent(req.timestamp) && <span className="text-[10px] bg-blue-600 px-1.5 py-0.5 rounded font-bold text-white">NEW</span>}
                            </div>
                            <div className="text-sm text-slate-400 line-clamp-1">"{req.note}"</div>
                            <div className="flex items-center gap-3 mt-2 text-xs font-mono text-slate-500">
                                <span>{req.severity}</span>
                                {userLocation && <span>• {getDistance(req)} km away</span>}
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                             {req.status === Status.IN_PROGRESS && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">BUSY</span>}
                             {req.status === Status.PENDING_CONFIRMATION && <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-500 border border-blue-500/30">WAIT</span>}
                             <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Navigation size={14} /></div>
                        </div>
                    </div>
                ))}
            </div>

            <div className="p-4 border-t border-slate-800 bg-slate-900/50 backdrop-blur">
               <button 
                  onClick={() => setShowList(false)}
                  className="w-full py-4 bg-slate-800 rounded-xl font-bold text-slate-300 hover:bg-slate-700 hover:text-white transition flex items-center justify-center gap-2"
               >
                  <ArrowLeft size={20} /> Back to Map
               </button>
            </div>
        </div>
      )}
    </>
  );
};