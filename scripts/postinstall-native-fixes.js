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

const ttsGradle = `def safeExtGet(prop, fallback) {
    rootProject.ext.has(prop) ? rootProject.ext.get(prop) : fallback
}

apply plugin: 'com.android.library'

android {
    namespace "net.no_mad.tts"
    compileSdkVersion safeExtGet('compileSdkVersion', 36)

    defaultConfig {
        minSdkVersion safeExtGet('minSdkVersion', 24)
        targetSdkVersion safeExtGet('targetSdkVersion', 36)
        versionCode 1
        versionName "1.0"
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

writeIfExists(
  'node_modules/react-native-tts/android/build.gradle',
  ttsGradle,
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
 * Play Billing Library 8: react-native-iap 12.16 still compiles against PBL 7 APIs.
 * Patch the Play module so Google Play's 8.0.0+ requirement can be met.
 */
function patchPlayBillingV8() {
  const gradleProps = path.join(
    root,
    'node_modules/react-native-iap/android/gradle.properties',
  );
  if (fs.existsSync(gradleProps)) {
    const original = fs.readFileSync(gradleProps, 'utf8');
    const next = original.replace(
      /RNIap_playBillingSdkVersion=.*/,
      'RNIap_playBillingSdkVersion=8.3.0',
    );
    if (next !== original) {
      fs.writeFileSync(gradleProps, next);
      console.log(
        '[postinstall-native-fixes] RNIap Play Billing SDK -> 8.3.0',
      );
    }
  }

  const modulePath = path.join(
    root,
    'node_modules/react-native-iap/android/src/play/java/com/dooboolab/rniap/RNIapModule.kt',
  );
  if (!fs.existsSync(modulePath)) {
    return;
  }
  let src = fs.readFileSync(modulePath, 'utf8');
  const before = src;

  if (!src.includes('PendingPurchasesParams')) {
    src = src.replace(
      'import com.android.billingclient.api.ProductDetails\n',
      'import com.android.billingclient.api.PendingPurchasesParams\nimport com.android.billingclient.api.ProductDetails\n',
    );
  }

  src = src.replace(
    /BillingClient\.newBuilder\(reactContext\)\.enablePendingPurchases\(\)/g,
    'BillingClient.newBuilder(reactContext).enablePendingPurchases(PendingPurchasesParams.newBuilder().enableOneTimeProducts().build())',
  );

  src = src.replace(
    'billingClient.queryProductDetailsAsync(params) { billingResult, skuDetailsList ->',
    'billingClient.queryProductDetailsAsync(params) { billingResult, productDetailsResult ->',
  );
  src = src.replace(
    'val items = Arguments.createArray()\n                for (skuDetails in skuDetailsList) {',
    'val skuDetailsList = productDetailsResult.productDetailsList\n                val items = Arguments.createArray()\n                for (skuDetails in skuDetailsList) {',
  );

  if (src.includes('queryPurchaseHistoryAsync')) {
    src = src.replace(
      /import com\.android\.billingclient\.api\.PurchaseHistoryRecord\n/,
      '',
    );
    src = src.replace(
      /import com\.android\.billingclient\.api\.QueryPurchaseHistoryParams\n/,
      '',
    );
    src = src.replace(
      /billingClient\.queryPurchaseHistoryAsync\(\s*QueryPurchaseHistoryParams[\s\S]*?\) \{ billingResult: BillingResult, purchaseHistoryRecordList: MutableList<PurchaseHistoryRecord>\? ->[\s\S]*?if \(!isValidResult\(billingResult, promise\)\) return@queryPurchaseHistoryAsync[\s\S]*?purchaseHistoryRecordList\?\.forEach/,
      `billingClient.queryPurchasesAsync(
                QueryPurchasesParams
                    .newBuilder()
                    .setProductType(
                        if (type == "subs") BillingClient.ProductType.SUBS else BillingClient.ProductType.INAPP,
                    ).build(),
            ) { billingResult: BillingResult, purchaseList: List<Purchase>? ->

                if (!isValidResult(billingResult, promise)) return@queryPurchasesAsync

                Log.d(TAG, purchaseList.toString())
                val items = Arguments.createArray()
                purchaseList?.forEach`,
    );
    src = src.replace(
      'return@queryPurchaseHistoryAsync',
      'return@queryPurchasesAsync',
    );
  }

  if (src !== before) {
    fs.writeFileSync(modulePath, src);
    console.log(
      '[postinstall-native-fixes] patched RNIapModule.kt for Play Billing 8',
    );
  }
}

patchPlayBillingV8();

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
