# 🚨 FloodRescue Connect

A real-time emergency response application that connects flood victims with rescuers using interactive maps and AI-powered risk assessment.

## ✨ Features

### For Victims
- 🆘 **Emergency SOS Broadcasting** - Send distress signals with location, photos, and situation details
- 📍 **Real-time Tracking** - Monitor rescuer location and status on the map
- 💬 **Direct Communication** - Chat and call rescuers during rescue operations
- 📱 **Request Status Monitoring** - Track rescue progress through multiple stages
- 🔍 **Request Lookup** - Find existing requests using phone number

### For Rescuers
- 🗺️ **Live Map Dashboard** - View all active SOS requests with priority sorting
- 🤖 **AI Risk Assessment** - Gemini-powered analysis providing risk levels, hazard warnings, and equipment recommendations
- 📸 **Proof Documentation** - Upload rescue completion photos
- 💬 **Victim Communication** - Built-in chat and calling capabilities
- 📊 **Smart Prioritization** - Critical requests and newest alerts highlighted

## 🎯 Rescue Workflow

```
1. OPEN → Victim sends SOS, waiting for rescuer
2. IN_PROGRESS → Rescuer accepted and en route
3. PENDING_CONFIRMATION → Rescuer completed, waiting victim confirmation
4. RESOLVED → Victim confirmed safe
```

## 🛠️ Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS
- **Maps**: OpenStreetMap + React-Leaflet
- **Backend**: Firebase (Firestore + Authentication)
- **AI**: Google Gemini Flash 3
- **Icons**: Lucide React

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Firebase project with Firestore enabled
- Gemini API key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Flood-Rescue
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Firebase**
   - Update Firebase credentials in `services/firebase.ts` with your project configuration
   - Create a Firestore database in the Firebase Console
   - Set Firestore Security Rules to **Test Mode** for development

4. **Set up Gemini API**
   - Create a `.env.local` file in the root directory
   - Add your Gemini API key:
     ```
     API_KEY=your_gemini_api_key_here
     ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   - Navigate to `http://localhost:5173`
   - Grant location permissions when prompted

## 📦 Build for Production

```bash
npm run build
npm run preview
```

## 🔐 Authentication

### Rescuer Access
Rescuers must create an account or log in using email/password authentication. Click the **"Rescuer Login"** button in the top-right corner to access the authentication modal.

### Victim Access
No authentication required. Victims can immediately send SOS requests and will be prompted for necessary permissions (location, camera).

## 🗂️ Project Structure

```
Flood-Rescue/
├── components/
│   ├── ChatComponent.tsx      # Real-time messaging
│   ├── MapComponent.tsx        # OpenStreetMap integration
│   ├── RescuerView.tsx         # Rescuer dashboard & actions
│   └── SOSForm.tsx             # Victim SOS request form
├── services/
│   ├── firebase.ts             # Firebase config & operations
│   ├── geminiService.ts        # AI analysis integration
│   └── mockStore.ts            # Mock data (unused in production)
├── App.tsx                     # Main application component
├── types.ts                    # TypeScript interfaces
├── constants.ts                # App constants & mock data
└── index.html                  # HTML entry point
```

## 🎨 UI/UX Highlights

- Modern dark theme with glassmorphism effects
- Smooth animations and transitions
- Responsive design for mobile and desktop
- Smart color coding for severity levels
- Real-time map updates with route visualization

## 🔑 Permissions Required

The app requests the following permissions:
- **Geolocation** - For accurate victim/rescuer positioning
- **Camera** - For uploading situation/proof photos
- **Microphone** - For potential future voice features

## 📝 License

This project is open source and available under the MIT License.

## 🙏 Acknowledgments

- OpenStreetMap for map tiles
- Firebase for real-time backend
- Google Gemini for AI capabilities
- React community for excellent tools and libraries
