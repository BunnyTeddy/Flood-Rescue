# 🚨 FloodRescue Connect

> **Real-time Flood Emergency Response Platform** - Connecting flood victims with rescue teams through interactive maps, real-road routing, and direct communication.

---

## 🎯 Demo Credentials (For Judges)

| Role | Email | Password |
|------|-------|----------|
| **Rescuer** | `rescue@gmail.com` | `rescue` |

> **Note**: Victims don't need to log in. Just open the app and send an SOS immediately.

---

## 🌟 Key Features & Strengths

### 1. 📍 **Auto GPS Location + Manual Adjustment**
- Automatically detects victim's current location via GPS
- Interactive map: **drag marker** or **tap to select location** if GPS is inaccurate
- **Reverse Geocoding**: Automatically converts coordinates to readable addresses (e.g., "123 Main Street, District 1")
- Works in poor network conditions with fallback location

### 2. 🎤 **Voice Recording for Emergency Situations**
- Victims can **record voice messages** (up to 60 seconds) instead of typing
- **Critical when panicking** or unable to type in dangerous situations
- Supports both voice AND text messages simultaneously
- Audio saved as base64, rescuers can **listen directly** on their dashboard

### 3. 📸 **Situation Photos (Up to 5 Images)**
- Victims can capture and send photos to help rescuers **assess severity**
- Images displayed on rescuer's screen with scrollable gallery
- Supports camera and photo library
- Images stored as base64, no separate cloud storage needed

### 4. 👥 **Number of People + Special Needs**
When sending SOS, victims can specify:
- **Number of people** needing rescue (1-20)
- **Special needs** with intuitive icons:
  - 🤰 Pregnant women
  - 👴 Elderly
  - ♿ Disabled persons
  - 👶 Infants
  - 💊 Medical conditions (diabetes, heart disease...)
  - 🐕 Pets

### 5. 🗺️ **Real-Road Routing (Not Straight Lines)**
- Uses **OSRM (Open Source Routing Machine)** to draw routes following actual roads
- Unlike apps that show straight lines between points
- Rescuers see **total distance and estimated travel time**
- Route updates automatically as rescuer moves

### 6. 💬 **Real-Time Chat: Victim ↔ Rescuer**
- Direct messaging interface
- Rescuer and victim **coordinate in real-time**
- Shows "Active now" status and timestamps for each message
- **Direct call button** from within chat

### 7. 🔔 **Audio Notifications for Rescuers**
- Rescuers can enable **notification mode**
- When new SOS arrives → **emergency alert sound** (~3 seconds)
- Uses Web Audio API, no external audio files needed

### 8. 🎯 **Filtering & Sorting for Rescuers**
**Sort by:**
- **Severity**: Critical first, then Supplies
- **Time**: Newest requests first
- **Distance**: Closest to rescuer first

**Filter map markers:**
- 🔴 Critical (Life-threatening)
- 🟠 Supplies (Food/water needed)
- 🟡 In Progress (Being rescued)

### 9. ✅ **Two-Step Safety Confirmation Workflow**
```
1. OPEN       → SOS sent, waiting for rescuer
2. IN_PROGRESS → Rescuer accepted, en route
3. PENDING_CONFIRMATION → Rescuer reports completion
4. RESOLVED   → Victim CONFIRMS they are safe
```
- **Prevents false positives**: Victim must tap "I AM SAFE"
- Rescuer must **upload proof photos** before completing

### 10. 📱 **Track Request by Phone Number**
- Victims can **look up their request** using their phone number
- No login required, just remember the phone number used
- Continue tracking and chatting with rescuer

### 11. 🏃 **Confirmation Before Accepting Mission**
- Rescuer clicks "I'm Going" → Confirmation modal **"Are you sure?"**
- Prevents accidental acceptance, ensures rescuer is ready
- Rescuer's info (name, phone) is sent to victim

### 12. 👤 **Rescuer Info Displayed to Victim**
- When a rescuer accepts, victim sees:
  - 👤 **Official name** of rescuer
  - 📞 **Phone number** (clickable to call)
- Increases trust and reassurance for the person in need

### 13. 🚫 **Cancel/Edit Request**
- Victims can **cancel SOS** if they're now safe
- Can **edit information** before a rescuer accepts
- Confirmation modal to prevent accidental cancellation

### 14. 💡 **Pulsing Marker Animation**
- When rescuer is en route, victim's marker shows **pulsing animation**
- Both victim AND rescuer see the animation
- Easy to identify the target location on the map

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| Frontend | React 19 + TypeScript + Vite |
| Styling | TailwindCSS + Custom Animations |
| Maps | OpenStreetMap + React-Leaflet |
| Routing | OSRM (Open Source Routing Machine) |
| Backend | Firebase Firestore (Real-time Database) |
| Auth | Firebase Authentication |
| Audio | Web Audio API |
| Icons | Lucide React |

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```

### 3. Open Browser
- Navigate to: `http://localhost:5173`
- Allow **GPS** and **Microphone** when prompted

---

## 📱 How to Use

### **For Victims**
1. Open app → Grant GPS permission
2. Tap the red **SOS** button
3. Select severity: **CRITICAL** (life-threatening) or **SUPPLIES** (food/water needed)
4. Enter number of people, select special needs
5. Take photos / record voice / add notes
6. Adjust location if GPS is inaccurate
7. Tap **SEND SOS**
8. Track rescuer on map, chat/call as needed

### **For Rescuers**
1. Tap **Rescuer Login** (top right corner)
2. Login: `rescue@gmail.com` / `rescue`
3. View map with SOS requests
4. Enable 🔔 notifications for alerts
5. Select request from list or tap marker
6. Tap **I'm Going** → Confirm
7. Navigate using route, chat with victim
8. Upload proof photos → Tap **Rescued Successfully**

---

## 🏗️ Project Structure

```
Flood-Rescue/
├── components/
│   ├── ChatComponent.tsx        # Real-time victim ↔ rescuer chat
│   ├── MapComponent.tsx         # Map with routing & markers
│   ├── RescuerView.tsx          # Full rescuer dashboard
│   ├── SOSForm.tsx              # SOS form with voice/image
│   ├── LocationPickerMap.tsx    # Drag & drop location picker
│   └── VoiceRecorder.tsx        # Voice message recorder
├── services/
│   ├── firebase.ts              # Firebase Auth & Firestore
│   ├── routingService.ts        # OSRM real-road routing
│   ├── mockStore.ts             # Mock data fallback
│   └── seedDatabase.ts          # Demo seed data
├── App.tsx                      # Main app component
├── types.ts                     # TypeScript interfaces
├── constants.ts                 # Mock data & constants
└── index.html                   # Entry HTML
```

---

## 📝 License

MIT License - Open Source

---

## 👥 Team

FloodRescue Connect - Hackathon 2026

---

> **💡 Tip for Judges**: Open 2 browser tabs - 1 as Victim (no login), 1 as Rescuer (logged in) to test the full flow!
