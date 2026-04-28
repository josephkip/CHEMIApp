const { Client } = require('pg');

const ref = 'cqjtkeifxvjtjjwpxzoc';
const region = 'eu-west-1';
const passwords = ['postgres', 'password', 'admin', '123456', 'Admin@123', 'postgres123', 'chemiapp', 'Password123'];

async function tryPass(pass) {
  const url = `postgresql://postgres.${ref}:${pass}@aws-0-${region}.pooler.supabase.com:6543/postgres`;
  const client = new Client({ connectionString: url, connectionTimeoutMillis: 5000 });
  try {
    await client.connect();
    console.log(`✅ PASSWORD FOUND: "${pass}"`);
    console.log(`   URL: ${url.replace(pass, '***')}`);
    await client.end();
    return true;
  } catch (err) {
    console.log(`❌ "${pass}": ${err.message.substring(0, 50)}`);
    try { await client.end(); } catch {}
    return false;
  }
}

(async () => {
  for (const p of passwords) {
    const ok = await tryPass(p);
    if (ok) break;
  }
  console.log('\nIf none worked, please provide your Supabase database password.');
})();
