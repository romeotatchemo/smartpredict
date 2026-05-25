/**
 * Script pour générer le hash SHA-256 complet d'un modèle TensorFlow.js
 * À exécuter après l'entraînement ou la conversion du modèle
 *
 * Le hash prend en compte :
 * - model.json
 * - tous les fichiers de poids (.bin) référencés dans weightsManifest
 *
 * Utilisation:
 * node generateModelHash.js <chemin-du-model.json>
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

async function generateModelHash(filePath) {
  try {
    // Résoudre le chemin relatif
    const absolutePath = path.resolve(filePath);

    // Vérifier que le fichier existe
    if (!fs.existsSync(absolutePath)) {
      console.error(`❌ Fichier non trouvé: ${absolutePath}`);
      process.exit(1);
    }

    // Lire le contenu du model.json
    const fileBuffer = fs.readFileSync(absolutePath);

    // Parser le JSON
    const modelConfig = JSON.parse(
      fileBuffer.toString()
    );

    // Vérifier que weightsManifest existe
    if (!modelConfig.weightsManifest) {
      console.error(`❌ Aucun weightsManifest trouvé dans le modèle`);
      process.exit(1);
    }

    // Créer le hash SHA-256 global
    const hash = crypto.createHash('sha256');

    // Ajouter model.json au hash
    hash.update(fileBuffer);

    // Dossier du modèle
    const modelDir = path.dirname(absolutePath);

    // Taille totale
    let totalSize = fileBuffer.length;

    // Nombre de fichiers de poids
    let weightFilesCount = 0;

    // Ajouter tous les fichiers .bin référencés
    for (const manifest of modelConfig.weightsManifest) {

      if (!manifest.paths) {
        continue;
      }

      for (const weightPath of manifest.paths) {

        const absoluteWeightPath = path.join(
          modelDir,
          weightPath
        );

        // Vérifier que le fichier existe
        if (!fs.existsSync(absoluteWeightPath)) {
          console.error(
            `❌ Fichier de poids introuvable: ${absoluteWeightPath}`
          );
          process.exit(1);
        }

        // Lire le fichier de poids
        const weightBuffer = fs.readFileSync(
          absoluteWeightPath
        );

        // Ajouter au hash
        hash.update(weightBuffer);

        // Mettre à jour taille totale
        totalSize += weightBuffer.length;

        weightFilesCount++;
      }
    }

    // Générer le hash final
    const hashHex = hash.digest('hex');

    // Afficher le résultat formaté
    const fileName = path.basename(absolutePath);

    console.log(`\n✅ Hash SHA-256 généré avec succès\n`);

    console.log(`📄 Fichier: ${fileName}`);

    console.log(
      `📦 Fichiers de poids: ${weightFilesCount}`
    );

    console.log(
      `📊 Taille totale: ${(totalSize / 1024).toFixed(2)} KB`
    );

    console.log(`🔐 Hash: ${hashHex}\n`);

    // Retourner le hash pour utilisation dans d'autres scripts
    return hashHex;

  } catch (error) {

    console.error(
      `❌ Erreur lors du calcul du hash:`,
      error.message
    );

    process.exit(1);
  }
}

// Exécuter si appelé directement
if (process.argv.length < 3) {

  console.log(
    `Usage: node generateModelHash.js <chemin-du-model.json>`
  );

  console.log(`\nExemple:`);

  console.log(
    `  node generateModelHash.js public/models/model.v1.1.0.json`
  );

  process.exit(1);
}

const filePath = process.argv[2];

await generateModelHash(filePath);

export { generateModelHash };