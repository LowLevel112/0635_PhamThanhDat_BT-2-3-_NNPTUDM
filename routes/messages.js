const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const messageModel = require('../schemas/message');
const userModel = require('../schemas/users');
const { checkLogin } = require('../utils/authHandler.js');

function isValidObjectId(id) {
  return mongoose.Types.ObjectId.isValid(id);
}

// GET /api/v1/messages/:userId
// Lấy toàn bộ tin nhắn giữa user hiện tại và userId
router.get('/:userId', checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.userId;
    const otherUserId = req.params.userId;

    if (!isValidObjectId(otherUserId)) {
      return res.status(400).send({ message: 'Invalid userId' });
    }

    const messages = await messageModel
      .find({
        isDeleted: false,
        $or: [
          { from: currentUserId, to: otherUserId },
          { from: otherUserId, to: currentUserId }
        ]
      })
      .sort({ createdAt: 1 })
      .populate('from', 'username fullName email')
      .populate('to', 'username fullName email');

    return res.send(messages);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});

// POST /api/v1/messages
// Tạo tin nhắn mới. Nếu type=file thì text là đường dẫn file,
// nếu type=text thì text là nội dung gửi.
router.post('/', checkLogin, async function (req, res, next) {
  try {
    const fromUserId = req.userId;
    const { to, type, text, messageContent } = req.body;

    const payload = messageContent || { type, text };
    if (!to || !payload?.type || !payload?.text) {
      return res.status(400).send({ message: 'Missing to, type, or text' });
    }

    if (!isValidObjectId(to)) {
      return res.status(400).send({ message: 'Invalid recipient userId' });
    }

    if (!['file', 'text'].includes(payload.type)) {
      return res.status(400).send({ message: 'type must be "file" or "text"' });
    }

    const recipient = await userModel.findById(to);
    if (!recipient) {
      return res.status(404).send({ message: 'Recipient user not found' });
    }

    const newMessage = new messageModel({
      from: fromUserId,
      to,
      messageContent: {
        type: payload.type,
        text: payload.text
      }
    });

    const saved = await newMessage.save();
    const populated = await saved
      .populate('from', 'username fullName email')
      .populate('to', 'username fullName email');

    return res.status(201).send(populated);
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});

// GET /api/v1/messages
// Lấy tin nhắn cuối cùng của mỗi user mà user hiện tại đã nhắn hoặc nhận.
router.get('/', checkLogin, async function (req, res, next) {
  try {
    const currentUserId = req.userId;

    const messages = await messageModel
      .find({
        isDeleted: false,
        $or: [{ from: currentUserId }, { to: currentUserId }]
      })
      .sort({ createdAt: -1 })
      .populate('from', 'username fullName email')
      .populate('to', 'username fullName email');

    const lastMessagesByPartner = new Map();
    for (const message of messages) {
      const partnerId = message.from._id.toString() === currentUserId
        ? message.to._id.toString()
        : message.from._id.toString();

      if (!lastMessagesByPartner.has(partnerId)) {
        lastMessagesByPartner.set(partnerId, message);
      }
    }

    return res.send(Array.from(lastMessagesByPartner.values()));
  } catch (err) {
    return res.status(500).send({ message: err.message });
  }
});

module.exports = router;
