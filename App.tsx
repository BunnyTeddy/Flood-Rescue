import React, { useState, useEffect } from 'react';
import { UserRole, SOSRequest, Location, Status } from './types';
import { MapComponent } from './components/MapComponent';
import { SOSForm } from './components/SOSForm';
import { RescuerView } from './components/RescuerView';
import { RescueStore, AuthService } from './services/firebase';
import { seedDatabaseIfEmpty } from './services/seedDatabase';
import { ChatComponent } from './components/ChatComponent';
import { AlertTriangle, Shield, User, CheckCircle, Loader2, MessageCircle, Phone, Search, Lock, X, LogOut, Mail, ArrowRight, Edit2, Trash2 } from 'lucide-react';

const App = () => {
  const [role, setRole] = useState<UserRole>(UserRole.VICTIM);
  const [requests, setRequests] = useState<SOSRequest[]>([]);
  const [userLocation, setUserLocation] = useState<Location | null>(null);
  const [showSOSForm, setShowSOSForm] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<SOSRequest | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [isRescuerChatOpen, setIsRescuerChatOpen] = useState(false);

  // Auth & Tracking States
  const [showRescuerLogin, setShowRescuerLogin] = useState(false);
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [trackPhone, setTrackPhone] = useState('');
  const [isTracking, setIsTracking] = useState(false);

  // Login Form State
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');
  const [signupName, setSignupName] = useState('');
  const [signupPhone, setSignupPhone] = useState('');
  const [isSignup, setIsSignup] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Track the victim's own request
  const [myRequestId, setMyRequestId] = useState<string | null>(null);
  const myRequest = requests.find(r => r.id === myRequestId);

  // Filtered requests for rescuer map view
  const [filteredRequests, setFilteredRequests] = useState<SOSRequest[]>([]);

  // Cancel/Edit modal states
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  // Initialize Data
  useEffect(() => {
    // Seed database with mock data if empty
    seedDatabaseIfEmpty();

    // Subscribe to Firestore Data
    const unsubscribeData = RescueStore.subscribe((data) => {
      setRequests(data);
    });

    // Subscribe to Auth State
    const unsubscribeAuth = AuthService.observeUser((user) => {
      if (user) {
        setRole(UserRole.RESCUER);
        setShowRescuerLogin(false);
      } else {
        setRole(UserRole.VICTIM);
      }
    });

    // Mock Geolocation (Request permission)
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Location error:", err);
          // Fallback location (Ho Chi Minh City) if denied for demo purposes
          setUserLocation({ lat: 10.7756, lng: 106.7019 });
        }
      );
    }

    return () => {
      unsubscribeData();
      unsubscribeAuth();
    };
  }, []);

  // Sync selectedRequest with updated requests (Fixes stale data issues for Chat and Status)
  useEffect(() => {
    if (selectedRequest) {
      const updated = requests.find(r => r.id === selectedRequest.id);
      if (updated && updated !== selectedRequest) {
        setSelectedRequest(updated);
      }
    }
  }, [requests, selectedRequest]);

  const handleSOSSuccess = (newId: string) => {
    setMyRequestId(newId);
    setShowSOSForm(false);
  };

  const handleVictimConfirmSafe = async () => {
    if (myRequestId) {
      await RescueStore.updateStatus(myRequestId, Status.RESOLVED);
      alert("You have confirmed you are safe. Status updated!");
    }
  };

  const handleSendMessage = async (text: string) => {
    if (myRequestId) {
      await RescueStore.sendMessage(myRequestId, text, 'VICTIM');
    }
  };

  const handleCallRescuer = () => {
    if (myRequest?.rescuerPhone) {
      window.location.href = `tel:${myRequest.rescuerPhone}`;
    } else {
      alert("Rescuer phone not available.");
    }
  };

  const handleRescuerAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setIsAuthenticating(true);

    try {
      if (isSignup) {
        // Validate name and phone for signup
        if (!signupName.trim() || !signupPhone.trim()) {
          throw new Error('Name and phone number are required for signup');
        }
        await AuthService.signupWithProfile(loginEmail, loginPass, signupName.trim(), signupPhone.trim());
      } else {
        await AuthService.login(loginEmail, loginPass);
      }
      // Auth observer will handle transition
      setLoginEmail('');
      setLoginPass('');
      setSignupName('');
      setSignupPhone('');
    } catch (err: any) {
      setAuthError(err.message || 'Authentication failed');
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await AuthService.logout();
    setSelectedRequest(null);
    setShowSOSForm(false);
    setShowChat(false);
  };

  const handleTrackRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsTracking(true);
    try {
      const foundRequest = await RescueStore.findRequestByPhone(trackPhone);
      if (foundRequest) {
        setMyRequestId(foundRequest.id);
        setShowTrackModal(false);
      } else {
        alert("No active request found for this phone number.");
      }
    } catch (e) {
      console.error(e);
      alert("Error searching for request.");
    } finally {
      setIsTracking(false);
    }
  };

  // Chat View Overlay
  if (role === UserRole.VICTIM && showChat && myRequest) {
    return (
      <ChatComponent
        messages={myRequest.messages}
        onSendMessage={handleSendMessage}
        onClose={() => setShowChat(false)}
        currentUserRole={UserRole.VICTIM}
        recipientName="Rescuer"
        recipientPhone={myRequest.rescuerPhone}
      />
    );
  }

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col relative overflow-hidden">

      {/* Map Layer (Always rendering behind UI) */}
      <div className="absolute inset-0 z-0">
        <MapComponent
          requests={role === UserRole.RESCUER ? filteredRequests : (myRequest ? [myRequest] : [])}
          userLocation={userLocation}
          onMarkerClick={(req) => {
            if (role === UserRole.RESCUER) setSelectedRequest(req);
          }}
          selectedRequestId={selectedRequest?.id || myRequest?.id}
        />
      </div>

      {/* Rescuer Login / Logout Button */}
      {!isRescuerChatOpen && (
        <div className="absolute top-4 right-4 z-[500]">
          {role === UserRole.VICTIM ? (
            <button
              onClick={() => setShowRescuerLogin(true)}
              className="px-5 py-2.5 rounded-full shadow-xl border bg-slate-900/90 backdrop-blur border-slate-600 text-slate-300 hover:text-white hover:border-white transition-all flex items-center gap-2 text-sm font-bold"
            >
              <User size={16} /> Rescuer Login
            </button>
          ) : (
            <button
              onClick={handleLogout}
              className="px-5 py-2.5 rounded-full shadow-xl border bg-red-600 border-red-400 text-white hover:bg-red-500 transition-all flex items-center gap-2 text-sm font-bold"
            >
              <LogOut size={16} /> Logout
            </button>
          )}
        </div>
      )}

      {/* Main UI Overlay */}
      <div className="absolute inset-0 z-10 pointer-events-none flex flex-col justify-end">

        {/* VICTIM MODE UI */}
        {role === UserRole.VICTIM && !showSOSForm && (
          <div className="p-6 pointer-events-auto bg-gradient-to-t from-slate-950/90 to-transparent">

            {/* If user has an active request */}
            {myRequest ? (
              <div className="bg-slate-900 rounded-2xl p-6 shadow-2xl border border-slate-700 animate-in slide-in-from-bottom-5">
                <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
                  <h3 className="text-xl font-bold text-white">My Request</h3>
                  <button
                    onClick={() => setMyRequestId(null)}
                    className="text-xs text-slate-500 underline"
                  >
                    Close Tracker
                  </button>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400">Current Status:</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border
                                ${myRequest.status === Status.OPEN ? 'bg-red-500/20 text-red-500 border-red-500/30' : ''}
                                ${myRequest.status === Status.IN_PROGRESS ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : ''}
                                ${myRequest.status === Status.PENDING_CONFIRMATION ? 'bg-blue-500/20 text-blue-500 border-blue-500/30' : ''}
                                ${myRequest.status === Status.RESOLVED ? 'bg-green-500/20 text-green-500 border-green-500/30' : ''}
                            `}>
                      {myRequest.status.replace('_', ' ')}
                    </span>
                  </div>

                  {myRequest.status === Status.OPEN && (
                    <div className="space-y-3">
                      <div className="text-slate-300 flex items-center gap-2">
                        <Loader2 className="animate-spin text-slate-500" size={16} />
                        Waiting for a rescuer to accept...
                      </div>

                      {/* Edit and Cancel buttons */}
                      <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t border-slate-800">
                        <button
                          onClick={() => {
                            setShowSOSForm(true);
                            // Note: Edit functionality would pre-fill the form
                            // For now we just re-open the form
                          }}
                          className="py-2.5 bg-slate-800 rounded-xl font-medium text-slate-300 flex items-center justify-center gap-2 hover:bg-slate-700 border border-slate-700"
                        >
                          <Edit2 size={16} /> Edit Request
                        </button>
                        <button
                          onClick={() => setShowCancelModal(true)}
                          className="py-2.5 bg-red-600/20 rounded-xl font-medium text-red-400 flex items-center justify-center gap-2 hover:bg-red-600/30 border border-red-600/30"
                        >
                          <Trash2 size={16} /> Cancel SOS
                        </button>
                      </div>
                    </div>
                  )}

                  {myRequest.status === Status.IN_PROGRESS && (
                    <div className="space-y-3">
                      <div className="bg-yellow-900/20 border border-yellow-600/30 p-4 rounded-xl text-yellow-500">
                        <p className="font-bold flex items-center gap-2"><Loader2 className="animate-spin" /> Rescuer is coming!</p>
                        <p className="text-sm mt-1 opacity-80">See map for location.</p>
                      </div>

                      {/* Rescuer Info */}
                      {(myRequest.rescuerName || myRequest.rescuerPhone) && (
                        <div className="bg-slate-800 border border-slate-700 p-4 rounded-xl">
                          <div className="text-xs text-slate-400 uppercase mb-2 font-semibold">Your Rescuer</div>
                          <div className="space-y-2">
                            {myRequest.rescuerName && (
                              <div className="flex items-center gap-2 text-white">
                                <User size={16} className="text-blue-400" />
                                <span className="font-medium">{myRequest.rescuerName}</span>
                              </div>
                            )}
                            {myRequest.rescuerPhone && (
                              <div className="flex items-center gap-2">
                                <Phone size={16} className="text-green-400" />
                                <a href={`tel:${myRequest.rescuerPhone}`} className="text-blue-400 hover:underline">
                                  {myRequest.rescuerPhone}
                                </a>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setShowChat(true)}
                          className="py-3 bg-blue-600 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
                        >
                          <MessageCircle size={20} /> Chat
                        </button>
                        <button
                          onClick={handleCallRescuer}
                          className="py-3 bg-slate-800 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2 border border-slate-700"
                        >
                          <Phone size={20} /> Call
                        </button>
                      </div>
                    </div>
                  )}

                  {myRequest.status === Status.PENDING_CONFIRMATION && (
                    <div className="bg-blue-900/20 border border-blue-500/30 p-4 rounded-xl space-y-3">
                      <p className="text-white font-bold text-lg">Rescuer reported you are safe.</p>
                      <p className="text-slate-300 text-sm">Please confirm you have been rescued.</p>
                      <button
                        onClick={handleVictimConfirmSafe}
                        className="w-full py-3 bg-green-600 hover:bg-green-500 rounded-xl font-bold text-white shadow-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircle size={20} /> I AM SAFE
                      </button>
                    </div>
                  )}

                  {myRequest.status === Status.RESOLVED && (
                    <div className="bg-green-900/20 border border-green-500/30 p-4 rounded-xl text-green-500 text-center font-bold">
                      Rescue Completed. Stay Safe!
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-slate-900/80 backdrop-blur p-4 rounded-xl border border-slate-800 shadow-2xl">
                  <h3 className="text-white font-bold text-lg mb-1 flex items-center gap-2">
                    <Shield size={20} className="text-blue-500" /> Are you safe?
                  </h3>
                  <p className="text-slate-400 text-sm">If you are in danger or need supplies, broadcast an SOS immediately.</p>
                </div>

                <div className="space-y-4">
                  <button
                    onClick={() => setShowSOSForm(true)}
                    className="w-full bg-red-600 hover:bg-red-700 active:scale-95 transition-transform text-white rounded-2xl py-6 shadow-xl shadow-red-900/50 flex flex-col items-center justify-center gap-2"
                  >
                    <AlertTriangle size={48} />
                    <span className="text-2xl font-black tracking-widest">SOS</span>
                  </button>

                  <button
                    onClick={() => setShowTrackModal(true)}
                    className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl py-3 border border-slate-700 flex items-center justify-center gap-2 font-semibold"
                  >
                    <Search size={18} /> Track Existing Request
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* SOS FORM OVERLAY */}
        {showSOSForm && (
          <div className="absolute inset-0 pointer-events-auto z-50">
            <SOSForm
              onCancel={() => setShowSOSForm(false)}
              onSuccess={handleSOSSuccess}
              userLocation={userLocation}
            />
          </div>
        )}

        {/* RESCUER MODE UI */}
        {role === UserRole.RESCUER && (
          <div className="pointer-events-auto flex flex-col justify-end">
            <RescuerView
              requests={requests}
              selectedRequest={selectedRequest}
              onSelectRequest={setSelectedRequest}
              userLocation={userLocation}
              onChatToggle={setIsRescuerChatOpen}
              onFilterChange={setFilteredRequests}
            />
          </div>
        )}
      </div>

      {/* Rescuer Login Modal */}
      {showRescuerLogin && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/80 backdrop-blur flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Lock size={20} className="text-blue-500" /> {isSignup ? 'Rescuer Sign Up' : 'Rescuer Login'}</h3>
              <button onClick={() => setShowRescuerLogin(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>

            <form onSubmit={handleRescuerAuth}>
              <div className="space-y-4 mb-6">
                {/* Signup-only fields */}
                {isSignup && (
                  <>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Official Name *</label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="text"
                          required={isSignup}
                          value={signupName}
                          onChange={e => setSignupName(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                          placeholder="John Smith"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Phone Number *</label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input
                          type="tel"
                          required={isSignup}
                          value={signupPhone}
                          onChange={e => setSignupPhone(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                          placeholder="+1 234 567 890"
                        />
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm text-slate-400 mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="email"
                      required
                      value={loginEmail}
                      onChange={e => setLoginEmail(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                      placeholder="rescuer@agency.com"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-slate-400 mb-2">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                    <input
                      type="password"
                      required
                      value={loginPass}
                      onChange={e => setLoginPass(e.target.value)}
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white focus:border-blue-500 outline-none"
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              </div>

              {authError && <div className="text-red-500 text-sm mb-4 bg-red-500/10 p-2 rounded">{authError}</div>}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                {isAuthenticating ? <Loader2 className="animate-spin" /> : <>{isSignup ? 'Create Account' : 'Login'} <ArrowRight size={20} /></>}
              </button>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={() => { setIsSignup(!isSignup); setAuthError(''); }}
                  className="text-slate-500 hover:text-blue-400 text-sm"
                >
                  {isSignup ? 'Already have an account? Login' : 'New rescuer? Create account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Track Request Modal */}
      {showTrackModal && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/80 backdrop-blur flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white flex items-center gap-2"><Search size={20} className="text-yellow-500" /> Track Status</h3>
              <button onClick={() => setShowTrackModal(false)} className="text-slate-400 hover:text-white"><X size={24} /></button>
            </div>
            <form onSubmit={handleTrackRequest}>
              <label className="block text-sm text-slate-400 mb-2">Enter Registered Phone Number</label>
              <input
                type="tel"
                value={trackPhone}
                onChange={e => setTrackPhone(e.target.value)}
                placeholder="+1 234 567 890"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl p-4 text-white mb-6 focus:border-yellow-500 outline-none"
                autoFocus
              />
              <button
                type="submit"
                disabled={isTracking}
                className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                {isTracking ? <Loader2 className="animate-spin" /> : 'Find Request'}
              </button>
              <p className="text-center text-xs text-slate-500 mt-4">Demo: Use +1 234 567 890</p>
            </form>
          </div>
        </div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelModal && myRequest && (
        <div className="absolute inset-0 z-[2000] bg-slate-950/90 backdrop-blur flex items-center justify-center p-6 animate-in fade-in">
          <div className="bg-slate-900 p-6 rounded-2xl shadow-2xl border border-slate-700 w-full max-w-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-600/20 flex items-center justify-center">
                <AlertTriangle size={24} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Cancel SOS Request?</h3>
                <p className="text-slate-400 text-sm">This cannot be undone</p>
              </div>
            </div>

            <div className="bg-red-900/20 border border-red-500/30 p-4 rounded-xl mb-6">
              <p className="text-red-300 text-sm">
                If you are still in danger, please do not cancel your request. Rescuers are on their way.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                disabled={isCancelling}
                className="py-3 bg-slate-800 rounded-xl font-bold text-white hover:bg-slate-700 transition"
              >
                Keep Request
              </button>
              <button
                onClick={async () => {
                  setIsCancelling(true);
                  try {
                    await RescueStore.cancelRequest(myRequest.id);
                    setMyRequestId(null);
                    setShowCancelModal(false);
                  } catch (e) {
                    console.error('Failed to cancel request:', e);
                    alert('Failed to cancel request. Please try again.');
                  } finally {
                    setIsCancelling(false);
                  }
                }}
                disabled={isCancelling}
                className="py-3 bg-red-600 rounded-xl font-bold text-white flex items-center justify-center gap-2 hover:bg-red-500 transition"
              >
                {isCancelling ? <Loader2 className="animate-spin" size={20} /> : <Trash2 size={18} />}
                {isCancelling ? 'Cancelling...' : 'Cancel SOS'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default App;