# Audio Recorder App

The application source code directory containing all React Native components and screen implementations for the Audio Recorder application.

## 📁 Directory Structure

```
app/
├── AudioRecorderApp.tsx      # Main app component
├── index.tsx                 # Entry point
├── components/               # Reusable UI components
│   ├── DeleteButton.tsx      # Button for deleting recordings
│   ├── EditButton.tsx        # Button for editing recordings
│   ├── PlayButton.tsx        # Button for playing audio files
│   ├── RecordButton.tsx      # Button for starting/stopping recordings
│   ├── RecordingItem.tsx     # Individual recording list item component
│   ├── RenameModal.tsx       # Modal for renaming recordings
│   ├── SearchBar.tsx         # Search input component
│   └── index.ts              # Component exports
└── src/
    ├── Components/           # Alternative component implementations
    │   ├── audioItem.tsx
    │   ├── RecordButton.tsx
    │   └── SearchBar.tsx
    ├── Screens/              # App screens/pages
    │   ├── HomeScreen.tsx    # Main home screen
    │   └── RecordScreen.tsx  # Recording interface
    ├── navigation/           # Navigation configuration
    │   └── AppNavigation.ts  # Navigation setup
    └── utils/                # Utility functions
        ├── audioStorage.ts   # Audio file storage management
        └── permissions.ts    # App permissions handling
```

## 🚀 Getting Started

### Installation

Install dependencies from the root directory:

```bash
npm install
```

### Running the App

Start the development server:

```bash
npx expo start
```

Then choose your platform:
- **a** - Android Emulator
- **i** - iOS Simulator
- **w** - Web browser
- **j** - Expo Go (on physical device)

## 📱 Components

### Core Components

- **RecordButton** - Initiates and stops audio recording with visual feedback
- **PlayButton** - Plays back recorded audio files
- **DeleteButton** - Removes recordings from storage
- **EditButton** - Allows renaming recordings
- **RenameModal** - Dialog for renaming recording files
- **RecordingItem** - Displays individual recordings with controls
- **SearchBar** - Filters recordings by name

### Screens

- **HomeScreen** - Main interface displaying all recordings with search and controls
- **RecordScreen** - Full recording interface with recording controls and visualization

## 🔧 Utilities

- **audioStorage.ts** - Handles storage, retrieval, and deletion of audio files
- **permissions.ts** - Manages microphone and storage permissions
- **AppNavigation.ts** - Configures app navigation structure

## 📝 Key Dependencies

- **expo-av** - Audio recording and playback
- **expo-file-system** - File system access
- **expo-media-library** - Media library integration
- **expo-router** - File-based routing
- **expo-document-picker** - File picker functionality
- **@react-navigation** - Navigation framework

## 🔐 Permissions Required

- Microphone access (for recording)
- File system read/write (for storage)
- Media library access (for playback)

## 💡 Development Tips

1. **Hot Reload** - Modify files in the `app` directory and see changes instantly
2. **File-based Routing** - Routes are automatically generated from the folder structure
3. **Component Organization** - Keep reusable components in the `components` folder
4. **Utilities** - Use the `utils` folder for shared logic and helper functions

## 📎 Related Documentation

- See [COMPONENT_ARCHITECTURE.md](../COMPONENT_ARCHITECTURE.md) for detailed component specifications
- See [COMPLETE_APP_DOCUMENTATION.md](../COMPLETE_APP_DOCUMENTATION.md) for comprehensive documentation
- See [SETUP_GUIDE.md](../SETUP_GUIDE.md) for detailed setup instructions
