var express = require('express');
var router = express.Router();
let modelUser = require('../schemas/users');
let modelRole = require('../schemas/roles');
let { sendPasswordEmail } = require('../utils/sendMailHandler');

function generateRandomPassword(length = 16) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()-_=+';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

// GET all users (không lấy user đã xoá mềm)
// GET /api/v1/users
router.get('/', async function (req, res, next) {
  try {
    let users = await modelUser.find({ isDeleted: false });
    res.send(users);
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

// GET user theo id
// GET /api/v1/users/:id
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let user = await modelUser.findById(id);
    if (user && !user.isDeleted) {
      res.send(user);
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    res.status(404).send({ message: 'User not found' });
  }
});

// CREATE user
// POST /api/v1/users
router.post('/', async function (req, res, next) {
  try {
    let newUser = new modelUser({
      username: req.body.username,
      password: req.body.password,
      email: req.body.email,
      fullName: req.body.fullName,
      avatarUrl: req.body.avatarUrl,
      status: req.body.status,
      role: req.body.role,
      loginCount: req.body.loginCount,
    });
    await newUser.save();
    res.send(newUser);
  } catch (error) {
    res
      .status(400)
      .send({ message: 'Cannot create user', error: error.message });
  }
});

// IMPORT users in batch
// POST /api/v1/users/import
router.post('/import', async function (req, res, next) {
  try {
    const payload = Array.isArray(req.body) ? req.body : req.body.users;

    if (!Array.isArray(payload) || payload.length === 0) {
      return res.status(400).send({ message: 'Dữ liệu users không hợp lệ' });
    }

    let role = await modelRole.findOne({ name: 'user', isDeleted: false });
    if (!role) {
      role = await modelRole.create({ name: 'user', description: 'User role' });
    }

    const results = [];

    for (const record of payload) {
      const username = String(record.username || '').trim();
      const email = String(record.email || '').trim().toLowerCase();
      if (!username || !email) {
        results.push({ username, email, status: 'skipped', reason: 'username or email missing' });
        continue;
      }

      let existing = await modelUser.findOne({ $or: [{ username }, { email }] });
      if (existing) {
        results.push({ username, email, status: 'skipped', reason: 'already exists' });
        continue;
      }

      const password = generateRandomPassword(16);

      const newUser = new modelUser({
        username,
        password,
        email,
        role: role._id,
        status: false,
      });

      await newUser.save();

      // send email with credentials (Mailtrap recommended)
      try {
        await sendPasswordEmail({ to: email, username, password });
        results.push({ username, email, status: 'created', password, mailed: true });
      } catch (mailError) {
        results.push({ username, email, status: 'created', password, mailed: false, mailError: mailError.message });
      }
    }

    res.send({ message: 'Import completed', results });
  } catch (error) {
    res.status(500).send({ message: 'Import failed', error: error.message });
  }
});

// UPDATE user
// PUT /api/v1/users/:id
router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedUser = await modelUser.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (updatedUser) {
      res.send(updatedUser);
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    res.status(404).send({ message: 'User not found' });
  }
});

// XOÁ MỀM user
// DELETE /api/v1/users/:id
router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let deletedUser = await modelUser.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (deletedUser) {
      res.send(deletedUser);
    } else {
      res.status(404).send({ message: 'User not found' });
    }
  } catch (error) {
    res.status(404).send({ message: 'User not found' });
  }
});

// ENABLE user: truyền email và username, nếu đúng thì status = true
// POST /api/v1/users/enable
router.post('/enable', async function (req, res, next) {
  try {
    let { email, username } = req.body;
    if (!email || !username) {
      return res
        .status(400)
        .send({ message: 'Email và username là bắt buộc' });
    }

    let user = await modelUser.findOne({
      email: email.toLowerCase(),
      username: username,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).send({ message: 'Thông tin không chính xác' });
    }

    user.status = true;
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

// DISABLE user: truyền email và username, nếu đúng thì status = false
// POST /api/v1/users/disable
router.post('/disable', async function (req, res, next) {
  try {
    let { email, username } = req.body;
    if (!email || !username) {
      return res
        .status(400)
        .send({ message: 'Email và username là bắt buộc' });
    }

    let user = await modelUser.findOne({
      email: email.toLowerCase(),
      username: username,
      isDeleted: false,
    });

    if (!user) {
      return res.status(404).send({ message: 'Thông tin không chính xác' });
    }

    user.status = false;
    await user.save();
    res.send(user);
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
