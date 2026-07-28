// Debug script to check file content
import fs from 'fs';

console.log('Checking kjv.tsv file...');
try {
  const data = fs.readFileSync('data/kjv.tsv', 'utf-8');
  console.log('File size:', data.length, 'bytes');
  console.log('First 200 chars:', data.substring(0, 200));
  console.log('\nFirst line split:', data.split('\n')[0].split('\t'));
  console.log('Line count:', data.split('\n').length);
} catch (err) {
  console.error('Error reading file:', err instanceof Error ? err.message : err);
}
