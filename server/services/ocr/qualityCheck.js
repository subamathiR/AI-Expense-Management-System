/**
 * Receipt Image Quality Inspector
 * Checks if receipt image is sufficiently legible, bright, and formatted before sending to OCR.
 */
const inspectReceiptQuality = async (fileBuffer, mimeType) => {
  // 1. Basic size & type validation
  if (!fileBuffer || fileBuffer.length === 0) {
    return {
      isReadable: false,
      issue: 'Receipt file is empty or corrupted.',
    };
  }

  // Minimum required file size for legibility (approx 5KB minimum)
  if (fileBuffer.length < 5 * 1024) {
    return {
      isReadable: false,
      issue: 'Receipt quality is too low (image size too small or unreadable). Please upload a clearer image.',
    };
  }

  // 2. Simple brightness / contrast heuristic check on buffer bytes
  let totalBrightness = 0;
  const sampleSize = Math.min(fileBuffer.length, 1000);
  for (let i = 0; i < sampleSize; i += 4) {
    const r = fileBuffer[i];
    const g = fileBuffer[i + 1] || r;
    const b = fileBuffer[i + 2] || r;
    totalBrightness += (r + g + b) / 3;
  }
  const avgBrightness = totalBrightness / (sampleSize / 4);

  // Extremely dark image check
  if (avgBrightness < 15) {
    return {
      isReadable: false,
      issue: 'Receipt image is too dark to extract text legibly. Please upload a well-lit photo.',
    };
  }

  return {
    isReadable: true,
    issue: null,
  };
};

module.exports = {
  inspectReceiptQuality,
};
