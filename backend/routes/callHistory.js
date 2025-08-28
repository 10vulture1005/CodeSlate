import express from 'express';
import CallHistory from '../models/callHistory.js';
import User from '../models/user.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// GET /api/call-history/:userId - Get call history after last sign in
router.get('/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Verify the user is requesting their own data
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get user's last sign in time
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Get call history after last sign in
    const callHistory = await CallHistory.find({
      userId,
      timestamp: { $gte: user.lastSignIn }
    })
    .sort({ timestamp: -1 })
    .populate('userId', 'email');

    res.json({
      callHistory,
      lastSignIn: user.lastSignIn,
      totalCalls: callHistory.length
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/call-history - Add new call record
router.post('/', auth, async (req, res) => {
  try {
    const { userId, callType, duration, remoteEmail, status = 'completed' } = req.body;

    if (!userId || !callType || !remoteEmail) {
      return res.status(400).json({ error: 'userId, callType, and remoteEmail are required' });
    }

    // Verify the user is creating their own call record
    if (req.user._id.toString() !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Validate call type
    const validCallTypes = ['incoming', 'outgoing', 'missed'];
    if (!validCallTypes.includes(callType)) {
      return res.status(400).json({ error: 'Invalid call type' });
    }

    // Create new call record
    const callRecord = new CallHistory({
      userId,
      callType,
      duration: duration || 0,
      remoteEmail,
      status
    });

    await callRecord.save();

    // Populate user data for response
    await callRecord.populate('userId', 'email');

    res.status(201).json({
      message: 'Call record created successfully',
      callRecord
    });
  } catch (error) {
    console.error('Create call history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/call-history - Get all call history for authenticated user
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 20, callType } = req.query;
    const skip = (page - 1) * limit;

    const query = { userId: req.user._id };
    if (callType) {
      query.callType = callType;
    }

    const callHistory = await CallHistory.find(query)
      .sort({ timestamp: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .populate('userId', 'email');

    const total = await CallHistory.countDocuments(query);

    res.json({
      callHistory,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get call history error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
