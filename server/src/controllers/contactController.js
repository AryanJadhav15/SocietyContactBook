import * as contacts from '../services/contactService.js';

export const listContacts = async (req, res) => {
  res.json({ success: true, data: await contacts.listContacts(req.user.societyId, req.validated.query) });
};

export const getContact = async (req, res) => {
  res.json({ success: true, data: await contacts.getContact(req.user.societyId, req.validated.params.id) });
};

export const createContact = async (req, res) => {
  const data = { ...req.validated.body, ...(req.file ? { photoPath: req.file.path } : {}) };
  res.status(201).json({ success: true, data: await contacts.createContact(req.user.societyId, req.user.id, data) });
};

export const updateContact = async (req, res) => {
  const data = { ...req.validated.body, ...(req.file ? { photoPath: req.file.path } : {}) };
  res.json({ success: true, data: await contacts.updateContact(req.user.societyId, req.user.id, req.validated.params.id, data) });
};

export const deactivateContact = async (req, res) => {
  res.json({ success: true, data: await contacts.deactivateContact(req.user.societyId, req.user.id, req.validated.params.id) });
};
