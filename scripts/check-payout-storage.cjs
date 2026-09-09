// Read-only database check; prints counts only, never payout/account details.
require('dotenv').config({ quiet: true });
const { Client } = require('pg');
const client = new Client({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });
(async () => {
  await client.connect();
  await client.query('BEGIN READ ONLY');
  const result = await client.query(`SELECT
    (SELECT count(*)::int FROM "PayoutRequest" WHERE status = 'PENDING' AND cardinality("commissionIds") = 0 AND cardinality("settlementIds") = 0) AS legacy_requests,
    (SELECT count(*)::int FROM "Commission" c JOIN "Order" o ON o.id = c."orderId" WHERE c.status = 'PENDING' AND o.status = 'PAID') AS paid_sales_with_pending_commissions`);
  await client.query('COMMIT');
  console.log(JSON.stringify(result.rows[0]));
})().catch(() => { console.error('Read-only payout storage check failed.'); process.exitCode = 1; }).finally(() => client.end());
