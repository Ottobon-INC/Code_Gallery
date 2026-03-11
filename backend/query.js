const { Client } = require('pg');
const c = new Client('postgresql://postgres.uyabrqyntnbawweejbku:Ottobon321123@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres');
c.connect()
    .then(() => c.query('SELECT email, is_admin FROM users;'))
    .then(r => console.log(JSON.stringify(r.rows, null, 2)))
    .catch(console.error)
    .finally(() => c.end());
