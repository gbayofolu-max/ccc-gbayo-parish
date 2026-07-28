import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function fetchBibleFromAPI() {
  console.log('📖 Fetching KJV Bible from API...');
  
  // Using the Open Bible API (free, no auth needed)
  const response = await fetch('https://api.scripture.api.bible/v1/verses/KJV?api_key=none');
  const data = await response.json();
  
  console.log('Response:', data);
}

fetchBibleFromAPI().catch(console.error);
