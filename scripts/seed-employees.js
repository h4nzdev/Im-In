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

async function seedEmployees() {
  console.log('🚀 Connecting to live Supabase cloud database...');

  const sampleEmployees = [
    {
      user_id: 'RLK-1001',
      name: 'Sarah Jenkins',
      email: 's.jenkins@realynk.com',
      password: 'password123',
      department: 'Service Delivery',
      assigned_account: 'FinTech Global Support',
      role: 'User',
      status: 'Active',
      position_id: 'POS-002',
      deadline_date: '2026-07-15',
      deadline_title: 'Complete Biometric Setup & Security Training'
    },
    {
      user_id: 'RLK-1002',
      name: 'Marcus Vance',
      email: 'm.vance@realynk.com',
      password: 'password123',
      department: 'Shared Services',
      assigned_account: null,
      role: 'User',
      status: 'Active',
      position_id: 'POS-003',
      deadline_date: '2026-07-20',
      deadline_title: 'Submit Q3 Shared Services Roadmap'
    },
    {
      user_id: 'RLK-1003',
      name: 'Elena Rostova',
      email: 'e.rostova@realynk.net',
      password: 'password123',
      department: 'Service Delivery',
      assigned_account: 'Healthcare Billing Operations',
      role: 'User',
      status: 'Active',
      position_id: 'POS-002',
      deadline_date: null,
      deadline_title: null
    }
  ];

  console.log(`👥 Inserting ${sampleEmployees.length} real sample employee profiles into Supabase...`);
  const { data, error } = await supabase.from('profiles').upsert(sampleEmployees, { onConflict: 'user_id' });

  if (error) {
    console.error('❌ Error seeding employee records:', error.message);
    if (error.message.includes('schema cache') || error.message.includes('row-level security')) {
      console.log('\n========================================================================');
      console.log('🚨 ACTION REQUIRED IN SUPABASE DASHBOARD 🚨');
      console.log('Your cloud Supabase table schema is missing the new columns or has RLS enabled.');
      console.log('Please open your Supabase Dashboard -> SQL Editor and run the SQL script located at:');
      console.log('👉 supabase/migration_update.sql');
      console.log('========================================================================\n');
    }
  } else {
    console.log('✅ Success! Real employee data seeded into cloud database.');
    console.log('----------------------------------------------------');
    sampleEmployees.forEach(emp => {
      console.log(`👤 ${emp.name} | Badge ID: ${emp.user_id} | Email: ${emp.email} | Dept: ${emp.department}`);
    });
    console.log('----------------------------------------------------');
    console.log('Password for all sample employees: password123');
  }
}

seedEmployees();
