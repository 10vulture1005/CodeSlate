import mongoose from 'mongoose';

const callHistorySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  callType: {
    type: String,
    required: true,
    enum: ['incoming', 'outgoing', 'missed']
  },
  duration: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  // Additional fields for better call tracking
  remoteEmail: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['completed', 'failed', 'rejected'],
    default: 'completed'
  }
}, {
  timestamps: true
});

// Index for efficient queries
callHistorySchema.index({ userId: 1, timestamp: -1 });
callHistorySchema.index({ userId: 1, callType: 1 });

const CallHistory = mongoose.model('CallHistory', callHistorySchema);

export default CallHistory;
