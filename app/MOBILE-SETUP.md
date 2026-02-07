# Turn this into a mobile app (Capacitor)

This project is already set up for **Capacitor**. Follow these steps to build and run the Android app (and optionally iOS).

## 1. Install dependencies

```bash
cd Hacklahoma/app
npm install
```

This installs React, Vite, Tailwind, and **Capacitor** (core, CLI, and Android).

## 2. Add the Android project (first time only)

```bash
npx cap add android
```

This creates an `android/` folder with a native Android project that loads your web app.

*(For iOS: `npx cap add ios`. You need a Mac and Xcode.)*

## 3. Build the web app and sync to native

Every time you change the React app, run:

```bash
npm run build
npx cap sync
```

Or use the shortcut:

```bash
npm run cap:sync
```

That builds the app into `dist/` and copies it into the Android (and iOS) project.

## 4. Open and run on device or emulator

```bash
npx cap open android
```

Android Studio opens. From there:

- Pick a device or emulator and click **Run** (green play button).
- To use a physical phone: enable **Developer options** and **USB debugging**, then connect via USB.

Same for iOS:

```bash
npx cap open ios
```

Then run from Xcode on a simulator or device.

---

## Quick reference

| What you want to do              | Command              |
|---------------------------------|----------------------|
| Build web + copy into Android   | `npm run cap:sync`   |
| Open project in Android Studio  | `npm run cap:android`|
| Open project in Xcode (Mac)     | `npm run cap:ios`    |

## App stores later

- **Android:** In Android Studio, use **Build → Generate Signed Bundle / APK** to create an AAB, then upload to Google Play Console.
- **iOS:** In Xcode, use **Product → Archive**, then upload to App Store Connect.

Your app ID is set in `capacitor.config.js` as `com.lifeasamountain.app`. Change it if you want a different package name before publishing.
