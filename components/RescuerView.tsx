import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Phone, MapPin, CheckCircle, Navigation, X, Loader2, List, Filter, Clock, MessageCircle, Plus, ArrowLeft, AlertTriangle, ArrowUpDown, Bell, BellOff, Eye, EyeOff, Users } from 'lucide-react';
import { SOSRequest, Severity, Status, UserRole } from '../types';
import { RescueStore, AuthService } from '../services/firebase';
import { ChatComponent } from './ChatComponent';

// Special needs display mapping
const SPECIAL_NEEDS_DISPLAY: Record<string, { label: string; emoji: string }> = {
  pregnant: { label: 'Pregnant', emoji: '🤰' },
  elderly: { label: 'Elderly', emoji: '👴' },
  disabled: { label: 'Disabled', emoji: '♿' },
  infant: { label: 'Infant', emoji: '👶' },
  medical: { label: 'Medical', emoji: '💊' },
  pet: { label: 'Pet', emoji: '🐕' },
};

// Filter type for map markers
type FilterType = 'CRITICAL' | 'SUPPLIES' | 'PENDING';

interface RescuerViewProps {
  requests: SOSRequest[];
  selectedRequest: SOSRequest | null;
  onSelectRequest: (req: SOSRequest | null) => void;
  userLocation: { lat: number; lng: number } | null;
  onChatToggle?: (isOpen: boolean) => void;
  onFilterChange?: (filteredRequests: SOSRequest[]) => void;
}

