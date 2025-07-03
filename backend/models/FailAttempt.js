import mongoose from 'mongoose';

const FailAttemptSchema = new mongoose.Schema({
  // storeId: String,
  device_id: {
    type: String,
    default: '', // Optional: leave blank if not provided
    trim: true,
  },
  browser_token: {
    type: String,
    default: '', // Optional: leave blank if not provided
    trim: true,
  },
  failed_attempts: {
    type: Number,
    default: 0, // Tracks consecutive failed attempts
  },
  is_locked: {
    type: Boolean,
    default: false, // Indicates if the device is temporarily locked
  },
  is_blocked: {
    type: Boolean,
    default: false, // Indicates if the device is permanently blocked
  },
  lockUntil: {
    type: Date,
    default: null, // Timestamp for when the lock expires
  },
  fail_count: {
    type: Number,
    default: 0, // Tracks the number of times the device has been locked
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: true, // Automatically manage `createdAt` and `updatedAt` fields
});

// Add an index to uniquely identify fail attempts by device_id and browser_token
FailAttemptSchema.index({ device_id: 1, browser_token: 1 }, { unique: true });

export default mongoose.model('FailAttempt', FailAttemptSchema);
