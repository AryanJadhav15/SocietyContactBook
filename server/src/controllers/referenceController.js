import { z } from 'zod';
import * as references from '../services/referenceService.js';

const nameBody = z.object({ name: z.string().trim().min(2).max(120) });

export const listReferences = async (req, res) => {
  res.json({ success: true, data: await references.listReferenceData(req.user.societyId) });
};

export const createSubcategory = async (req, res) => {
  const body = nameBody.parse(req.body);
  res.status(201).json({ success: true, data: await references.createSubcategory(req.user.societyId, Number(req.params.categoryId), body.name) });
};

export const createService = async (req, res) => {
  const body = nameBody.parse(req.body);
  res.status(201).json({ success: true, data: await references.createService(req.user.societyId, body.name) });
};

export const createWorkType = async (req, res) => {
  const body = nameBody.parse(req.body);
  res.status(201).json({ success: true, data: await references.createWorkType(req.user.societyId, body.name) });
};
