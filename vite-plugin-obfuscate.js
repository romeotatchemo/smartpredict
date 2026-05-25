import fs from 'fs';
import path from 'path';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { obfuscatorConfig, obfuscationTargets } from './obfuscator.config.js';

export function vitePluginObfuscate() {
  return {
    name: 'vite-plugin-obfuscate',
    apply: 'build',
    enforce: 'post',
    
    generateBundle(options, bundle) {
      console.log('\n🔐 Obfuscation du moteur ML...');
      
      for (const [fileName, source] of Object.entries(bundle)) {
        // On obfusque uniquement les fichiers JS du moteur ML
        if (!fileName.endsWith('.js')) continue;
        
        const isEngineFile = [
          'engine-core',
          'engine-models',
          'engine-decision',
          'engine-features',
          'engine-data'
        ].some(pattern => fileName.includes(pattern));
        
        if (!isEngineFile) continue;
        
        try {
          const code = source.code;
          const obfuscated = JavaScriptObfuscator.obfuscate(code, obfuscatorConfig);
          source.code = obfuscated.getObfuscatedCode();
          
          console.log(`  ✓ ${fileName}`);
        } catch (error) {
          console.error(`  ✗ Erreur lors de l'obfuscation de ${fileName}:`, error.message);
        }
      }
      
      console.log('🔐 Obfuscation terminée.\n');
    }
  };
}