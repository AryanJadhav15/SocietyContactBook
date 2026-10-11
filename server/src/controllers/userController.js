import * as users from '../services/userService.js';

export const listUsers = async (req, res) => {
  res.json({ success: true, data: await users.listUsers(req.user.societyId) });
};

export const createUser = async (req, res) => {
  res.status(201).json({ success: true, data: await users.createUser(req.user.societyId, req.validated.body) });
};

export const updateUser = async (req, res) => {
  res.json({ success: true, data: await users.updateUser(req.user.societyId, req.validated.params.id, req.validated.body) });
};
