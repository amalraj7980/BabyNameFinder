# React Native 0.70.4 → 0.83.1 upgrade notes

Branch: `chore/upgrade-rn-0.70-to-0.83`

## Versions

| Package | Version |
|---------|---------|
| react-native | **0.83.1** |
| react | **19.2.0** |
| react-native-reanimated | 4.5.3 |
| react-native-worklets | 0.11.1 |
| react-native-screens | 4.16.0 (pinned; 4.27+ codegen fails on RN 0.83) |
| @react-navigation/* | 7.x (unified; was drawer 5 + native/stack 6) |
| @react-native-firebase/* | 22.4.0 |
| react-native-iap | 12.16.4 |

## Architecture decision

**New Architecture is enabled** (`newArchEnabled=true`).

Reanimated 3 (Paper) only supports up to RN 0.81. RN 0.83 requires Reanimated 4, which requires New Architecture + `react-native-worklets`. Hermes is enabled.

## Replaced / removed packages

| Old | New / action |
|-----|----------------|
| `rn-fetch-blob` | Removed; cache paths use `react-native-fs` |
| `react-native-swipe-cards` | `react-native-deck-swiper` |
| `react-native-swiper` | `react-native-pager-view` |
| `react-native-deep-linking` | Unused; React Navigation `linking` kept |
| `react-native-listview` | Unused; removed |
| `react-native-elements` | Unused; removed |
| `react-native-image-filter-kit` | Unused (commented demo only); removed |
| `react-native-range-slider` | Unused imports only; removed |
| `deprecated-react-native-prop-types` | Removed |
| `react-native-image-picker` | Upgraded to v8 (no active call sites) |
| `react-native-audio-recorder-player` | **Removed** — incompatible with New Arch / Nitro on this stack. AiAssistant speech uses `@react-native-voice/voice` only. File-based recording hooks are no-ops pending a Nitro Sound follow-up. |
| `patches/` | None existed; obsolete `patch-package` postinstall replaced by `scripts/postinstall-native-fixes.js` |

## Native fixes applied on install

`scripts/postinstall-native-fixes.js` (postinstall):

1. Modernize `@react-native-voice/voice` Android `build.gradle` (remove `jcenter`, add namespace/compileSdk).
2. Patch `react-native-iap` `currentActivity` → `reactApplicationContext.currentActivity`.
3. Link `c++_shared` in worklets/reanimated CMakeLists (Windows / NDK 27 linker).
4. Strip obsolete `com.android.support` deps from IAP gradle.

## Android build notes (Windows)

- Use a **space-free** SDK path in `android/local.properties` (e.g. `C:\\projects\\Sdk`). NDK under `C:\Users\Amal Raj\...` can produce `CLANG_~1` and fail C++ linking.
- Prefer short `GRADLE_USER_HOME` (e.g. `C:\g`) to avoid path-length limits.
- Verified: `assembleDebug` **BUILD SUCCESSFUL** → `android/app/build/outputs/apk/debug/app-debug.apk`

```powershell
$env:GRADLE_USER_HOME='C:\g'
$env:ANDROID_HOME='C:\projects\Sdk'
cd android
.\gradlew.bat assembleDebug -PreactNativeArchitectures=arm64-v8a
```

## iOS (not run on this Windows machine)

1. Node ≥ 20
2. `bundle install` (updated Gemfile)
3. `cd ios && bundle exec pod install`
4. Open `MyProject.xcworkspace`, build, or `yarn ios`
5. Confirm Firebase pods / modular headers if static frameworks fail
6. Re-test Voice, IAP, deep links on device

## Smoke checklist

| Area | Status |
|------|--------|
| Android debug assemble | **Pass** |
| App launch on device/emulator | Pending manual |
| Firebase auth | Pending manual |
| Navigation / drawer | Pending manual (Nav 7 API) |
| Image picker | Pending (dep upgraded; unused in app code) |
| Audio record/play | **Voice only**; ARP removed — verify AiAssistant |
| IAP screens load | Pending manual (native module patched) |
| Net info / offline | Pending manual |
| Deep linking | Pending manual (manifest + linking config preserved) |
| Share / file download | Pending manual |

## Remaining risks

- `react-native-fast-image` peer warning on React 19; may need `@d11/react-native-fast-image` later.
- `react-native-iap` 12.x is aging; plan Nitro/IAP 14+ migration.
- Re-introduce file recording via `react-native-nitro-sound` if product needs it.
- Full multi-ABI release builds and Play signing not verified in this pass.
- iOS pods / Xcode build unverified here.
