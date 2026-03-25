# Audio Recorder - Render Deployment

## 🚀 Deploy to Render

This guide will help you deploy your Audio Recorder app to Render.com.

### Prerequisites
- Render.com account
- GitHub repository connected to Render
- Node.js and npm installed

### Step 1: Connect GitHub to Render
1. Go to [Render.com](https://render.com)
2. Click "New +" → "Web Service"
3. Connect your GitHub repository: `https://github.com/Sbonelo2/Audio-Recorder`
4. Select the `main` branch

### Step 2: Configure Build Settings
```yaml
# render.yaml (already created in your repo)
services:
  - type: web
    name: audio-recorder-web
    env: static
    buildCommand: npm run build
    staticPublishPath: ./dist
    routes:
      - type: rewrite
        source: /.*
        destination: /index.html
    envVars:
      - key: NODE_ENV
        value: production
```

### Step 3: Add Build Script
Add this to your `package.json`:
```json
{
  "scripts": {
    "build": "expo build:web",
    "start": "expo start",
    "android": "expo start --android",
    "ios": "expo start --ios"
  }
}
```

### Step 4: Deploy
1. Click "Create Web Service"
2. Render will automatically build and deploy
3. Your app will be available at: `https://audio-recorder-web.onrender.com`

### Features Available on Render
- ✅ **Recording**: Full audio recording functionality
- ✅ **Playback**: Complete audio controls
- ✅ **Search**: Real-time filtering
- ✅ **Rename**: Two ways to rename recordings
- ✅ **Delete**: With confirmation dialogs
- ✅ **Storage**: Persistent across sessions
- ✅ **Responsive**: Works on all devices

### Deployment URL
Once deployed, your app will be available at:
`https://your-service-name.onrender.com`

### Notes
- Render automatically rebuilds on GitHub push
- Free tier includes SSL certificate
- Static site deployment for React Native Web
- Custom domain can be added later

### Troubleshooting
If build fails:
1. Check `package.json` has build script
2. Ensure `render.yaml` is in root
3. Check Render build logs for errors
4. Verify all dependencies are installed

🎉 **Your Audio Recorder app will be live on Render!**
