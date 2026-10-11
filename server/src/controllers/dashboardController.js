import { getDashboardStats } from '../services/dashboardService.js';

export async function dashboard(req, res) {
  res.json({ success: true, data: await getDashboardStats(req.user.societyId) });
}
