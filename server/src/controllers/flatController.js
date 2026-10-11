import * as flats from '../services/flatService.js';

export const listFlats = async (req, res) => {
  res.json({ success: true, data: await flats.listFlats(req.user.societyId, req.validated.query) });
};

export const createFlat = async (req, res) => {
  res.status(201).json({ success: true, data: await flats.createFlat(req.user.societyId, req.validated.body) });
};

export const updateFlat = async (req, res) => {
  res.json({ success: true, data: await flats.updateFlat(req.user.societyId, req.validated.params.id, req.validated.body) });
};

export const getFlatContacts = async (req, res) => {
  res.json({ success: true, data: await flats.getFlatContacts(req.user.societyId, req.validated.params.id) });
};
