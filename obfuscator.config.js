/**
 * Configuration d'obfuscation pour SmartPredict.js
 * Appliquée uniquement aux fichiers du moteur ML sensible
 */

export const obfuscatorConfig = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: false,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: false,
  debugProtectionInterval: false,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  renameGlobals: false,
  rotateStringArray: true,
  selfDefending: false,
  stringArray: true,
  stringArrayEncoding: 'base64',
  stringArrayThreshold: 0.75,
  unicodeEscapeSequence: false
};

/**
 * Motifs de fichiers à obfusquer
 * On cible uniquement le moteur ML, pas l'interface utilisateur
 */
export const obfuscationTargets = [
  'src/engine/core/**/*.js',
  'src/engine/models/**/*.js',
  'src/engine/decision/**/*.js',
  'src/engine/features/**/*.js',
  'src/engine/data/**/*.js'
];