const fs = require('fs');
const crypto = require('crypto');
const path = require('path');
let Tesseract = null;
try {
  Tesseract = require('tesseract.js');
} catch (e) {
  console.log('[OCR Service] Tesseract.js optional load note:', e.message);
}

/**
 * Calculates SHA256 file hash to detect identical duplicate uploads
 */
function calculateFileHash(filePath) {
  try {
    const fileBuffer = fs.readFileSync(filePath);
    return crypto.createHash('sha256').update(fileBuffer).digest('hex');
  } catch (err) {
    return null;
  }
}

/**
 * Intelligent Receipt Text Parser using Regular Expressions and Heuristics
 */
function parseReceiptText(text, fallbackVendor = '') {
  if (!text || typeof text !== 'string') {
    text = '';
  }

  const rawLines = text.split('\n').map(l => l.trim()).filter(Boolean);
  const cleanLines = text.split('\n')
    .map(l => l.replace(/[^a-zA-Z0-9\s&'.,-]/g, ' ').replace(/\s+/g, ' ').trim())
    .filter(Boolean);

  // 1. Extract Vendor
  let vendor = '';
  const vendorBlacklist = ['receipt', 'tax invoice', 'invoice', 'welcome', 'thank you', 'customer copy', 'merchant copy', 'cash register', 'order', 'table', 'quick bill', 'bill no'];
  const primaryKeywords = ['restaurant', 'kitchen', 'cafe', 'coffee', 'hotel', 'diner', 'bakery', 'bistro', 'grill', 'mart', 'store', 'market', 'foods'];
  const secondaryKeywords = ['travel', 'airlines', 'express', 'services', 'enterprises', 'tech', 'retail'];

  // Priority A: Primary food, hospitality, retail merchant keywords
  for (const line of cleanLines.slice(0, 15)) {
    const lower = line.toLowerCase();
    const hasBlacklist = vendorBlacklist.some(b => lower === b || lower.startsWith(b));
    if (!hasBlacklist && primaryKeywords.some(k => lower.includes(k))) {
      const cleaned = line.replace(/^(?:ec|da|es|fe|er|mr|ms|st|nd|rd|th)\s+/i, '').replace(/\s+(?:bt|rt|go|fc|pm|am|\d+.*)$/i, '').trim();
      if (cleaned.length >= 3 && cleaned.length <= 40) {
        vendor = cleaned;
        break;
      }
    }
  }

  // Priority B: Secondary merchant keywords
  if (!vendor) {
    for (const line of cleanLines.slice(0, 15)) {
      const lower = line.toLowerCase();
      const hasBlacklist = vendorBlacklist.some(b => lower === b || lower.startsWith(b));
      if (!hasBlacklist && secondaryKeywords.some(k => lower.includes(k))) {
        const cleaned = line.replace(/^(?:ec|da|es|fe|er|mr|ms|st|nd|rd|th)\s+/i, '').replace(/\s+(?:bt|rt|go|fc|pm|am|\d+.*)$/i, '').trim();
        if (cleaned.length >= 3 && cleaned.length <= 40) {
          vendor = cleaned;
          break;
        }
      }
    }
  }

  // Priority B: First prominent non-blacklisted line with valid words
  if (!vendor) {
    for (let i = 0; i < Math.min(cleanLines.length, 6); i++) {
      const candidate = cleanLines[i];
      const lower = candidate.toLowerCase();
      const hasBlacklist = vendorBlacklist.some(b => lower.includes(b));
      const words = candidate.split(/\s+/).filter(w => w.length > 2);
      if (!hasBlacklist && words.length >= 1 && candidate.length > 2 && candidate.length < 40 && !/^\d+$/.test(candidate)) {
        vendor = candidate;
        break;
      }
    }
  }

  if (!vendor) {
    vendor = fallbackVendor || 'Merchant Receipt';
  }

  // 2. Extract Date (MM/DD/YYYY, YYYY-MM-DD, DD-MM-YYYY, DD Month YYYY, Month DD YYYY)
  let date = new Date();
  const datePatterns = [
    /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
    /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i,
    /\b(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{2,4})\b/,
    /\b(\d{4})[\/\.-](\d{1,2})[\/\.-](\d{1,2})\b/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const parsedDate = new Date(match[0]);
      if (!isNaN(parsedDate.getTime()) && parsedDate.getFullYear() > 2000 && parsedDate.getFullYear() <= 2035) {
        date = parsedDate;
        break;
      }
    }
  }

  // 3. Extract Currency
  let currency = 'USD';
  if (/€|EUR/i.test(text)) currency = 'EUR';
  else if (/£|GBP/i.test(text)) currency = 'GBP';
  else if (/₹|INR|\bRs\.?|\bRupees|\bUPI\b/i.test(text)) currency = 'INR';
  else if (/CAD|C\$/i.test(text)) currency = 'CAD';
  else if (/AUD|A\$/i.test(text)) currency = 'AUD';
  else if (/JPY|¥/i.test(text)) currency = 'JPY';

  // 4. Extract Total Amount
  let totalAmount = 0;
  let taxAmount = 0;
  let subtotalAmount = 0;

  // Priority 1: Explicit Grand Total / Net Total / Net Amount
  const grandTotalRegex = /(?:grand\s*total|net\s*(?:total|payable|amount)|amount\s*payable)[\s:.\-_=]*(?:rs\.?|inr|usd|eur|gbp|[$€£₹])?\s*(\d+(?:[\.,]\d{1,2})?)/i;
  const grandMatch = text.match(grandTotalRegex);

  if (grandMatch) {
    totalAmount = parseFloat(grandMatch[1].replace(',', '.'));
  } else {
    // Priority 2: Look line-by-line for Total / Amount Due (explicitly skipping Qty / Quantity / Items)
    const totalLines = rawLines.filter(l => /(?:total|amount due|balance due)/i.test(l) && !/(?:qty|quantity|items|count|tax)/i.test(l));
    for (const line of totalLines) {
      const lineMatch = line.match(/(?:total|amount due|balance due)[\s:.\-_=]*(?:rs\.?|inr|usd|eur|gbp|[$€£₹])?\s*(\d+(?:[\.,]\d{1,2})?)/i);
      if (lineMatch) {
        const val = parseFloat(lineMatch[1].replace(',', '.'));
        if (val > 0) {
          totalAmount = val;
          break;
        }
      }
    }

    // Priority 3: Fallback to highest sensible currency amount in text
    if (!totalAmount) {
      const amountRegex = /(?:rs\.?|inr|usd|eur|gbp|[$€£₹])\s*(\d+(?:[\.,]\d{2})?)\b|\b(\d+[\.,]\d{2})\b/gi;
      const amounts = [];
      let match;
      while ((match = amountRegex.exec(text)) !== null) {
        const val = parseFloat((match[1] || match[2]).replace(',', '.'));
        if (val > 0.5 && val < 500000) amounts.push(val);
      }
      if (amounts.length > 0) {
        totalAmount = Math.max(...amounts);
      }
    }
  }

  // Look for Tax
  const taxRegex = /(?:tax|gst|vat|sales tax)[\s:.\-_=]*(?:rs\.?|inr|usd|eur|gbp|[$€£₹])?\s*(\d+(?:[\.,]\d{1,2})?)/i;
  const taxMatch = text.match(taxRegex);
  if (taxMatch) {
    taxAmount = parseFloat(taxMatch[1].replace(',', '.'));
  }

  // Look for Subtotal
  const subtotalRegex = /(?:subtotal|sub-total|sub total)[\s:.\-_=]*(?:rs\.?|inr|usd|eur|gbp|[$€£₹])?\s*(\d+(?:[\.,]\d{1,2})?)/i;
  const subMatch = text.match(subtotalRegex);
  if (subMatch) {
    subtotalAmount = parseFloat(subMatch[1].replace(',', '.'));
  } else if (totalAmount > 0 && taxAmount > 0) {
    subtotalAmount = Math.max(0, Math.round((totalAmount - taxAmount) * 100) / 100);
  } else if (totalAmount > 0) {
    subtotalAmount = totalAmount;
  }

  // 5. Payment Method
  let paymentMethod = 'Corporate Card';
  if (/cash/i.test(text)) paymentMethod = 'Cash';
  else if (/upi|bhim|gpay|google pay|phonepe|paytm/i.test(text)) paymentMethod = 'Cash';
  else if (/visa/i.test(text)) paymentMethod = 'Corporate Card (Visa)';
  else if (/mastercard/i.test(text)) paymentMethod = 'Corporate Card (Mastercard)';
  else if (/amex|american express/i.test(text)) paymentMethod = 'Corporate Card (AMEX)';
  else if (/debit/i.test(text)) paymentMethod = 'Personal Card';

  // 6. Intelligent Category Classification
  let suggestedCategory = 'Other';
  const lower = text.toLowerCase() + ' ' + vendor.toLowerCase();

  if (/airline|flight|airport|delta|united|american air|southwest|lufthansa|boarding pass|terminal/i.test(lower)) {
    suggestedCategory = 'Travel';
  } else if (/restaurant|cafe|coffee|starbucks|bistro|steakhouse|bar|grill|diner|burger|pizza|sushi|food|kitchen|rice|meals|curry/i.test(lower)) {
    suggestedCategory = 'Meals & Entertainment';
  } else if (/hotel|inn|suites|marriott|hilton|hyatt|airbnb|resort|motel|lodging/i.test(lower)) {
    suggestedCategory = 'Accommodation';
  } else if (/uber|lyft|taxi|cab|train|metro|transit|subway|parking|toll/i.test(lower)) {
    suggestedCategory = 'Transportation';
  } else if (/software|saas|aws|github|amazon web|google cloud|microsoft|adobe|slack|atlassian|zoom|figma/i.test(lower)) {
    suggestedCategory = 'Software & Subscriptions';
  } else if (/office|staples|depot|stationery|paper|desk|supplies|hardware store/i.test(lower)) {
    suggestedCategory = 'Office Supplies';
  } else if (/electric|water|power|broadband|telecom|verizon|at&t|internet|utility/i.test(lower)) {
    suggestedCategory = 'Utilities';
  } else if (/google ads|facebook ads|linkedin ads|advertising|marketing|promo|print/i.test(lower)) {
    suggestedCategory = 'Marketing';
  } else if (/laptop|monitor|apple|dell|lenovo|computer|equipment|mouse|keyboard/i.test(lower)) {
    suggestedCategory = 'Equipment';
  }

  // Confidence Score Calculation
  let confidenceScore = 75;
  if (totalAmount > 0) confidenceScore += 15;
  if (vendor && vendor !== 'Merchant Receipt') confidenceScore += 5;
  if (taxAmount > 0) confidenceScore += 4;

  return {
    vendor,
    date,
    totalAmount: totalAmount > 0 ? totalAmount : 0,
    subtotalAmount: subtotalAmount > 0 ? subtotalAmount : (totalAmount > 0 ? totalAmount : 0),
    taxAmount: taxAmount > 0 ? taxAmount : 0,
    currency,
    paymentMethod,
    suggestedCategory,
    confidenceScore: Math.min(confidenceScore, 99.5),
    extractedText: text,
  };
}

/**
 * Perform OCR on a receipt file
 */
async function processReceiptFile(filePath, originalFilename = 'receipt.jpg') {
  const fileHash = calculateFileHash(filePath);
  let extractedText = '';

  // Attempt Tesseract if available (skip PDF as Tesseract only supports image streams)
  const ext = path.extname(filePath).toLowerCase();
  const isPdf = ext === '.pdf' || (originalFilename && originalFilename.toLowerCase().endsWith('.pdf'));

  if (Tesseract && !isPdf) {
    try {
      console.log(`[OCR Service] Starting Tesseract recognition for ${originalFilename}...`);

      // Determine langPath: use local eng.traineddata if it exists in project root,
      // otherwise let Tesseract fall back to its CDN (works on Render and any cloud host)
      const localTrainedDataDir = path.join(__dirname, '../../');
      const localTrainedDataFile = path.join(localTrainedDataDir, 'eng.traineddata');
      const useLocalLang = fs.existsSync(localTrainedDataFile);

      const ocrOptions = {
        logger: () => {}, // silent in logs
      };
      if (useLocalLang) {
        ocrOptions.langPath = localTrainedDataDir;
        console.log('[OCR Service] Using local eng.traineddata');
      } else {
        console.log('[OCR Service] Local traineddata not found — using CDN');
      }

      const ocrPromise = Tesseract.recognize(filePath, 'eng', ocrOptions);
      // Safety timeout: 60s for CDN download + recognition on first cold run
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('OCR recognition timed out after 60s')), 60000)
      );

      const result = await Promise.race([ocrPromise, timeoutPromise]);
      extractedText = (result && result.data && result.data.text) ? result.data.text : '';
      console.log(`[OCR Service] Extracted ${extractedText.length} characters.`);
    } catch (ocrErr) {
      console.warn(`[OCR Service] Tesseract skipped: ${ocrErr.message}`);
      // Do NOT rethrow — let the request continue with empty text and graceful fallback
    }
  }

  // Use only what was actually extracted from the uploaded image - do not invent fake amounts
  const parsed = parseReceiptText(extractedText);
  return {
    fileHash,
    ...parsed,
  };
}

module.exports = {
  processReceiptFile,
  parseReceiptText,
  calculateFileHash,
};
