/**
 * Apply Gradle / source fixes for outdated native modules under Yarn Berry.
 * Runs after yarn install so RN 0.83 / AGP 8+ / New Arch can build.
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

const voiceGradle = `apply plugin: 'com.android.library'

def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

android {
    namespace "com.wenkesj.voice"
    compileSdkVersion safeExtGet('compileSdkVersion', 36)

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 24)
        targetSdkVersion safeExtGet('targetSdkVersion', 36)
        versionCode 1
        versionName "1.0"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}

repositories {
    google()
    mavenCentral()
}

dependencies {
    implementation 'com.facebook.react:react-android'
}
`;

function writeIfExists(relPath, contents) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(path.dirname(full))) {
    console.warn('[postinstall-native-fixes] skip missing:', relPath);
    return;
  }
  fs.writeFileSync(full, contents);
  console.log('[postinstall-native-fixes] updated', relPath);
}

writeIfExists(
  'node_modules/@react-native-voice/voice/android/build.gradle',
  voiceGradle,
);

function stripSupportDeps(relPath) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) {
    return;
  }
  const original = fs.readFileSync(full, 'utf8');
  const next = original
    .replace(
      /^\s*implementation\s+"com\.android\.support:support-annotations:.*$/gm,
      '',
    )
    .replace(
      /^\s*implementation\s+"com\.android\.support:customtabs:.*$/gm,
      '',
    );
  if (next !== original) {
    fs.writeFileSync(full, next);
    console.log('[postinstall-native-fixes] stripped support deps', relPath);
  }
}

stripSupportDeps('node_modules/react-native-iap/android/build.gradle');

/**
 * RN 0.83 / New Arch: ReactContextBaseJavaModule no longer exposes
 * Kotlin property `currentActivity`. Use reactApplicationContext.currentActivity.
 */
function patchCurrentActivity(filePath) {
  const full = path.join(root, filePath);
  if (!fs.existsSync(full)) {
    return;
  }
  const original = fs.readFileSync(full, 'utf8');
  if (!original.includes('currentActivity')) {
    return;
  }
  // Avoid double-patching
  if (original.includes('reactApplicationContext.currentActivity')) {
    // Still replace bare currentActivity that aren't already qualified
  }
  const next = original.replace(
    /(?<!reactApplicationContext\.)(?<!get)currentActivity\b/g,
    'reactApplicationContext.currentActivity',
  );
  if (next !== original) {
    fs.writeFileSync(full, next);
    console.log('[postinstall-native-fixes] patched currentActivity', filePath);
  }
}

function walkKotlin(dir, visitor) {
  if (!fs.existsSync(dir)) {
    return;
  }
  for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkKotlin(full, visitor);
    } else if (entry.name.endsWith('.kt') || entry.name.endsWith('.java')) {
      visitor(full);
    }
  }
}

walkKotlin(
  path.join(root, 'node_modules/react-native-iap/android/src'),
  full => patchCurrentActivity(path.relative(root, full)),
);

/**
 * Windows + NDK 27: worklets/reanimated may fail to link libc++ unless
 * c++_shared is explicit in target_link_libraries (SWMansion #9444).
 */
function ensureCppShared(relPath, targetNeedle) {
  const full = path.join(root, relPath);
  if (!fs.existsSync(full)) {
    return;
  }
  let contents = fs.readFileSync(full, 'utf8');
  if (contents.includes('c++_shared')) {
    return;
  }
  if (!contents.includes(targetNeedle)) {
    return;
  }
  // Insert c++_shared after the first target_link_libraries( target
  const next = contents.replace(
    new RegExp(`(target_link_libraries\\(\\s*${targetNeedle}\\b)`),
    `$1\n  c++_shared`,
  );
  if (next !== contents) {
    fs.writeFileSync(full, next);
    console.log('[postinstall-native-fixes] linked c++_shared in', relPath);
  }
}

ensureCppShared(
  'node_modules/react-native-worklets/android/CMakeLists.txt',
  'worklets',
);
ensureCppShared(
  'node_modules/react-native-reanimated/android/CMakeLists.txt',
  'reanimated',
);
