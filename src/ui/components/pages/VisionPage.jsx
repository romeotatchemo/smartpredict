import React, { useRef, useState } from "react";
import { SkeletonLoader } from "../shared/SkeletonLoader";
import { useVision } from "../../hooks/useVision";
import { logger } from "../../../engine/utils/logger";

export const VisionPage = () => {
  const {
    detections,
    status,
    sourceType,
    error,
    reset,
    isDetecting,
    progress,
    detectOnImage,
    detectOnVideo,
    startInferenceLoop
  } = useVision();

  // États locaux pour la gestion des fichiers et l'affichage
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [scoreThreshold, setScoreThreshold] = useState(0.5);
  const canvasRef = useRef(null);
  const videoRef = useRef(null);
  const inferenceIntervalRef = useRef(null);
  const videoUrlRef = useRef(null);

  /**
   * Sélection d'un fichier (drag & drop ou input)
   */
  const handleFileSelect = (file) => {
    if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
      alert("Veuillez sélectionner une image ou une vidéo");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    logger.info(`✅ File selected: ${file.name} (${file.type})`);
  };

  /**
   * Gestionnaire du drag & drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "#e3f2fd";
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "transparent";
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.currentTarget.style.backgroundColor = "transparent";

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

    /**
   * Démarre la lecture et la boucle d'inférence
   * Utilise detectOnVideo du hook pour configurer la vidéo correctement
   */
  const handlePlayVideo = async () => {
    if (!videoRef.current || !selectedFile) {
      alert("Veuillez d'abord sélectionner une vidéo");
      return;
    }

    logger.info(
      `▶️ Starting video playback and inference loop for: ${selectedFile.name}`,
    );
    try {
      const video = videoRef.current;

      // Appeler detectOnVideo du hook pour configurer la vidéo
      // Cette fonction charge la vidéo, crée l'URL, attends loadedmetadata, etc.
      const setupResult = await detectOnVideo(
        selectedFile,
        video,
        // Callback : lancé une fois la vidéo prête
        (detections) => {
          logger.debug(
            `📊 Inference callback: ${detections.length} detections`,
          );
        },
      );

      if (!setupResult) {
        logger.error("❌ Video setup failed");
        return;
      }

      // Stocker l'URL locale pour le cleanup later
      videoUrlRef.current = setupResult.videoUrl;

      // Démarrer la lecture
      video.play();
      logger.info(`▶️ Video playback started`);

      // Initialiser la boucle d'inférence
      const inferenceController = startInferenceLoop(
        video,
        null,
        scoreThreshold,
        canvasRef
      );

      // Stocker le contrôleur pour le cleanup
      inferenceIntervalRef.current = inferenceController;
    } catch (err) {
      logger.error(`❌ Error starting video playback: ${err.message}`);
    }
  };

   /**
   * Met en pause la lecture et arrête les inférences
   */
  const handlePauseVideo = () => {
    if (!videoRef.current) return;

    videoRef.current.pause();
    logger.info(`⏸️ Video paused`);

    // Arrêter la boucle d'inférence
    if (inferenceIntervalRef.current?.stop) {
      inferenceIntervalRef.current.stop();
      logger.info(`⏹️ Inference loop stopped`);
      inferenceIntervalRef.current = null;
    }

    // Les bounding boxes restent figées (pas de clearRect)
  };

    /**
   * Réinitialise tout : vidéo, canvas, états
   */
  const handleResetVideo = () => {
    if (!videoRef.current) return;

    // Arrêter la vidéo et l'intervalle
    videoRef.current.pause();
    if (inferenceIntervalRef.current?.stop) {
      inferenceIntervalRef.current.stop();
      inferenceIntervalRef.current = null;
    }

    // Nettoyer les ressources
    if (videoUrlRef.current) {
      URL.revokeObjectURL(videoUrlRef.current);
      videoUrlRef.current = null;
    }

    // Vider le canvas
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    // Réinitialiser l'état
    setSelectedFile(null);
    setPreviewUrl(null);

    logger.info(`🔄 Video and canvas reset`);
  };

  /**
   * Dessine les bounding boxes sur le canvas
   */
  const drawDetections = (source) => {
    const canvas = canvasRef.current;
    if (!canvas || detections.length === 0) return;

    const ctx = canvas.getContext("2d");

    // Adapter les dimensions du canvas à la source
    if (source instanceof HTMLImageElement) {
      canvas.width = source.naturalWidth;
      canvas.height = source.naturalHeight;
    } else if (source instanceof HTMLVideoElement) {
      canvas.width = source.videoWidth;
      canvas.height = source.videoHeight;
    }

    // Effacer le canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Dessiner chaque détection
    detections.forEach((detection, index) => {
      const { bbox, class: objectClass, score } = detection;
      const [x, y, width, height] = bbox;

      // Couleur pour le rectangle (alternance de couleurs)
      const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];
      const color = colors[index % colors.length];

      // Dessiner le rectangle
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, width, height);

      // Dessiner le label (classe + score)
      const label = `${objectClass} (${(score * 100).toFixed(1)}%)`;
      ctx.fillStyle = color;
      ctx.font = "bold 14px Arial";
      ctx.fillText(label, x, y - 8);
    });
  };
  

  /**
   * Dessine les bounding boxes sur le canvas avec labels et palette HSL
   *
   * @param {HTMLCanvasElement} canvasElement - Référence au canvas
   * @param {HTMLImageElement} imgElement - L'image chargée
   * @param {Array} detections - Tableau des détections
   * @param {number} scoreThreshold - Seuil utilisé pour filtrer
   */
  const renderDetections = (
    canvasElement,
    imgElement,
    detections,
    scoreThreshold,
  ) => {
    if (!canvasElement || !imgElement || detections.length === 0) {
      logger.warn("⚠️ Missing canvas, image, or detections");
      return;
    }

    const ctx = canvasElement.getContext("2d");

    // Étape 1 : Dimensionner le canvas aux dimensions natives (pas CSS)
    const nativeWidth = imgElement.naturalWidth;
    const nativeHeight = imgElement.naturalHeight;

    canvasElement.width = nativeWidth;
    canvasElement.height = nativeHeight;

    logger.info(`📐 Canvas resized to: ${nativeWidth}x${nativeHeight}px`);

    // Étape 2 : Dessiner l'image source comme fond
    ctx.drawImage(imgElement, 0, 0);

    // Étape 3 : Calculer le facteur d'échelle CSS (pour éviter le décalage bbox)
    const cssWidth = imgElement.width; // Largeur CSS
    const cssHeight = imgElement.height; // Hauteur CSS
    const scaleX = cssWidth / nativeWidth;
    const scaleY = cssHeight / nativeHeight;

    logger.info(
      `🔍 Scale factors: X=${scaleX.toFixed(3)}, Y=${scaleY.toFixed(3)}`,
    );

    // Étape 4 : Boucler sur les détections et dessiner
    detections.forEach((detection, index) => {
      const { bbox, class: objectClass, score } = detection;
      const [x, y, width, height] = bbox;

      // Appliquer le facteur d'échelle si l'image est redimensionnée par CSS
      const scaledX = x * scaleX;
      const scaledY = y * scaleY;
      const scaledWidth = width * scaleX;
      const scaledHeight = height * scaleY;

      // Palette HSL : générer une couleur unique par classe COCO
      // 80 couleurs distinctes (COCO a 80 classes)
      // Utiliser l'index de classe pour générer une teinte unique
      // Formule : hue = (classIndex × 137.5) % 360 (le nombre d'or en angle)
      const classIndex = index % 80; // Boucler si on a plus de 80 détections
      const hue = (classIndex * 137.5) % 360;
      const saturation = 100;
      const lightness = 50;
      const hslColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
      const rgbColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`; // Même couleur en HSL

      // Étape 5 : Dessiner le rectangle (bbox)
      ctx.strokeStyle = rgbColor;
      ctx.lineWidth = 3;
      ctx.strokeRect(scaledX, scaledY, scaledWidth, scaledHeight);

      // Étape 6 : Dessiner le label avec fond coloré pour la lisibilité
      const label = `${objectClass} ${(score * 100).toFixed(1)}%`;
      const fontSize = 14;
      const fontFamily = "Arial, sans-serif";

      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      const textMetrics = ctx.measureText(label);
      const textWidth = textMetrics.width;
      const textHeight = fontSize;

      // Fond du label (rectangle coloré)
      const labelPadding = 4;
      ctx.fillStyle = rgbColor;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(
        scaledX,
        scaledY - textHeight - labelPadding * 2,
        textWidth + labelPadding * 2,
        textHeight + labelPadding * 2,
      );

      // Texte du label (blanc pour le contraste)
      ctx.globalAlpha = 1.0;
      ctx.fillStyle = "#FFFFFF";
      ctx.font = `bold ${fontSize}px ${fontFamily}`;
      ctx.fillText(label, scaledX + labelPadding, scaledY - labelPadding);

      logger.info(
        `  📍 ${objectClass}: ${(score * 100).toFixed(1)}% @ [${x}, ${y}, ${width}, ${height}]`,
      );
    });

    logger.info(`✅ Rendered ${detections.length} bounding box(es) on canvas`);
  };

  /**
   * Déclenche la détection sur le fichier sélectionné
   */
  const handleDetect = async () => {
    if (!selectedFile || !previewUrl) {
      alert("Veuillez d'abord sélectionner une image ou vidéo");
      return;
    }

    // Créer un élément temporaire pour charger la source
    if (selectedFile.type.startsWith("image/")) {
      try {
        // Créer un élément image temporaire
        const img = new Image();

        img.onload = async () => {
          // Appeler la détection et capturer les résultats
          const results = await detectOnImage(selectedFile, scoreThreshold);

          // Dessiner les résultats retournés (pas l'état du hook)
          renderDetections(canvasRef.current, img, results, scoreThreshold);
        };

        img.src = previewUrl;
      } catch (err) {
        logger.error(`❌ Error in handleDetect: ${err.message}`);
      }
    } else if (selectedFile.type.startsWith("video/")) {
      // next
    }
  };

  /**
   * Réinitialise tout
   */
  const handleReset = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    reset();
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    logger.info("🔄 Vision page reset");
  };

  // Si le modèle charge encore, afficher un message
  if (status === "loading") {
    return (
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1>👁️ Vision — Détection d'objets</h1>
        <div
          style={{
            backgroundColor: "#e3f2fd",
            border: "2px solid #1976d2",
            padding: "30px",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: "18px", color: "#1976d2" }}>
            ⏳ Chargement de Coco-SSD ({progress}%)...
          </p>
          <p style={{ color: "#666", fontSize: "14px" }}>
            Premier chargement : 5-10 secondes | Rechargements ultérieurs :
            moins de 1 seconde
          </p>
          {/* Barre de progression */}
          <div
            style={{
              width: "100%",
              height: "8px",
              backgroundColor: "#ccc",
              borderRadius: "4px",
              marginTop: "15px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                backgroundColor: "#1976d2",
                transition: "width 0.2s ease",
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  // Si erreur
  if (status === "error") {
    return (
      <div style={{ padding: "40px", maxWidth: "1200px", margin: "0 auto" }}>
        <h1>👁️ Vision — Détection d'objets</h1>
        <div
          style={{
            backgroundColor: "#fff3cd",
            border: "2px solid #ff9800",
            padding: "20px",
            borderRadius: "8px",
            color: "#333",
          }}
        >
          <h3>⚠️ Erreur</h3>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "40px",
        maxWidth: "1200px",
        margin: "0 auto",
        minHeight: "calc(100vh - 60px)",
      }}
    >
      <h1 style={{ marginBottom: "32px" }}>👁️ Vision — Détection d'objets</h1>

      {/* ZONE 1: Upload avec drag & drop */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Étape 1 : Charger une image ou vidéo</h2>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: "2px dashed #1976d2",
            padding: "60px",
            borderRadius: "8px",
            textAlign: "center",
            backgroundColor: "transparent",
            cursor: "pointer",
            transition: "all 0.3s",
          }}
        >
          <p style={{ fontSize: "18px", marginBottom: "20px", color: "#333" }}>
            📁 Glissez-déposez une image ou vidéo
          </p>
          <p style={{ color: "#999", marginBottom: "20px" }}>ou</p>
          <label
            style={{
              display: "inline-block",
              padding: "12px 30px",
              backgroundColor: "#1976d2",
              color: "white",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
            }}
          >
            Parcourir
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => {
                if (e.target.files[0]) {
                  handleFileSelect(e.target.files[0]);
                }
              }}
              style={{ display: "none" }}
            />
          </label>

          {selectedFile && (
            <p
              style={{
                marginTop: "20px",
                color: "#4caf50",
                fontWeight: "bold",
              }}
            >
              ✅ Fichier sélectionné : {selectedFile.name}
            </p>
          )}
        </div>
      </section>

      {/* ZONE 2: Preview et Canvas */}
      {previewUrl && (
        <section style={{ marginBottom: "40px" }}>
          <h2>Étape 2 : Visualisation et détections</h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "20px",
            }}
          >
            {/* Preview */}
            <div>
              <h3>Source</h3>
              {selectedFile.type.startsWith("image/") ? (
                <img
                  src={previewUrl}
                  alt="Preview"
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "2px solid #ddd",
                  }}
                />
              ) : (
                <video
                  src={previewUrl}
                  onPlay={handlePlayVideo}
                  onPause={handlePauseVideo}
                  onEnded={handlePauseVideo}
                  muted
                  controls
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "2px solid #ddd",
                  }}
                />
              )}
            </div>

            {/* Canvas avec détections */}
            <div>
              <h3>Détections (Bounding boxes)</h3>
              {selectedFile.type.startsWith("video/") ? (
              <div style={{ position: "relative" }}>
                <video
                  src={previewUrl}
                  ref={videoRef}
                  onPause={handlePauseVideo}
                  onEnded={handlePauseVideo}
                  muted
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "2px solid #ddd",
                  }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    width: "100%",
                    borderRadius: "8px",
                    border: "2px solid #ddd",
                    backgroundColor: "transparent",
                    position: "absolute",
                    left: 0,
                    top: 0,
                  }}
                />
              </div>
            ) : (
              <canvas
                ref={canvasRef}
                style={{
                  width: "100%",
                  borderRadius: "8px",
                  border: "2px solid #ddd",
                  backgroundColor: "#f5f5f5",
                }}
              />
            )}
            </div>
          </div>
        </section>
      )}

      {/* ZONE 3: Toolbar */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Contrôles</h2>
        <div
          style={{
            display: "flex",
            gap: "20px",
            flexWrap: "wrap",
            alignItems: "center",
          }}
        >
          {/* Seuil de détection */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <label>Score Threshold :</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={scoreThreshold}
              onChange={(e) => setScoreThreshold(parseFloat(e.target.value))}
              disabled={isDetecting}
              style={{ width: "150px" }}
            />
            <span style={{ fontWeight: "bold" }}>
              {(scoreThreshold * 100).toFixed(0)}%
            </span>
          </div>

          {/* Bouton Détect */}
          <button
            onClick={handleDetect}
            disabled={!selectedFile || isDetecting || status !== "ready"}
            style={{
              padding: "10px 30px",
              backgroundColor:
                isDetecting || !selectedFile || status !== "ready"
                  ? "#ccc"
                  : "#4caf50",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor:
                isDetecting || !selectedFile || status !== "ready"
                  ? "not-allowed"
                  : "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            {isDetecting ? "⏳ Détection..." : "🔍 Détecter"}
          </button>

          {/* Bouton Reset */}
          <button
            onClick={handleReset}
            style={{
              padding: "10px 30px",
              backgroundColor: "#ff9800",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              fontSize: "14px",
            }}
          >
            🔄 Réinitialiser
          </button>
        </div>
      </section>

      {/* ZONE 4: Résultats */}
      <section style={{ marginBottom: "40px" }}>
        <h2>Résultats ({detections.length} objet(s) détecté(s))</h2>

        {detections.length === 0 ? (
          <p style={{ color: "#999" }}>
            Sélectionnez une image ou vidéo et cliquez sur "Détecter" pour voir
            les résultats
          </p>
        ) : (
          <div
            style={{
              backgroundColor: "#f5f5f5",
              padding: "20px",
              borderRadius: "8px",
              overflowX: "auto",
            }}
          >
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: "14px",
              }}
            >
              <thead>
                <tr style={{ backgroundColor: "#e0e0e0" }}>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "2px solid #999",
                    }}
                  >
                    Classe
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "2px solid #999",
                    }}
                  >
                    Confiance (%)
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "2px solid #999",
                    }}
                  >
                    Position (x, y)
                  </th>
                  <th
                    style={{
                      padding: "10px",
                      textAlign: "left",
                      borderBottom: "2px solid #999",
                    }}
                  >
                    Taille (w, h)
                  </th>
                </tr>
              </thead>
              <tbody>
                {detections.map((det, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #ddd" }}>
                    <td style={{ padding: "10px" }}>
                      <strong>{det.class}</strong>
                    </td>
                    <td style={{ padding: "10px" }}>
                      {(det.score * 100).toFixed(1)}%
                    </td>
                    <td style={{ padding: "10px" }}>
                      ({Math.round(det.bbox[0])}, {Math.round(det.bbox[1])})
                    </td>
                    <td style={{ padding: "10px" }}>
                      {Math.round(det.bbox[2])} × {Math.round(det.bbox[3])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Message d'erreur */}
      {error && (
        <div
          style={{
            backgroundColor: "#ffebee",
            border: "2px solid #f44336",
            padding: "20px",
            borderRadius: "8px",
            color: "#c62828",
          }}
        >
          <h3>❌ Erreur</h3>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};
