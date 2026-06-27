import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

function loadEnv() {
  try {
    const envPath = path.resolve(process.cwd(), '.env');
    if (!fs.existsSync(envPath)) return;
    const content = fs.readFileSync(envPath, 'utf-8');
    content.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let value = match[2] || '';
        value = value.replace(/^['"]|['"]$/g, '');
        process.env[key] = value;
      }
    });
  } catch (err) {
    console.error('Error reading .env file:', err.message);
  }
}

loadEnv();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY in .env file.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function seedAdmin() {
  console.log('🚀 Connecting to live Supabase cloud database...');

  const positions = [
    { position_id: 'POS-001', position_name: 'Executive Administrator', department: 'Management' },
    { position_id: 'POS-002', position_name: 'Service Delivery Specialist', department: 'Service Delivery' },
    { position_id: 'POS-003', position_name: 'Shared Services Analyst', department: 'Shared Services' }
  ];

  console.log('🏢 Synchronizing enterprise designations/positions...');
  const { error: posError } = await supabase.from('positions').upsert(positions, { onConflict: 'position_id' });
  if (posError && posError.code !== '23505') {
    if (posError.message.includes('row-level security') || posError.message.includes('schema cache')) {
      console.warn('⚠️ Notice:', posError.message);
    }
  }

  const adminProfile = {
    user_id: 'ADM-001',
    name: 'Executive Admin',
    email: 'admin@realynk.com',
    password: 'admin123',
    department: 'Management',
    role: 'Admin',
    status: 'Active',
    position_id: 'POS-001'
  };

  console.log('👑 Seeding real Executive Admin profile (admin@realynk.com / ID: ADM-001)...');
  const { data, error } = await supabase.from('profiles').upsert([adminProfile], { onConflict: 'user_id' });

  if (error) {
    console.error('❌ Error inserting Admin record:', error.message);
    if (error.message.includes('schema cache') || error.message.includes('row-level security')) {
      console.log('\n========================================================================');
      console.log('🚨 ACTION REQUIRED IN SUPABASE DASHBOARD 🚨');
      console.log('Your cloud Supabase table schema is missing the new columns or has RLS enabled.');
      console.log('Please open your Supabase Dashboard -> SQL Editor and run the SQL script located at:');
      console.log('👉 supabase/migration_update.sql');
      console.log('========================================================================\n');
    }
  } else {
    console.log('✅ Success! Real Executive Admin data established in Supabase.');
    console.log('----------------------------------------------------');
    console.log('Corporate Email : admin@realynk.com');
    console.log('Badge ID        : ADM-001');
    console.log('Password        : admin123');
    console.log('Access Level    : Admin Controller');
    console.log('----------------------------------------------------');
  }
}

seedAdmin();
