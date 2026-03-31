# Native Apps — Tauri v2 (Desktop + Android)

## Overview

Both desktop and Android apps share the exact same `apps/web` SvelteKit source. Tauri v2 wraps the built web output in a native shell. No code duplication — only platform-specific capabilities and build targets differ.

```
apps/web/build/          ← SvelteKit output (shared)
         ↓                        ↓
apps/desktop/src-tauri/   → macOS .app / Win .exe / Linux .deb
         ↓
apps/desktop/src-tauri/   → Android .apk / .aab  (same Cargo project)
```

---

## Tauri v2 Configuration

```json
// apps/desktop/src-tauri/tauri.conf.json
{
  "build": {
    "frontendDist": "../../web/build",
    "devUrl": "http://localhost:5173",
    "beforeDevCommand": "cd ../../web && vp dev",
    "beforeBuildCommand": "cd ../../web && vp build"
  },
  "bundle": {
    "identifier": "dev.studyscroll.app",
    "productName": "StudyScroll",
    "version": "0.1.0",
    "copyright": "© 2026 StudyScroll",
    "category": "Education",
    "targets": "all",
    "icon": [
      "icons/32x32.png",
      "icons/128x128.png",
      "icons/128x128@2x.png",
      "icons/icon.icns",
      "icons/icon.ico"
    ],
    "resources": [],
    "externalBin": []
  },
  "app": {
    "windows": [
      {
        "title": "StudyScroll",
        "width": 1280,
        "height": 800,
        "minWidth": 375,
        "minHeight": 600,
        "decorations": true,
        "transparent": false,
        "resizable": true,
        "fullscreen": false,
        "center": true
      }
    ],
    "security": {
      "csp": "default-src 'self'; script-src 'self'; connect-src 'self' https://*.studyscroll.dev https://*.googleapis.com https://*.livekit.cloud wss://*.livekit.cloud"
    }
  }
}
```

### Tauri Capabilities

```json
// apps/desktop/src-tauri/capabilities/default.json
{
  "identifier": "default",
  "description": "Default capabilities for StudyScroll",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "shell:allow-open",
    "notification:default",
    "fs:allow-app-read",
    "fs:allow-app-write",
    "http:default"
  ]
}
```

### Rust Main

```rust
// apps/desktop/src-tauri/src/main.rs
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use tauri::{Manager, Runtime};

#[tauri::command]
async fn share(url: String, title: String) -> Result<(), String> {
    // Platform-specific share implementation
    #[cfg(target_os = "android")]
    {
        // Use Android Intent
    }
    #[cfg(not(target_os = "android"))]
    {
        // Open URL in default browser on desktop
        open::that(&url).map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[tauri::command]
async fn get_download_dir() -> Result<String, String> {
    tauri::api::path::download_dir()
        .map(|p| p.to_string_lossy().to_string())
        .ok_or_else(|| "Could not get download directory".into())
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_http::init())
        .invoke_handler(tauri::generate_handler![share, get_download_dir])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

---

## Build Commands

```bash
# Prerequisites
cargo install tauri-cli@^2

# Development (hot reload via web dev server)
cd apps/desktop
tauri dev

# Production desktop build
vp run build:web     # Build SvelteKit first
vp run build:desktop # Then Tauri wraps it

# Android setup (one time)
tauri android init

# Android development
tauri android dev

# Android production build
vp run build:web
vp run build:android
# Output: apps/desktop/src-tauri/gen/android/app/build/outputs/apk/
```

---

## Android-Specific Setup

### Prerequisites

```bash
# 1. Install Android Studio
# 2. Via SDK Manager install:
#    - Android SDK Platform 34 (API 34)
#    - Android SDK Build-Tools 34
#    - NDK (Side by side) 26.x

# 3. Add to ~/.zshrc or ~/.bashrc:
export ANDROID_HOME=$HOME/Android/Sdk
export NDK_HOME=$ANDROID_HOME/ndk/$(ls $ANDROID_HOME/ndk | tail -n 1)
export PATH=$PATH:$ANDROID_HOME/emulator:$ANDROID_HOME/tools:$ANDROID_HOME/platform-tools

# 4. Add Rust Android targets
rustup target add \
  aarch64-linux-android \
  armv7-linux-androideabi \
  i686-linux-android \
  x86_64-linux-android
```

### App Signing (Release)

```bash
# Generate keystore (do once, keep secure)
keytool -genkey -v \
  -keystore studyscroll.keystore \
  -alias studyscroll \
  -keyalg RSA -keysize 2048 \
  -validity 10000

