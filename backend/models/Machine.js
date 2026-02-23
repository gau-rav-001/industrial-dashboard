const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    machineId: {
      type: String,
      required: true,
      index: true,
    },
    machineType: {
      type: String,
      enum: ['L', 'M', 'H'],  // Low, Medium, High quality
      default: 'M',
    },
    airTemperature: {
      type: Number,
      required: true,
    },
    processTemperature: {
      type: Number,
      required: true,
    },
    rotationalSpeed: {
      type: Number,
      required: true,
    },
    torque: {
      type: Number,
      required: true,
    },
    toolWear: {
      type: Number,
      required: true,
    },
    failureStatus: {
      type: Boolean,
      default: false,
    },
    failureType: {
      type: String,
      default: 'No Failure',
    },
    healthScore: {
      type: Number,
      min: 0,
      max: 100,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast queries
machineSchema.index({ machineId: 1, timestamp: -1 });
machineSchema.index({ failureStatus: 1 });

module.exports = mongoose.model('Machine', machineSchema);
