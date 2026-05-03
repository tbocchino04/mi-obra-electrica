const MAX_FILE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateImage(file) {
  if (file.size > MAX_FILE_BYTES) {
    throw new Error(
      `La imagen pesa ${(file.size / 1024 / 1024).toFixed(1)} MB. El límite es 5 MB. Usá una foto de menor resolución.`
    );
  }
}

// Más agresivo que antes (900px / 62%) para mantener docs Firestore < 1 MB
export function compressImage(dataUrl, maxWidth = 900, quality = 0.62) {
  return new Promise(resolve => {
    const img = new Image();
    img.onload = () => {
      const ratio  = Math.min(1, maxWidth / img.width);
      const canvas = document.createElement("canvas");
      canvas.width  = img.width  * ratio;
      canvas.height = img.height * ratio;
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", quality));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}
