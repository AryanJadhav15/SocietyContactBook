import { sqlPool } from '../config/mysql.js';

export async function getDashboardStats(societyId) {
  const [summaryRows] = await sqlPool.execute(
    `SELECT
       (SELECT COUNT(*) FROM contacts WHERE society_id = ? AND status = 'ACTIVE') AS activeContacts,
       (SELECT COUNT(*) FROM contacts WHERE society_id = ?) AS totalContacts,
       (SELECT COUNT(*) FROM flats WHERE society_id = ? AND status = 'ACTIVE') AS activeFlats,
       (SELECT COUNT(*) FROM users WHERE society_id = ? AND status = 'ACTIVE') AS activeUsers`,
    [societyId, societyId, societyId, societyId]
  );

  const [categoryRows] = await sqlPool.execute(
    `SELECT c.id, c.name, COUNT(co.id) AS count
       FROM categories c
       LEFT JOIN contacts co
         ON co.category_id = c.id
        AND co.society_id = c.society_id
        AND co.status = 'ACTIVE'
      WHERE c.society_id = ?
      GROUP BY c.id, c.name
      ORDER BY c.name`,
    [societyId]
  );

  const [recentRows] = await sqlPool.execute(
    `SELECT co.id, co.contact_code AS contactCode, co.person_name AS personName,
            co.updated_at AS updatedAt, cat.name AS categoryName
       FROM contacts co
       INNER JOIN categories cat ON cat.id = co.category_id
      WHERE co.society_id = ?
      ORDER BY co.updated_at DESC
      LIMIT 6`,
    [societyId]
  );

  return {
    summary: summaryRows[0],
    contactsByCategory: categoryRows,
    recentlyUpdated: recentRows
  };
}
