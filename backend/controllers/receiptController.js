const fs = require('fs');
const path = require('path');
const Receipt = require('../models/Receipt');
const Expense = require('../models/Expense');
const { processReceiptFile } = require('../services/ocrService');

// @desc    Upload receipt and perform OCR extraction
// @route   POST /api/receipts/upload
exports.uploadAndScanReceipt = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a receipt file (JPG, PNG, PDF).' });
    }

    const filePath = req.file.path;
    const originalFilename = req.file.originalname;

    // Process OCR and heuristic extraction
    const ocrResult = await processReceiptFile(filePath, originalFilename);

    // Check if identical receipt was uploaded previously
    let duplicateNotice = null;
    if (ocrResult.fileHash) {
      const existing = await Receipt.findOne({ fileHash: ocrResult.fileHash });
      if (existing) {
        duplicateNotice = `Notice: This identical receipt file was already uploaded on ${new Date(existing.createdAt).toLocaleDateString()}.`;
      }
    }

    // Save Receipt record in MongoDB
    const receipt = await Receipt.create({
      userId: req.user._id,
      originalFilename: req.file.originalname,
      filename: req.file.filename,
      filePath: filePath,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      fileHash: ocrResult.fileHash,
      extractedText: ocrResult.extractedText,
      extractedFields: {
        vendor: ocrResult.vendor,
        date: ocrResult.date,
        totalAmount: ocrResult.totalAmount,
        taxAmount: ocrResult.taxAmount,
        subtotalAmount: ocrResult.subtotalAmount,
        currency: ocrResult.currency,
        paymentMethod: ocrResult.paymentMethod,
        suggestedCategory: ocrResult.suggestedCategory,
        confidenceScore: ocrResult.confidenceScore,
        lineItems: [],
      },
      ocrStatus: 'completed',
    });

    res.status(200).json({
      success: true,
      message: 'Receipt uploaded and scanned successfully.',
      receiptId: receipt._id,
      receiptUrl: `/uploads/${receipt.filename}`,
      extracted: receipt.extractedFields,
      duplicateNotice,
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get receipt by ID
// @route   GET /api/receipts/:id
exports.getReceiptById = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    res.status(200).json({ success: true, data: receipt });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's uploaded receipts
// @route   GET /api/receipts
exports.getUserReceipts = async (req, res, next) => {
  try {
    const filter = req.user.role === 'employee' ? { userId: req.user._id } : {};
    const receipts = await Receipt.find(filter).sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: receipts.length, data: receipts });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete receipt
// @route   DELETE /api/receipts/:id
exports.deleteReceipt = async (req, res, next) => {
  try {
    const receipt = await Receipt.findById(req.params.id);
    if (!receipt) {
      return res.status(404).json({ success: false, message: 'Receipt not found' });
    }

    // Role check: employees can only delete their own receipts
    if (req.user.role === 'employee' && receipt.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Unauthorized to delete this receipt.' });
    }

    // Check if other records reference the same physical file
    const otherReceiptWithSameFile = await Receipt.findOne({
      _id: { $ne: receipt._id },
      $or: [
        { filename: receipt.filename },
        ...(receipt.filePath ? [{ filePath: receipt.filePath }] : []),
      ],
    });

    const otherExpenseWithSameFile = await Expense.findOne({
      receiptUrl: `/uploads/${receipt.filename}`,
      ...(receipt.expenseId ? { _id: { $ne: receipt.expenseId } } : {}),
    });

    const isFileInUseElsewhere = Boolean(otherReceiptWithSameFile || otherExpenseWithSameFile);

    // If no other record references the stored file, delete it from storage
    if (!isFileInUseElsewhere && receipt.filename) {
      const uploadDir = path.join(__dirname, '../uploads');
      const resolvedFilePath = receipt.filePath && fs.existsSync(receipt.filePath)
        ? receipt.filePath
        : path.join(uploadDir, receipt.filename);

      if (fs.existsSync(resolvedFilePath)) {
        try {
          fs.unlinkSync(resolvedFilePath);
        } catch (fileErr) {
          console.warn(`[Receipt Delete] Could not remove file ${resolvedFilePath}:`, fileErr.message);
        }
      }
    }

    // Dissociate from any expense referencing this receipt so the expense record is preserved
    if (receipt.expenseId) {
      await Expense.findByIdAndUpdate(receipt.expenseId, { $unset: { receiptId: 1 } });
    }
    await Expense.updateMany({ receiptId: receipt._id }, { $unset: { receiptId: 1 } });

    // Permanently remove receipt database record
    await receipt.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Receipt deleted successfully.',
    });
  } catch (err) {
    next(err);
  }
};
