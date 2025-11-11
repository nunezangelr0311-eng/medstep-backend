// /api/register-student.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ACTIONS_SECRET = process.env.ACTIONS_SECRET;

if (!supabaseUrl || !serviceRoleKey || !ACTIONS_SECRET) {
  throw new Error('Missing required environment variables');
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Helper: validar token Bearer
function validateAuth(req) {
  const auth = req.headers['authorization'] || req.headers['Authorization'];
  if (!auth || !auth.startsWith('Bearer ')) return false;
  const token = auth.replace('Bearer ', '').trim();
  return token === ACTIONS_SECRET;
}

export default async function handler(req, res) {
  try {
    // Solo POST permitido
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    // Seguridad
    if (!validateAuth(req)) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { email, name } = req.body || {};

    if (!email) {
      return res.status(400).json({ error: 'email is required' });
    }

    // 1) Buscar si ya existe estudiante con ese email
    const { data: existing, error: selectError } = await supabase
      .from('students')
      .select('id')
      .eq('email', email.toLowerCase())
      .maybeSingle();

    if (selectError) {
      console.error('Error selecting student:', selectError);
      return res.status(500).json({ error: 'Database error (select)' });
    }

    if (existing && existing.id) {
      // Ya existe → devolvemos el mismo student_id
      return res.status(200).json({
        success: true,
        student_id: existing.id,
        status: 'existing'
      });
    }

    // 2) Si no existe, creamos uno nuevo
    const { data: inserted, error: insertError } = await supabase
      .from('students')
      .insert([
        {
          email: email.toLowerCase(),
          name: name || null
        }
      ])
      .select('id')
      .single();

    if (insertError) {
      console.error('Error inserting student:', insertError);
      return res.status(500).json({ error: 'Database error (insert)' });
    }

    return res.status(201).json({
      success: true,
      student_id: inserted.id,
      status: 'created'
    });
  } catch (err) {
    console.error('Unexpected error in /api/register-student:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
