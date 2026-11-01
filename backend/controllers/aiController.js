const { processAssistantQuery } = require('../services/aiAssistantService');

// @desc    Process AI assistant question / command
// @route   POST /api/ai/chat
exports.chatWithAssistant = async (req, res, next) => {
  try {
    const { query } = req.body;
    if (!query || !query.trim()) {
      return res.status(400).json({ success: false, message: 'Please provide a question or instruction.' });
    }

    const response = await processAssistantQuery(query.trim(), req.user);

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (err) {
    next(err);
  }
};
