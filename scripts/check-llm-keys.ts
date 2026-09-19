import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function testCerebras() {
  console.log('\n=== Cerebras keys ===\n');
  for (let i = 1; i <= 6; i++) {
    const key = process.env[`CEREBRAS_KEY_${i}`];
    if (!key) { console.log(`CEREBRAS_KEY_${i.toString().padEnd(2)} -> (not set)`); continue; }
    const masked = key.slice(0, 6) + '...' + key.slice(-4);
    try {
      const res = await fetch('https://api.cerebras.ai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'llama-3.3-70b', messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 }),
      });
      const bodyText = res.ok ? '' : (await res.text()).slice(0, 150);
      console.log(`CEREBRAS_KEY_${i} (${masked}) -> HTTP ${res.status} ${res.ok ? 'OK' : 'INVALID'} ${bodyText}`);
    } catch (e: any) {
      console.log(`CEREBRAS_KEY_${i} (${masked}) -> network error: ${e.message}`);
    }
  }
}

async function testGroq() {
  console.log('\n=== Groq keys ===\n');
  for (let i = 1; i <= 6; i++) {
    const key = process.env[`GROQ_KEY_${i}`];
    if (!key) { console.log(`GROQ_KEY_${i.toString().padEnd(2)} -> (not set)`); continue; }
    const masked = key.slice(0, 6) + '...' + key.slice(-4);
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ model: 'openai/gpt-oss-120b', messages: [{ role: 'user', content: 'hi' }], max_tokens: 5 }),
      });
      console.log(`GROQ_KEY_${i} (${masked}) -> HTTP ${res.status} ${res.ok ? 'OK' : 'INVALID'}`);
    } catch (e: any) {
      console.log(`GROQ_KEY_${i} (${masked}) -> network error: ${e.message}`);
    }
  }
}

async function testGemini() {
  console.log('\n=== Gemini keys (gemini-3.1-flash-lite) ===\n');
  for (let i = 1; i <= 6; i++) {
    const key = process.env[`GEMINI_KEY_${i}`];
    if (!key) { console.log(`GEMINI_KEY_${i.toString().padEnd(2)} -> (not set)`); continue; }
    const masked = key.slice(0, 6) + '...' + key.slice(-4);
    try {
      const res = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent', {
        method: 'POST',
        headers: { 'x-goog-api-key': key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ role: 'user', parts: [{ text: 'hi' }] }], generationConfig: { maxOutputTokens: 5 } }),
      });
      const bodyText = res.ok ? '' : (await res.text()).slice(0, 150);
      console.log(`GEMINI_KEY_${i} (${masked}) -> HTTP ${res.status} ${res.ok ? 'OK' : 'INVALID'} ${bodyText}`);
    } catch (e: any) {
      console.log(`GEMINI_KEY_${i} (${masked}) -> network error: ${e.message}`);
    }
  }
}

async function main() {
  await testCerebras();
  await testGroq();
  await testGemini();
  console.log('');
}

main();
