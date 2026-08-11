const fs = require('fs');
const path = require('path');
const {getDefaultConfig, mergeConfig} = require('@react-native/metro-config');

/**
 * Parse project-root `.env` into a plain object (CareerMate-style, no dotenv dep).
 */
function loadDotEnvFile() {
  const envPath = path.resolve(__dirname, '.env');
  const result = {};
  if (!fs.existsSync(envPath)) {
    return result;
  }

  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) {
      continue;
    }
    const eq = line.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[key] = value;
  }
  return result;
}

const envValues = loadDotEnvFile();
const envRuntimePath = path.resolve(__dirname, 'src/config/env.runtime.js');
const envModuleSource =
  '/** Auto-generated from .env by metro.config.js — do not edit or commit. */\n' +
  `module.exports = ${JSON.stringify(
    {
      GEMINI_API_KEY: envValues.GEMINI_API_KEY || '',
      GEMINI_MODEL: envValues.GEMINI_MODEL || '',
    },
    null,
    2,
  )};\n`;

fs.mkdirSync(path.dirname(envRuntimePath), {recursive: true});
fs.writeFileSync(envRuntimePath, envModuleSource, 'utf8');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
const config = {
  resolver: {
    extraNodeModules: {
      '@env': envRuntimePath,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