# Set in environment for CI
ANDROID_KEYSTORE_PATH=/path/to/studyscroll.keystore
ANDROID_KEY_ALIAS=studyscroll
ANDROID_KEYSTORE_PASSWORD=your-password
ANDROID_KEY_PASSWORD=your-key-password
```

### tauri.android.conf.json

```json
{
  "bundle": {
    "identifier": "dev.studyscroll.app",
    "android": {
      "minSdkVersion": 24,
      "compileSdkVersion": 34,
      "targetSdkVersion": 34,
      "versionCode": 1,
      "signingConfig": {
        "storeFile": "../../studyscroll.keystore",
        "storePassword": "${ANDROID_KEYSTORE_PASSWORD}",
        "keyAlias": "studyscroll",
        "keyPassword": "${ANDROID_KEY_PASSWORD}"
      }
    }
  }
}
```

---

## Platform-Aware Component Patterns

```svelte
<!-- Conditional rendering based on platform -->
<script lang="ts">
  import { isTauri, isAndroid, isDesktop, isWeb } from '$lib/utils/platform';
</script>

<!-- Native file picker vs web input -->
{#if isDesktop}
  <button onclick={openNativeFilePicker}>Choose File</button>
{:else}
  <input type="file" accept=".pdf,image/*" />
{/if}

<!-- Native notifications vs web push -->
{#if isTauri}
  <!-- Tauri notification plugin handles this -->
{:else}
  <!-- Web Push API -->
{/if}

<!-- Android-specific bottom sheet -->
{#if isAndroid}
  <BottomSheet />
{:else}
  <Dialog />
{/if}
```

### Native Push Notifications (Tauri)

```typescript
// src/lib/utils/push.ts (extended for Tauri)
import { isTauri, isAndroid } from './platform';

export async function showNotification(title: string, body: string, url?: string) {
  if (isTauri) {
    const { sendNotification } = await import('@tauri-apps/plugin-notification');
    await sendNotification({ title, body });
    // Navigate on click — needs a Tauri event listener
  } else {
    // Web Push (service worker notification)
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/icon-192.png' });
    }
  }
}

export async function requestNotificationPermission() {
  if (isTauri) {
    const { isPermissionGranted, requestPermission } = await import('@tauri-apps/plugin-notification');
    const granted = await isPermissionGranted();
    if (!granted) await requestPermission();
    return granted;
  } else {
    const result = await Notification.requestPermission();
    return result === 'granted';
  }
}
```

### Offline Video Downloads (Tauri only)

```typescript
// src/lib/utils/downloads.ts
import { isTauri } from './platform';

export async function downloadVideoForOffline(post: Post, signedUrl: string) {
  if (!isTauri) {
    throw new Error('Offline downloads require the desktop or Android app');
  }

  const { download } = await import('@tauri-apps/plugin-upload');
  const { appDataDir } = await import('@tauri-apps/api/path');

  const dir = await appDataDir();
  const filename = `${post.id}.mp4`;
  const destPath = `${dir}/downloads/${filename}`;

  await download(signedUrl, destPath, (progress) => {
    // emit progress event
  });

  // Save reference to IndexedDB
  await saveDownloadRecord({ postId: post.id, localPath: destPath, expiresAt: Date.now() + 86400000 });

  return destPath;
}
```

---

## GitHub Actions — Desktop + Android CI

```yaml
# .github/workflows/native-builds.yml
name: Native Builds

on:
  push:
    tags: ['v*']

jobs:
  build-desktop:
    strategy:
      matrix:
        os: [ubuntu-latest, macos-latest, windows-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: dtolnay/rust-toolchain@stable

      - run: npm install -g vite-plus
      - run: vp install
      - run: vp run build:web
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
          BETTER_AUTH_SECRET: ${{ secrets.BETTER_AUTH_SECRET }}
          PUBLIC_APP_URL: https://app.studyscroll.dev

      - uses: tauri-apps/tauri-action@v0
        with:
          projectPath: apps/desktop
          tauriScript: cargo tauri
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          TAURI_PRIVATE_KEY: ${{ secrets.TAURI_PRIVATE_KEY }}
          TAURI_KEY_PASSWORD: ${{ secrets.TAURI_KEY_PASSWORD }}

  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with: { node-version: 22 }
      - uses: actions/setup-java@v4
        with: { java-version: '17', distribution: 'temurin' }
      - uses: dtolnay/rust-toolchain@stable
      - run: rustup target add aarch64-linux-android armv7-linux-androideabi

      - uses: android-actions/setup-android@v3

      - run: npm install -g vite-plus
      - run: vp install
      - run: vp run build:web
      - run: |
          cd apps/desktop
          tauri android build --apk --release
        env:
          ANDROID_KEYSTORE_PATH: ${{ secrets.ANDROID_KEYSTORE }}
          ANDROID_KEYSTORE_PASSWORD: ${{ secrets.ANDROID_KEYSTORE_PASSWORD }}
          ANDROID_KEY_ALIAS: studyscroll
          ANDROID_KEY_PASSWORD: ${{ secrets.ANDROID_KEY_PASSWORD }}

      - uses: actions/upload-artifact@v4
        with:
          name: android-apk
          path: apps/desktop/src-tauri/gen/android/app/build/outputs/apk/release/
```