export const RescuerView: React.FC<RescuerViewProps> = ({
  requests,
  selectedRequest,
  onSelectRequest,
  userLocation,
  onChatToggle,
  onFilterChange
}) => {
  const [proofImages, setProofImages] = useState<string[]>([]);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showList, setShowList] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showConfirmGo, setShowConfirmGo] = useState(false);
  const [isGoingInProgress, setIsGoingInProgress] = useState(false);
  const [sortBy, setSortBy] = useState<'time' | 'distance' | 'severity'>('severity');

  // Map filter state
  const [enabledFilters, setEnabledFilters] = useState<Set<FilterType>>(
    new Set(['CRITICAL', 'SUPPLIES', 'PENDING'])
  );

  // Notification state
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const previousRequestIdsRef = useRef<Set<string>>(new Set());
  const isInitialLoadRef = useRef(true);

  // Track previous request ID to prevent resetting state on updates
  const prevRequestIdRef = useRef<string | null>(null);

  useEffect(() => {
    const currentId = selectedRequest?.id || null;
    if (currentId !== prevRequestIdRef.current) {
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

  // Play alert sound using Web Audio API (~3 seconds)
  const playAlertSound = useCallback(() => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContext) return;

      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Create an emergency-style beeping pattern
      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      // Envelope for beeping effect
      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);

      // 3 second alert with beeping pattern
      for (let i = 0; i < 6; i++) {
        const beepStart = now + i * 0.5;
        gainNode.gain.setValueAtTime(0.3, beepStart);
        gainNode.gain.setValueAtTime(0, beepStart + 0.3);
      }

      oscillator.start(now);
      oscillator.stop(now + 3);

      // Clean up
      setTimeout(() => audioContext.close(), 3500);
    } catch (e) {
      console.error('Audio alert failed:', e);
    }
  }, []);

  // Detect new SOS requests and play alert
  useEffect(() => {
    if (isInitialLoadRef.current) {
      // On initial load, just populate the previous IDs without alerting
      previousRequestIdsRef.current = new Set(requests.map(r => r.id));
      isInitialLoadRef.current = false;
      return;
    }

    if (!notificationsEnabled) return;

    const currentIds = new Set(requests.map(r => r.id));
    const newRequests = requests.filter(
      r => !previousRequestIdsRef.current.has(r.id) && r.status === Status.OPEN
    );

    if (newRequests.length > 0) {
      playAlertSound();
    }

    previousRequestIdsRef.current = currentIds;
  }, [requests, notificationsEnabled, playAlertSound]);

  // Filter requests based on enabled filters
  const getFilteredRequests = useCallback((reqs: SOSRequest[]) => {
    return reqs.filter(r => {
      if (r.severity === Severity.CRITICAL && r.status === Status.OPEN) {
        return enabledFilters.has('CRITICAL');
      }
      if (r.severity === Severity.SUPPLIES && r.status === Status.OPEN) {
        return enabledFilters.has('SUPPLIES');
      }
      if (r.status === Status.PENDING_CONFIRMATION || r.status === Status.IN_PROGRESS) {
        return enabledFilters.has('PENDING');
      }
      return true; // Show resolved or other statuses
    });
  }, [enabledFilters]);

  // Notify parent of filter changes
  useEffect(() => {
    if (onFilterChange) {
      onFilterChange(getFilteredRequests(requests));
    }
  }, [requests, enabledFilters, onFilterChange, getFilteredRequests]);

  const toggleFilter = (filter: FilterType) => {
    setEnabledFilters(prev => {
      const newSet = new Set(prev);
      if (newSet.has(filter)) {
        newSet.delete(filter);
      } else {
        newSet.add(filter);
      }
      return newSet;
    });
  };

  const handleCall = () => {
    if (selectedRequest) window.location.href = `tel:${selectedRequest.contactPhone}`;
  };

  const handleGo = async () => {
    if (selectedRequest && AuthService.currentUser()) {
      setIsGoingInProgress(true);
      try {
        // Fetch rescuer profile to get name and phone
        const profile = await AuthService.getRescuerProfile(AuthService.currentUser()!.uid);

        await RescueStore.updateStatus(
          selectedRequest.id,
          Status.IN_PROGRESS,
          AuthService.currentUser()?.uid,
          undefined,
          userLocation || undefined,
          profile?.name || 'Rescuer',
          profile?.phone || 'N/A'
        );
      } finally {
        setIsGoingInProgress(false);
        setShowConfirmGo(false);
      }
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
    if (selectedRequest) {
      await RescueStore.sendMessage(selectedRequest.id, text, 'RESCUER');
    }
  };

  const getDistance = (req: SOSRequest) => {
    if (!userLocation) return null;
    return (Math.sqrt(Math.pow(req.location.lat - userLocation.lat, 2) + Math.pow(req.location.lng - userLocation.lng, 2)) * 111).toFixed(1);
  };

  const getDistanceNum = (req: SOSRequest) => {
    if (!userLocation) return Infinity;
    return Math.sqrt(Math.pow(req.location.lat - userLocation.lat, 2) + Math.pow(req.location.lng - userLocation.lng, 2)) * 111;
  };

  const sortedRequests = [...requests].sort((a, b) => {
    switch (sortBy) {
      case 'time':
        return b.timestamp - a.timestamp; // Newest first
      case 'distance':
        return getDistanceNum(a) - getDistanceNum(b); // Closest first
      case 'severity':
      default:
        // Critical first, then by timestamp
        if (a.severity === Severity.CRITICAL && b.severity !== Severity.CRITICAL) return -1;
        if (b.severity === Severity.CRITICAL && a.severity !== Severity.CRITICAL) return 1;
        return b.timestamp - a.timestamp;
    }
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
      <>
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

            <div className="mb-4 flex flex-wrap items-center gap-2">
              <span className={`inline-block px-3 py-1 rounded-lg text-sm font-bold ${selectedRequest.severity === Severity.CRITICAL ? 'bg-red-500/20 text-red-500 border border-red-500/30' : 'bg-orange-500/20 text-orange-500 border border-orange-500/30'}`}>{selectedRequest.severity}</span>

              {/* Number of People Badge */}
              {selectedRequest.numberOfPeople && selectedRequest.numberOfPeople > 0 && (
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-sm font-bold bg-purple-500/20 text-purple-400 border border-purple-500/30">
                  <Users size={14} /> {selectedRequest.numberOfPeople} {selectedRequest.numberOfPeople === 1 ? 'person' : 'people'}
                </span>
              )}
            </div>

            {/* Special Needs Badges */}
            {selectedRequest.specialNeeds && selectedRequest.specialNeeds.length > 0 && (
              <div className="mb-4">
                <div className="text-xs text-slate-400 uppercase mb-2 font-semibold">Special Needs</div>
                <div className="flex flex-wrap gap-2">
                  {selectedRequest.specialNeeds.map((need) => {
                    const display = SPECIAL_NEEDS_DISPLAY[need];
                    return display ? (
                      <span key={need} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        <span>{display.emoji}</span> {display.label}
                      </span>
                    ) : null;
                  })}
                </div>
              </div>
            )}

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

            {/* Voice Message */}
            {selectedRequest.voiceNoteUrl && (
              <div className="mb-6">
                <div className="text-xs text-slate-400 uppercase mb-2 font-semibold">Voice Message</div>
                <audio
                  controls
                  src={selectedRequest.voiceNoteUrl}
                  className="w-full h-12 rounded-xl"
                  style={{ filter: 'invert(1) hue-rotate(180deg)' }}
                />
              </div>
            )}

            {selectedRequest.note && (
              <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
                <p className="text-slate-300 italic">"{selectedRequest.note}"</p>
              </div>
            )}



            <div className="flex flex-col gap-3">
              {selectedRequest.status === Status.OPEN && (
                <div className="grid grid-cols-2 gap-3">
                  <button onClick={handleCall} className="py-3 bg-slate-800 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-slate-700"><Phone size={20} /> Call</button>
                  <button onClick={() => setShowConfirmGo(true)} className="py-3 bg-yellow-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-yellow-700 shadow-lg shadow-yellow-900/20"><Navigation size={20} /> I'm Going</button>
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

        {/* Confirmation Modal */}
        {showConfirmGo && (
          <div className="fixed inset-0 z-[2000] bg-slate-950/90 backdrop-blur flex items-center justify-center p-6 animate-in fade-in">
            <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-yellow-600/20 flex items-center justify-center">
                  <AlertTriangle size={24} className="text-yellow-500" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">Confirm Rescue</h3>
                  <p className="text-slate-400 text-sm">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-slate-800 p-4 rounded-xl mb-6 border border-slate-700">
                <p className="text-slate-300">
                  Are you sure you want to rescue <span className="font-bold text-white">{selectedRequest.contactName}</span>?
                </p>
                <p className="text-sm text-slate-500 mt-2">
                  You will be assigned to this case and the victim will be notified.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowConfirmGo(false)}
                  disabled={isGoingInProgress}
                  className="py-3 bg-slate-800 rounded-xl font-bold text-white hover:bg-slate-700 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGo}
                  disabled={isGoingInProgress}
                  className="py-3 bg-yellow-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-yellow-500 shadow-lg shadow-yellow-900/30 transition"
                >
                  {isGoingInProgress ? <Loader2 className="animate-spin" size={20} /> : <Navigation size={20} />}
                  {isGoingInProgress ? 'Confirming...' : 'Yes, Go!'}
                </button>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <>
      {!showList && (
        <div className="absolute bottom-6 left-4 right-4 z-[900] flex justify-between items-end">
          {/* Filter Controls - Left Side */}
          <div className="flex flex-col gap-2">
            <div className="bg-slate-900/95 backdrop-blur rounded-xl p-3 shadow-2xl border border-slate-700">
              <div className="flex items-center gap-2 mb-2">
                <Filter size={14} className="text-slate-400" />
                <span className="text-xs text-slate-400 font-medium">Map Filter</span>
              </div>
              <div className="flex flex-col gap-1.5">
                <button
                  onClick={() => toggleFilter('CRITICAL')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${enabledFilters.has('CRITICAL')
                    ? 'bg-red-600 text-white'
                    : 'bg-slate-800 text-slate-500 line-through'
                    }`}
                >
                  {enabledFilters.has('CRITICAL') ? <Eye size={12} /> : <EyeOff size={12} />}
                  Critical
                </button>
                <button
                  onClick={() => toggleFilter('SUPPLIES')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${enabledFilters.has('SUPPLIES')
                    ? 'bg-orange-600 text-white'
                    : 'bg-slate-800 text-slate-500 line-through'
                    }`}
                >
                  {enabledFilters.has('SUPPLIES') ? <Eye size={12} /> : <EyeOff size={12} />}
                  Supplies
                </button>
                <button
                  onClick={() => toggleFilter('PENDING')}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition ${enabledFilters.has('PENDING')
                    ? 'bg-yellow-600 text-white'
                    : 'bg-slate-800 text-slate-500 line-through'
                    }`}
                >
                  {enabledFilters.has('PENDING') ? <Eye size={12} /> : <EyeOff size={12} />}
                  In Progress
                </button>
              </div>
            </div>
          </div>

          {/* Right Side Controls */}
          <div className="flex flex-col gap-3 items-end">
            {/* Notification Toggle */}
            <button
              onClick={() => setNotificationsEnabled(!notificationsEnabled)}
              className={`w-12 h-12 rounded-full shadow-xl flex items-center justify-center transition-all ${notificationsEnabled
                ? 'bg-green-600 text-white shadow-green-900/50 ring-2 ring-green-400 ring-offset-2 ring-offset-slate-950'
                : 'bg-slate-800 text-slate-400 border border-slate-700 hover:bg-slate-700'
                }`}
              title={notificationsEnabled ? 'Notifications ON' : 'Notifications OFF'}
            >
              {notificationsEnabled ? <Bell size={22} /> : <BellOff size={22} />}
            </button>

            {/* List Button */}
            <button onClick={() => setShowList(true)} className="w-16 h-16 bg-blue-600 rounded-full shadow-2xl shadow-blue-900/50 flex items-center justify-center text-white hover:bg-blue-500 transition-transform active:scale-95"><List size={32} /></button>
          </div>
        </div>
      )}

      {showList && (
        <div className="absolute inset-0 z-[1100] bg-slate-950 flex flex-col animate-in slide-in-from-bottom-20">
          <div className="p-4 border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-10">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-xl font-bold flex items-center gap-2"><Filter size={20} className="text-blue-500" /> Active Requests</h2>
              <button
                onClick={() => setShowList(false)}
                className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-300 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            {/* Sort Options */}
            <div className="flex items-center gap-2">
              <ArrowUpDown size={14} className="text-slate-500" />
              <span className="text-xs text-slate-500 mr-1">Sort:</span>
              <button
                onClick={() => setSortBy('severity')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === 'severity' ? 'bg-red-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Severity
              </button>
              <button
                onClick={() => setSortBy('time')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === 'time' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Time
              </button>
              <button
                onClick={() => setSortBy('distance')}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${sortBy === 'distance' ? 'bg-green-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
              >
                Distance
              </button>
            </div>
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