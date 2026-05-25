/**
 * test_use.js - Script de test pour Universal Sentence Encoder
 * 
 * Fournit une variable globale `nlpTest` accessible en console
 * avec les méthodes pour explorer les embeddings et la similarité.
 * 
 * Usage:
 *   await nlpTest.load()
 *   await nlpTest.embed(['Votre phrase ici'])
 *   await nlpTest.similarite('Phrase A', 'Phrase B')
 *   await nlpTest.runAll()
 */

const TestUSE = {
  model: null,

  /**
   * Charge le modèle Universal Sentence Encoder
   */
  async load() {
    console.log("🚀 [USE Test] Chargement du modèle Universal Sentence Encoder...");
    console.log("⏳ Cela peut prendre 15-30 secondes (~25 MB)...\n");
    
    const start = performance.now();
    
    try {
      const use = await import("@tensorflow-models/universal-sentence-encoder");
      this.model = await use.load();
      
      const duration = ((performance.now() - start) / 1000).toFixed(2);
      
      console.log(`✅ [USE Test] Modèle chargé avec succès en ${duration}s`);
      console.log("📊 Informations du modèle:");
      console.log("   - Dimension de sortie: 512");
      console.log("   - Vecteurs: normalisés (norme ≈ 1.0)");
      console.log("   - Langues supportées: multilingue (dont le français)\n");
      
      return this;
    } catch (error) {
      console.error("❌ [USE Test] Erreur lors du chargement:", error.message);
      throw error;
    }
  },

  /**
   * Génère les embeddings pour un ensemble de phrases
   * et affiche les dimensionalités et les premières valeurs
   */
  async embed(sentences = []) {
    if (!this.model) {
      console.error("❌ [USE Test] Modèle non chargé. Appelle await nlpTest.load() d'abord.");
      return null;
    }
    
    if (!Array.isArray(sentences) || sentences.length === 0) {
      console.warn("⚠️  [USE Test] Fournir un tableau de phrases. Exemple: await nlpTest.embed(['Bonjour', 'Hello'])");
      return null;
    }
    
    try {
      console.log(`\n📐 [USE Test] Calcul des embeddings pour ${sentences.length} phrase(s)...\n`);
      
      const start = performance.now();
      
      const embeddings = await this.model.embed(sentences);
      const values = await embeddings.array();
      
      const duration = ((performance.now() - start) / 1000).toFixed(3);
      
      values.forEach((vec, i) => {
        console.log(`📌 Phrase ${i + 1}: "${sentences[i]}"`);
        console.log(`   ├─ Dimensions: ${vec.length} (512 valeurs flottantes)`);
        console.log(`   ├─ Premières valeurs: [${vec.slice(0, 5).map(v => v.toFixed(4)).join(", ")} ...]`);
        
        // Calculer et afficher la norme
        const norm = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
        console.log(`   └─ Norme du vecteur: ${norm.toFixed(4)} (normalisé ≈ 1.0)\n`);
      });
      
      console.log(`✅ [USE Test] ${sentences.length} embedding(s) généré(s) en ${duration}s\n`);
      
      embeddings.dispose(); // Libère la mémoire GPU
      return values;
    } catch (error) {
      console.error("❌ [USE Test] Erreur lors de la génération d'embeddings:", error.message);
      throw error;
    }
  },

  /**
   * Calcule la similarité cosinus entre deux phrases
   */
  async similarite(phraseA, phraseB) {
    if (!this.model) {
      console.error("❌ [USE Test] Modèle non chargé. Appelle await nlpTest.load() d'abord.");
      return null;
    }
    
    try {
      console.log(`\n🔁 [USE Test] Calcul de similarité cosinus...\n`);
      
      const start = performance.now();
      
      const embeddings = await this.model.embed([phraseA, phraseB]);
      const values = await embeddings.array();
      
      // Calcul de la similarité cosinus
      // Formule: (A · B) / (||A|| × ||B||)
      const vec1 = values[0];
      const vec2 = values[1];
      
      const dotProduct = vec1.reduce((sum, v, i) => sum + v * vec2[i], 0);
      const normA = Math.sqrt(vec1.reduce((sum, v) => sum + v * v, 0));
      const normB = Math.sqrt(vec2.reduce((sum, v) => sum + v * v, 0));
      const similarity = dotProduct / (normA * normB);
      
      const duration = ((performance.now() - start) / 1000).toFixed(3);
      
      // Interprétation lisible
      let interpretation = '';
      if (similarity > 0.85) {
        interpretation = '🟢 Très similaires (sens très proche)';
      } else if (similarity > 0.6) {
        interpretation = '🟡 Similaires (thème commun)';
      } else if (similarity > 0.3) {
        interpretation = '🟠 Faiblement liées (quelques concepts communs)';
      } else {
        interpretation = '🔴 Sans rapport (sens très différent)';
      }
      
      console.log(`📊 Phrase A: "${phraseA}"`);
      console.log(`📊 Phrase B: "${phraseB}"\n`);
      console.log(`🎯 Score de similarité cosinus: ${similarity.toFixed(4)}`);
      console.log(`   ${interpretation}`);
      console.log(`   (Calculé en ${duration}s)\n`);
      
      console.log(`📐 Comparaison des premières valeurs:`);
      console.log(`   Phrase A: [${vec1.slice(0, 5).map(v => v.toFixed(4)).join(", ")} ...]`);
      console.log(`   Phrase B: [${vec2.slice(0, 5).map(v => v.toFixed(4)).join(", ")} ...]\n`);
      
      embeddings.dispose(); // Libère la mémoire GPU
      return similarity;
    } catch (error) {
      console.error("❌ [USE Test] Erreur lors du calcul de similarité:", error.message);
      throw error;
    }
  },

  /**
   * Exécute tous les tests dans l'ordre
   */
  async runAll() {
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("🚀 [USE Test] Démarrage de la démonstration complète...");
    console.log("═══════════════════════════════════════════════════════════════\n");
    
    // Charger le modèle
    await this.load();
    
    // Générer des embeddings sur plusieurs phrases
    await this.embed([
      "Bonjour, je suis très satisfait de ce service",
      "Je suis vraiment déçu et insatisfait",
      "La météo est magnifique aujourd'hui"
    ]);
    
    // Calculer la similarité entre deux phrases
    await this.similarite(
      "Je suis content",
      "Je suis heureux"
    );
    
    await this.similarite(
      "Il fait beau",
      "Cette voiture est rapide"
    );
    
    console.log("═══════════════════════════════════════════════════════════════");
    console.log("✅ [USE Test] Démonstration complétée !");
    console.log("═══════════════════════════════════════════════════════════════\n");
  }
};

// Exporter en variable globale pour usage en console
window.nlpTest = TestUSE;