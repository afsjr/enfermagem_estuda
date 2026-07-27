import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

async function test() {
  console.log("Fetching from:", `${SUPABASE_URL}/functions/v1/csm-tutor-proxy`);
  const response = await fetch(`${SUPABASE_URL}/functions/v1/csm-tutor-proxy`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      action: 'generateQuizJson',
      topic: 'Sinais Vitais'
    })
  });
  
  const data = await response.text();
  console.log("Raw Response:");
  console.log(data);
}

test();
