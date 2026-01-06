# 🚀 Quick Setup Guide - Audio Recorder App

## ⚡ Quick Start for Evaluators

### 1. Install Dependencies
```bash
npm install
```

### 2. Start the App
```bash
npx expo start
```

### 3. Run on Device
- **Android**: Press `a` in terminal or scan QR with Expo Go
- **iOS**: Press `i` in terminal or scan QR with Expo Go
- **Physical Device**: Scan QR code with Expo Go app

### 4. Test Features

#### Recording Test
1. Tap "🎤 Record" button
2. Grant microphone permission (if prompted)
3. Record a short voice note
4. Tap "⏹ Stop Recording"

#### Playback Test
1. Tap on any recorded note to play
2. Observe real-time duration display
3. Tap again to pause/stop

#### Search Test
1. Type in the search bar
2. Watch real-time filtering

#### Rename Test
1. Tap "✏️" on any recording
2. Enter new name in modal
3. Save changes

#### Delete Test
1. Tap "🗑️" on any recording
2. Confirm deletion in alert

#### Persistence Test
1. Create recordings
2. Close and restart app
3. Verify recordings persist

---

## 📱 Device Requirements

### Minimum Requirements
- **Android**: API Level 21+ (Android 5.0)
- **iOS**: iOS 11.0+
- **Memory**: 2GB+ RAM recommended
- **Storage**: 100MB+ free space

### Permissions Required
- **Microphone**: For recording audio
- **Storage**: For saving audio files

---

## 🔧 Troubleshooting

### Common Issues

#### Recording Not Working
- Ensure device has microphone
- Grant microphone permission
- Use physical device (web recording not supported)

#### Audio Not Playing
- Check device volume
- Ensure file was saved properly
- Try restarting the app

#### App Not Starting
- Run `npm install` to ensure dependencies
- Clear Expo cache: `npx expo start -c`
- Update Expo Go app

---

## 🎯 Evaluation Checklist

### Core Features (All Implemented)
- [ ] Audio recording with microphone
- [ ] Audio playback with duration display
- [ ] User playback controls
- [ ] Persistent audio storage
- [ ] Audio renaming functionality
- [ ] Search by name functionality

### UI/UX Features
- [ ] Clean, modern interface
- [ ] Intuitive navigation
- [ ] Visual feedback for actions
- [ ] Responsive design
- [ ] Error handling

### Technical Features
- [ ] Component-based architecture
- [ ] TypeScript implementation
- [ ] Proper error handling
- [ ] Memory management
- [ ] Cross-platform compatibility

---

## 📞 Support

For any evaluation issues:
1. Check this guide first
2. Review the main documentation
3. Test on a physical device if emulator issues occur

---

**Note**: This app is designed for physical devices or emulators. Web platform has limited functionality due to browser restrictions on microphone access.
