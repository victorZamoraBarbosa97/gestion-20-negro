// src/utils/documentScanner.js
// Recorte del comprobante a los bordes que el usuario ajusta manualmente,
// más una mejora suave de brillo/contraste. Solo Canvas 2D nativo.

const MAX_OUTPUT_DIMENSION = 2000; // Resolución del recorte final (fotos de cámara vienen en 4000px+)

/**
 * Recorta la imagen al rectángulo delimitado por las 4 esquinas y aplica una
 * mejora suave de contraste/brillo. Reduce la imagen si excede el tamaño
 * máximo de salida.
 * @param {HTMLImageElement} imgElement
 * @param {[{x,y},{x,y},{x,y},{x,y}]} corners - 4 puntos en píxeles de la imagen original
 * @returns {Promise<Blob>}
 */
export function cropAndEnhance(imgElement, corners) {
  const xs = corners.map((c) => c.x);
  const ys = corners.map((c) => c.y);
  const minX = Math.max(0, Math.min(...xs));
  const minY = Math.max(0, Math.min(...ys));
  const maxX = Math.min(imgElement.naturalWidth, Math.max(...xs));
  const maxY = Math.min(imgElement.naturalHeight, Math.max(...ys));
  const cropWidth = Math.max(1, Math.round(maxX - minX));
  const cropHeight = Math.max(1, Math.round(maxY - minY));

  const scale = Math.min(1, MAX_OUTPUT_DIMENSION / Math.max(cropWidth, cropHeight));
  const outputWidth = Math.round(cropWidth * scale);
  const outputHeight = Math.round(cropHeight * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outputWidth;
  canvas.height = outputHeight;
  const ctx = canvas.getContext("2d");
  ctx.filter = "contrast(1.15) brightness(1.08)";
  ctx.drawImage(
    imgElement,
    minX,
    minY,
    cropWidth,
    cropHeight,
    0,
    0,
    outputWidth,
    outputHeight,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("No se pudo generar la imagen procesada."))),
      "image/jpeg",
      0.92,
    );
  });
}
