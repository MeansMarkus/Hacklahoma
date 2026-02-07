# Mobile app options — build off this demo

You can keep **the same HTML/CSS/JS and SVG** and get a real mobile app. Here are the stacks that fit best.

---

## 1. **Capacitor** (recommended for “one codebase → app stores”)

**Stack:** Your current web app + [Capacitor](https://capacitorjs.com/) (by Ionic).

- **Reuse:** 100%. This project is already a single-page app; you wrap it in a native shell.
- **Output:** iOS app, Android app, and the same site for web. One codebase.
- **App Store / Play Store:** Yes. You get real native builds to submit.
- **Effort:** Add Capacitor, point it at your `www` (or current folder), run build. No rewrite.

**Quick start:**

```bash
# In your project folder (with index.html, styles.css, app.js)
npm init -y
npm install @capacitor/core @capacitor/cli
npx cap init "Life as a Mountain" com.you.mountain

# Tell Capacitor to use the current folder as web assets
# In capacitor.config.ts: set webDir to "." or "www" if you move files

npm install @capacitor/android @capacitor/ios
npx cap add android
npx cap add ios
npx cap sync
npx cap open android   # or: npx cap open ios
```

Then build and run from Android Studio / Xcode. When you change HTML/CSS/JS, run `npx cap sync` and rebuild.

**Why it fits:** You keep the mountain SVG, the same logic, and the same styling. Only add native plugins (push, haptics, etc.) if you want them later.

---

## 2. **PWA (Progressive Web App)** — installable on phones, no new stack

**Stack:** Same as now. Already set up in this repo (manifest, viewport, theme-color, touch-friendly buttons).

- **Reuse:** 100%. No new framework.
- **Output:** Users “Add to Home Screen” on iOS/Android; it opens fullscreen like an app.
- **App stores:** Not directly (you’d need a wrapper like Capacitor or TWA to get a store listing).
- **Effort:** Zero. Deploy the site over HTTPS; on mobile Chrome/Edge/Safari, use “Add to Home Screen.”

**To test:** Serve the folder over HTTPS (e.g. `npx serve .` on a tunnel, or deploy to Vercel/Netlify), open on your phone, then Add to Home Screen. It will use the same mountain UI and logic.

**Good for:** Fastest path to “feels like an app” on your phone and sharing with others. Later you can wrap this exact PWA in Capacitor for store distribution.

---

## 3. **React Native / Expo** — if you want to go full native UI later

**Stack:** React Native + Expo, possibly `react-native-svg` for the mountain.

- **Reuse:** Logic and concept; UI would be rewritten in React Native components.
- **Output:** Native iOS and Android apps, great performance and native feel.
- **Effort:** Higher. You’d rebuild the mountain (e.g. with SVG) and screens in RN; state and “ledges = tasks” logic port over.

**When to choose:** You want to learn React Native, need native modules (camera, sensors, etc.), or plan a bigger app with lots of native UI. Not the fastest way to “mobile from this demo,” but the most flexible long-term.

---

## Summary

| Goal | Stack | Reuse |
|------|--------|--------|
| Install on phone quickly, no new tools | **PWA** (already set up) | 100% |
| Same code → App Store & Play Store | **Capacitor** | 100% |
| Full native app, willing to rebuild UI | **React Native / Expo** | Logic + concept |

**Practical path:** Use the **PWA** now (deploy and “Add to Home Screen”). When you want store builds, add **Capacitor** around this same folder and keep building off the demo you like.
