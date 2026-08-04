/**
 * One-shot restructure: CareerMate-style screen folders + extracted styles.
 * Run: node scripts/restructureScreens.js
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const SCREENS = path.join(ROOT, 'src', 'screens');

const MAP = {
  // auth
  SignInScreen: 'auth',
  SignUpScreen: 'auth',
  ForgotPasswordScreen: 'auth',
  SplashScreen: 'auth',
  LandingScreen: 'auth',
  // home / names
  BabyNamesScreen: 'home',
  NameInformation: 'home',
  TheWholeLIst: 'home',
  AiAssistant: 'home',
  // likes
  LikeListScreen: 'likes',
  LikeFilterScreen: 'likes',
  DislikeListScreen: 'likes',
  DislikeFilterScreen: 'likes',
  // search
  SearchScreen: 'search',
  MainSearchScreen: 'search',
  NameFilterSearch: 'search',
  // legal
  PrivacyPolicy: 'legal',
  TermsOfService: 'legal',
  // share
  SpreadTheWord: 'share',
  // premium
  InAppPurchase: 'premium',
};

function toStylesFileName(base) {
  // BabyNamesScreen -> babyNamesScreenStyles.js
  const camel = base.charAt(0).toLowerCase() + base.slice(1);
  return `${camel}Styles.js`;
}

function findStyleSheetBlock(content) {
  // Find last uncommented `const styles = StyleSheet.create(`
  const re = /(?:^|\n)(const styles = StyleSheet\.create\()/g;
  let match;
  let last = null;
  while ((match = re.exec(content)) !== null) {
    // skip if line is commented
    const lineStart = content.lastIndexOf('\n', match.index) + 1;
    const line = content.slice(lineStart, match.index + match[0].length);
    if (line.trim().startsWith('//')) continue;
    last = { index: match.index === 0 ? 0 : match.index + 1, open: match[1] };
  }
  if (!last) return null;

  const start = last.index;
  const createStart = content.indexOf('StyleSheet.create(', start);
  const parenStart = content.indexOf('(', createStart);
  let depth = 0;
  let end = -1;
  for (let i = parenStart; i < content.length; i++) {
    const ch = content[i];
    if (ch === '(') depth++;
    else if (ch === ')') {
      depth--;
      if (depth === 0) {
        // include trailing `);`
        end = i + 1;
        if (content[end] === ';') end++;
        break;
      }
    }
  }
  if (end < 0) return null;
  return { start, end, block: content.slice(start, end) };
}

function rewriteImports(content, depth) {
  // ../X -> ../../X for one level deeper (feature folder)
  const prefix = '../'.repeat(depth);
  const fromPrefix = '../'.repeat(depth - 1) || './';

  // Only rewrite relative imports that go up
  return content.replace(
    /from\s+['"](\.\.\/[^'"]+)['"]/g,
    (full, rel) => {
      // already correct if we're not adjusting
      // old: from '../styles' while in screens/
      // new: from '../../styles' while in screens/auth/
      if (rel.startsWith('../')) {
        const rest = rel.replace(/^\.\.\//, '');
        return `from '${prefix}${rest}'`;
      }
      return full;
    },
  );
}

function extractColorsImport(stylesBlock) {
  return stylesBlock.includes('Colors.') || stylesBlock.includes('Colors,');
}

function processFile(baseName, folder) {
  const srcPath = path.join(SCREENS, `${baseName}.js`);
  if (!fs.existsSync(srcPath)) {
    console.warn('Missing', srcPath);
    return null;
  }

  let content = fs.readFileSync(srcPath, 'utf8');
  const destDir = path.join(SCREENS, folder);
  fs.mkdirSync(destDir, { recursive: true });
  fs.mkdirSync(path.join(destDir, 'components'), { recursive: true });

  const stylesName = toStylesFileName(baseName);
  const styleInfo = findStyleSheetBlock(content);

  let screenContent = content;
  if (styleInfo) {
    const stylesBlock = styleInfo.block.trim();
    const needsColors = extractColorsImport(stylesBlock);
    const needsStyleSheet = true;

    let stylesFile = '';
    stylesFile += "import {StyleSheet} from 'react-native';\n";
    if (needsColors) {
      stylesFile += "import {Colors} from '../../styles';\n";
    }
    stylesFile += '\n';
    // Replace `const styles =` with `export const styles =` or export default
    stylesFile += stylesBlock.replace(/^const styles =/, 'export const styles =');
    stylesFile += '\n';

    fs.writeFileSync(path.join(destDir, stylesName), stylesFile, 'utf8');

    // Remove styles block from screen and add import
    screenContent =
      content.slice(0, styleInfo.start).replace(/\s*$/, '\n') +
      content.slice(styleInfo.end);

    // Remove StyleSheet from RN import if unused
    // Add styles import
    const stylesImport = `import {styles} from './${stylesName.replace(/\.js$/, '')}';\n`;

    // Place after last import
    const importMatches = [...screenContent.matchAll(/^import .+;$/gm)];
    if (importMatches.length) {
      const last = importMatches[importMatches.length - 1];
      const insertAt = last.index + last[0].length;
      screenContent =
        screenContent.slice(0, insertAt) +
        '\n' +
        stylesImport +
        screenContent.slice(insertAt);
    } else {
      screenContent = stylesImport + screenContent;
    }

    // Clean StyleSheet from react-native import if no longer used
    if (!screenContent.includes('StyleSheet.')) {
      screenContent = screenContent
        .replace(/,?\s*StyleSheet\s*,?/g, match => {
          // careful - only in import braces
          return match;
        });
      // simpler: remove StyleSheet from destructured RN import
      screenContent = screenContent.replace(
        /import\s*\{([^}]+)\}\s*from\s*['"]react-native['"]/,
        (m, inner) => {
          const parts = inner
            .split(',')
            .map(s => s.trim())
            .filter(Boolean)
            .filter(s => s !== 'StyleSheet');
          return `import {\n  ${parts.join(',\n  ')}\n} from 'react-native'`;
        },
      );
    }
  }

  // Rewrite ../ imports for depth 2 (screens/feature/)
  screenContent = rewriteImports(screenContent, 2);

  // Fix accidental over-prefix: if something already had ../../ it becomes ../../../
  // Our rewrite always strips one ../ and adds depth*../ — for files that already
  // only used single ../ this is correct.

  const destScreen = path.join(destDir, `${baseName}.js`);
  fs.writeFileSync(destScreen, screenContent, 'utf8');
  console.log('OK', folder + '/' + baseName);
  return { folder, baseName, stylesName: styleInfo ? stylesName : null };
}

function writeBarrels(results) {
  const byFolder = {};
  results.forEach(r => {
    if (!r) return;
    byFolder[r.folder] = byFolder[r.folder] || [];
    byFolder[r.folder].push(r.baseName);
  });

  Object.entries(byFolder).forEach(([folder, names]) => {
    const lines = names.map(
      n => `export {default as ${n}} from './${n}';`,
    );
    // also default-friendly re-exports for common names
    fs.writeFileSync(
      path.join(SCREENS, folder, 'index.js'),
      lines.join('\n') + '\n',
      'utf8',
    );
  });

  // root screens index
  const rootLines = Object.keys(byFolder).map(
    f => `export * from './${f}';`,
  );
  fs.writeFileSync(path.join(SCREENS, 'index.js'), rootLines.join('\n') + '\n', 'utf8');
}

function updateRoutes() {
  const replacements = {
    "../screens/BabyNamesScreen": "../screens/home/BabyNamesScreen",
    "../screens/LikeListScreen": "../screens/likes/LikeListScreen",
    "../screens/DislikeListScreen": "../screens/likes/DislikeListScreen",
    "../screens/NameInformation": "../screens/home/NameInformation",
    "../screens/NameFilterSearch": "../screens/search/NameFilterSearch",
    "../screens/AiAssistant": "../screens/home/AiAssistant",
    "../screens/TheWholeLIst": "../screens/home/TheWholeLIst",
    "../screens/SearchScreen": "../screens/search/SearchScreen",
    "../screens/PrivacyPolicy": "../screens/legal/PrivacyPolicy",
    "../screens/MainSearchScreen": "../screens/search/MainSearchScreen",
    "../screens/SpreadTheWord": "../screens/share/SpreadTheWord",
    "../screens/InAppPurchase": "../screens/premium/InAppPurchase",
    "../screens/LikeFilterScreen": "../screens/likes/LikeFilterScreen",
    "../screens/DislikeFilterScreen": "../screens/likes/DislikeFilterScreen",
    "../screens/TermsOfService": "../screens/legal/TermsOfService",
    "../screens/LandingScreen": "../screens/auth/LandingScreen",
    "../screens/SplashScreen": "../screens/auth/SplashScreen",
    "../screens/SignUpScreen": "../screens/auth/SignUpScreen",
    "../screens/SignInScreen": "../screens/auth/SignInScreen",
    "../screens/ForgotPasswordScreen": "../screens/auth/ForgotPasswordScreen",
  };

  const routeFiles = [
    path.join(ROOT, 'src/routes/AppStack.js'),
    path.join(ROOT, 'src/routes/AuthStack.js'),
    path.join(ROOT, 'src/routes/Navigation.js'),
  ];

  routeFiles.forEach(file => {
    let text = fs.readFileSync(file, 'utf8');
    Object.entries(replacements).forEach(([from, to]) => {
      text = text.split(from).join(to);
    });
    fs.writeFileSync(file, text, 'utf8');
    console.log('Updated routes', path.basename(file));
  });
}

function cleanupOld() {
  Object.keys(MAP).forEach(base => {
    const old = path.join(SCREENS, `${base}.js`);
    if (fs.existsSync(old)) {
      fs.unlinkSync(old);
      console.log('Removed', base + '.js');
    }
  });
}

const results = Object.entries(MAP).map(([base, folder]) =>
  processFile(base, folder),
);
writeBarrels(results);
updateRoutes();
cleanupOld();
console.log('Done.');
