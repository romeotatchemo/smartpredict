/**
 * demo_use_test.js - Namespace de démonstration pour USE
 * 
 * Fournit une variable globale `window.useDemo` avec toutes les méthodes
 * pour explorer les embeddings USE, calculer la similarité, et valider la mémoire.
 * 
 * Usage en console:
 *   await useDemo.loadModel()
 *   await useDemo.generateEmbedding('Une phrase')
 *   await useDemo.compareSentences('Phrase A', 'Phrase B')
 */

import { ModelRegistry } from '../models/ModelRegistry.js';
import '../models/registry.config.js';

export const useDemo = {
  model: null,
  result: null,
  
  // Charger le modèle depuis le ModelRegistry (cache)
  async loadModel() {
    console.log('📦 Loading USE from ModelRegistry cache...');
    this.model = await ModelRegistry.get('use');
    console.log('✅ USE model loaded');
    return this.model;
  },
  
  // Générer un embedding pour une phrase
  async generateEmbedding(sentence) {
    if (!this.model) {
      console.warn('⚠️ Model not loaded. Call await useDemo.loadModel() first');
      return;
    }
    
    console.log(`\n🔤 Generating embedding for: "${sentence}"`);
    console.log('⏳ This takes ~200-500ms...\n');
    
    const start = performance.now();
    
    // Embed une phrase (passée en tableau)
    const tensor = await this.model.embed([sentence]);
    const embedding = await tensor.array(); // Convertir en tableau JS
    tensor.dispose(); // Libérer la mémoire du tenseur
    
    const duration = (performance.now() - start).toFixed(2);
    
    // Afficher les résultats
    this.result = embedding[0]; // embeddings[0] car embed() retourne [N, 512]
    
    console.log(`✅ Embedding generated in ${duration}ms`);
    console.log(`📊 Shape: [${this.result.length}] (512-dimensional vector)`);
    console.log(`\n🔍 First 10 values (floats between -1 and 1):`);
    console.table(this.result.slice(0, 10).map((v, i) => ({
      'index': i,
      'value': v.toFixed(6)
    })));
    
    // Vérifier la norme (doit être ~1 pour USE normalisé)
    const norm = Math.sqrt(
      this.result.reduce((sum, val) => sum + val * val, 0)
    );
    console.log(`\n📏 Vector norm: ${norm.toFixed(6)} (should be ~1.0 for normalized USE)`);
    
    return this.result;
  },
  
  // Comparer deux phrases via similarité cosinus
  async compareSentences(sent1, sent2) {
    if (!this.model) {
      console.warn('⚠️ Model not loaded');
      return;
    }
    
    console.log(`\n📊 Comparing two sentences...`);
    
    // Générer embeddings pour les deux phrases
    const tensor = await this.model.embed([sent1, sent2]);
    const embeddings = await tensor.array();
    tensor.dispose();
    
    const emb1 = embeddings[0];
    const emb2 = embeddings[1];
    
    // Similarité cosinus = (A·B) / (||A|| * ||B||)
    const dotProduct = emb1.reduce((sum, v, i) => sum + v * emb2[i], 0);
    const norm1 = Math.sqrt(emb1.reduce((sum, v) => sum + v * v, 0));
    const norm2 = Math.sqrt(emb2.reduce((sum, v) => sum + v * v, 0));
    const cosineSimilarity = dotProduct / (norm1 * norm2);
    
    console.log(`  "${sent1}"`);
    console.log(`  vs`);
    console.log(`  "${sent2}"`);
    console.log(`\n✅ Cosine Similarity: ${cosineSimilarity.toFixed(6)}`);
    console.log(`   (0 = completely different, 1 = identical)\n`);
    
    return cosineSimilarity;
  }
};

// Exposer en global pour accès console
window.useDemo = useDemo;