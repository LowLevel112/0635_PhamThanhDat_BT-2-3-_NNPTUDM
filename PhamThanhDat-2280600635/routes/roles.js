var express = require('express');
var router = express.Router();
let modelRole = require('../schemas/roles');

// GET all roles (không lấy role đã xoá mềm)
// GET /api/v1/roles
router.get('/', async function (req, res, next) {
  try {
    let roles = await modelRole.find({ isDeleted: false });
    res.send(roles);
  } catch (error) {
    res.status(500).send({ message: 'Server error', error: error.message });
  }
});

// GET role theo id
// GET /api/v1/roles/:id
router.get('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let role = await modelRole.findById(id);
    if (role && !role.isDeleted) {
      res.send(role);
    } else {
      res.status(404).send({ message: 'Role not found' });
    }
  } catch (error) {
    res.status(404).send({ message: 'Role not found' });
  }
});

// CREATE role
// POST /api/v1/roles
router.post('/', async function (req, res, next) {
  try {
    let newRole = new modelRole({
      name: req.body.name,
      description: req.body.description,
    });
    await newRole.save();
    res.send(newRole);
  } catch (error) {
    res
      .status(400)
      .send({ message: 'Cannot create role', error: error.message });
  }
});

// UPDATE role
// PUT /api/v1/roles/:id
router.put('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let updatedRole = await modelRole.findByIdAndUpdate(id, req.body, {
      new: true,
    });
    if (updatedRole) {
      res.send(updatedRole);
    } else {
      res.status(404).send({ message: 'Role not found' });
    }
  } catch (error) {
    res.status(404).send({ message: 'Role not found' });
  }
});

// XOÁ MỀM role
// DELETE /api/v1/roles/:id
router.delete('/:id', async function (req, res, next) {
  try {
    let id = req.params.id;
    let deletedRole = await modelRole.findByIdAndUpdate(
      id,
      { isDeleted: true },
      { new: true }
    );
    if (deletedRole) {
      res.send(deletedRole);
    } else {
      res.status(404).send({ message: 'Role not found' });
    }
  } catch (error) {
    res.status(404).send({ message: 'Role not found' });
  }
});

module.exports = router;

