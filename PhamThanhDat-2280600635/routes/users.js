var express = require('express');
var router = express.Router();
let modelUser = require('../schemas/users');

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
