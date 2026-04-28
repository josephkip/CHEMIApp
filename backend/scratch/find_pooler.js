const { Client } = require('pg');

const regions = ['eu-central-1', 'us-east-1', 'eu-west-1', 'eu-west-2'];
const ref = 'cqjtkeifxvjtjjwpxzoc';
const pass = 'postgres';

async function tryRegion(region) {
  const url = `postgresql://postgres.${ref}:${pass}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 8000 });
  try {
    await client.connect();
    const res = await client.query('SELECT 1 as test');
    console.log(`✅ CONNECTED via ${region}! URL: ${url.replace(pass, '***')}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ ${region}: ${err.message}`);
    try { await client.end(); } catch {}
    return false;
  }
}

(async () => {
  for (const r of regions) {
    const ok = await tryRegion(r);
    if (ok) break;
  }
})();
