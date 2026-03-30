const mongoose = require('mongoose');

const messageContentSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['file', 'text']
    },
    text: {
      type: String,
      required: true
    }
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'user',
      required: true
    },
    messageContent: {
      type: messageContentSchema,
      required: true
    },
    isDeleted: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('message', messageSchema);
