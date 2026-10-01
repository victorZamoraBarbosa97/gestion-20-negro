// src/components/payments/ReceiptCapture.jsx
// Captura/selección de la foto del comprobante + recorte manual a los bordes
// (arrastrando 4 esquinas) antes de subirlo.
import { useCallback, useRef, useState } from "react";
import toast from "react-hot-toast";
import { cropAndEnhance } from "../../utils/documentScanner";
import { CameraIcon, FolderIcon } from "../ui/Icons";

const HANDLE_LABELS = ["Superior izq.", "Superior der.", "Inferior der.", "Inferior izq."];

const defaultCorners = (width, height) => {
  const inset = 0.04;
  return [
    { x: width * inset, y: height * inset },
    { x: width * (1 - inset), y: height * inset },
    { x: width * (1 - inset), y: height * (1 - inset) },
    { x: width * inset, y: height * (1 - inset) },
  ];
};

const ReceiptCapture = ({ onFileReady, label = "Comprobante" }) => {
  // 'idle' | 'adjust' | 'processing' | 'ready'
  const [step, setStep] = useState("idle");
  const [error, setError] = useState("");
  const [imageUrl, setImageUrl] = useState(null);
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [corners, setCorners] = useState(null);
  const [fileName, setFileName] = useState("comprobante.jpg");
  const [previewUrl, setPreviewUrl] = useState(null);

  const imgRef = useRef(null);
  const containerRef = useRef(null);
  const draggingIndex = useRef(null);
  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);

  const resetToIdle = useCallback(() => {
    setStep("idle");
    setError("");
    setImageUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    setCorners(null);
  }, []);

  const handleRetake = useCallback(() => {
    setStep("idle");
    setError("");
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
    onFileReady(null);
  }, [onFileReady]);

  const handleFileSelected = useCallback((file) => {
    if (!file) return;
    setError("");
    setFileName(file.name || "comprobante.jpg");
    const url = URL.createObjectURL(file);
    setImageUrl(url);

    const img = new Image();
    img.onload = () => {
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });
      imgRef.current = img;
      setCorners(defaultCorners(img.naturalWidth, img.naturalHeight));
      setStep("adjust");
    };
    img.onerror = () => {
      setError("No se pudo leer la imagen seleccionada.");
      setStep("idle");
    };
    img.src = url;
  }, []);

  const handleUseFullImage = useCallback(() => {
    setCorners(defaultCorners(imageSize.width, imageSize.height));
  }, [imageSize]);

  const handlePointerDown = useCallback((index) => (e) => {
    e.preventDefault();
    draggingIndex.current = index;
    e.target.setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e) => {
      if (draggingIndex.current === null || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const pctX = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      const pctY = Math.min(1, Math.max(0, (e.clientY - rect.top) / rect.height));

      setCorners((prev) => {
        const next = [...prev];
        next[draggingIndex.current] = {
          x: pctX * imageSize.width,
          y: pctY * imageSize.height,
        };
        return next;
      });
    },
    [imageSize],
  );

  const handlePointerUp = useCallback(() => {
    draggingIndex.current = null;
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!imgRef.current || !corners) return;
    setStep("processing");
    setError("");

    try {
      const blob = await cropAndEnhance(imgRef.current, corners);
      const processedFile = new File([blob], fileName, { type: "image/jpeg" });
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(blob);
      });
      setImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setCorners(null);
      onFileReady(processedFile);
      setStep("ready");
    } catch (err) {
      console.error("Error procesando el documento:", err);
      toast.error("No se pudo procesar la imagen. Intenta ajustar las esquinas de nuevo.");
      setError("No se pudo procesar la imagen. Intenta ajustar las esquinas de nuevo.");
      setStep("adjust");
    }
  }, [corners, fileName, onFileReady]);

  return (
    <div>
      <label className="block text-sm font-medium text-slate-700 dark:text-gray-300 mb-1">
        {label}
      </label>

      {step === "idle" && (
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl text-white bg-slate-700 hover:bg-slate-800 dark:bg-gray-600 dark:hover:bg-gray-500 transition-colors"
          >
            <CameraIcon className="h-10 w-10" />
            <span className="text-xs font-semibold">Tomar foto</span>
          </button>
          <button
            type="button"
            onClick={() => galleryInputRef.current?.click()}
            className="aspect-square flex flex-col items-center justify-center gap-2 rounded-xl text-slate-700 dark:text-gray-200 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 transition-colors"
          >
            <FolderIcon className="h-10 w-10" />
            <span className="text-xs font-semibold">Elegir archivos</span>
          </button>

          {/* capture="environment" abre la cámara directo en móvil */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files[0])}
          />
          <input
            ref={galleryInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFileSelected(e.target.files[0])}
          />
        </div>
      )}

      {step === "ready" && (
        <div className="flex items-center gap-3 rounded-lg border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-2.5">
          {previewUrl && (
            <img
              src={previewUrl}
              alt="Vista previa del comprobante recortado"
              className="h-16 w-16 object-cover rounded-md border border-green-200 dark:border-green-800 shrink-0"
            />
          )}
          <span className="flex-1 text-sm font-medium text-green-700 dark:text-green-400 truncate">
            ✓ Imagen lista: {fileName}
          </span>
          <button
            type="button"
            onClick={handleRetake}
            aria-label="Quitar imagen y volver a empezar"
            className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-green-700 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/40"
          >
            ✕
          </button>
        </div>
      )}

      {(step === "adjust" || step === "processing") && imageUrl && corners && (
        <div className="space-y-3">
          <div
            ref={containerRef}
            className="relative w-full select-none touch-none"
            style={{ aspectRatio: `${imageSize.width} / ${imageSize.height}` }}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <img
              src={imageUrl}
              alt="Comprobante a recortar"
              className="absolute inset-0 w-full h-full object-contain rounded-lg bg-black/5"
              draggable={false}
            />
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              <polygon
                points={corners
                  .map(
                    (c) =>
                      `${(c.x / imageSize.width) * 100},${(c.y / imageSize.height) * 100}`,
                  )
                  .join(" ")}
                fill="rgba(59,130,246,0.25)"
                stroke="#3b82f6"
                strokeWidth="0.5"
              />
            </svg>
            {corners.map((corner, index) => (
              <div
                key={index}
                onPointerDown={handlePointerDown(index)}
                title={HANDLE_LABELS[index]}
                className="absolute w-6 h-6 -ml-3 -mt-3 rounded-full bg-blue-500 border-2 border-white shadow-md touch-none cursor-grab active:cursor-grabbing"
                style={{
                  left: `${(corner.x / imageSize.width) * 100}%`,
                  top: `${(corner.y / imageSize.height) * 100}%`,
                }}
              />
            ))}
          </div>

          <p className="text-xs text-slate-500 dark:text-gray-400">
            Arrastra las esquinas azules para ajustar el recorte del documento.
          </p>

          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUseFullImage}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-gray-200 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Usar foto completa
            </button>
            <button
              type="button"
              onClick={resetToIdle}
              className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-gray-200 bg-slate-100 dark:bg-gray-700 hover:bg-slate-200 dark:hover:bg-gray-600 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={step === "processing"}
              className="ml-auto px-3 py-1.5 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-lg"
            >
              {step === "processing" ? "Procesando..." : "Confirmar recorte"}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-sm text-red-600 mt-1">{error}</p>}
    </div>
  );
};

export default ReceiptCapture;
