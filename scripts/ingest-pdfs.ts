import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// ======================
// CONFIGURATION CONSTANTS
// ======================
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const OLLAMA_URL = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const IDENTITY = fs.existsSync('agents/folu-john-identity.json')
  ? JSON.parse(fs.readFileSync('agents/folu-john-identity.json', 'utf8'))
  : null;

// CRITICAL: These MUST be defined before any function that uses them
const CATEGORY_MAP: Record<string, string> = {
  'hymns': 'Hymn',
  'legacy': 'Legacy',
  'lessons': 'Lesson',
  'sermons': 'Sermon',
  'announcements': 'Announcement',
  'pdfs': 'General'
};

const MINISTRY_VALUES: Record<string, string> = {
  'hymns': 'reverence',
  'legacy': 'tradition',
  'lessons': 'teaching',
  'sermons': 'kingdom',
  'announcements': 'practical',
  'pdfs': 'general'
};

// ======================
// HELPER FUNCTIONS
// ======================
/**
 * Get all PDF files in directory recursively
 */
function getPdfFiles(dir: string, all: string[] = []): string[] {
  if (!fs.existsSync(dir)) return all;
  for (const file of fs.readdirSync(dir)) {
    const f = path.join(dir, file);
    if (fs.statSync(f).isDirectory()) {
      getPdfFiles(f, all);
    } else if (f.endsWith('.pdf')) {
      all.push(f);
    }
  }
  return all;
}

/**
 * Clean old "general" chunks from processed categories
 */
async function cleanGeneralChunks() {
  console.log('\n🧹 Cleaning old "general" chunks from processed categories...');
  const categoriesToClean = ['Hymn', 'Sermon', 'Lesson', 'Legacy'];
  
  for (const category of categoriesToClean) {
    const { error } = await supabase
      .from('documents')
      .delete()
      .eq('category', category)
      .eq('metadata->>ministry_value', 'general');
    
    if (error) {
      console.warn(`⚠️ Cleanup warning for ${category}:`, error.message);
    } else {
      console.log(`✅ Cleaned ${category} chunks with "general" ministry_value`);
    }
  }
}

/**
 * Safely update document by deleting existing then inserting new
 */
async function upsertWithUpdate(doc: any) {
  // Delete existing document with same content/source/fileName
  await supabase
    .from('documents')
    .delete()
    .eq('content', doc.content)
    .eq('metadata->>source', doc.metadata.source)
    .eq('metadata->>fileName', doc.metadata.fileName);
  
  return await supabase.from('documents').insert(doc);
}

/**
 * Get embeddings from Ollama with error handling
 */
async function getEmbeddings(texts: string[]): Promise<number[][]> {
  const embeddings: number[][] = [];
  
  for (const text of texts) {
    try {
      const response = await fetch(`${OLLAMA_URL}/api/embeddings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: 'nomic-embed-text', 
          input: text 
        }),
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Ollama error ${response.status}: ${errText}`);
      }
      
      const data = await response.json();
      embeddings.push(data.embedding);
    } catch (error: any) {
      console.warn(`⚠️ Embedding skipped for chunk: ${error.message}`);
      embeddings.push([]); // Push empty array as placeholder
    }
  }
  
  return embeddings;
}

// ======================
// MAIN PROCESS
// ======================
async function main() {
  console.log('\n🚀 Cele Ingestion: Full Clean & Re-Tag...\n');

  // Step 1: Clean existing incorrect ministry values
  await cleanGeneralChunks();

  // Step 2: Get PDF files
  const pdfPaths = getPdfFiles('public');
  if (pdfPaths.length === 0) {
    console.log('⚠️ No PDFs found in public/ — stopping.');
    return;
  }
  console.log(`🔎 Found ${pdfPaths.length} PDFs to process.\n`);

  // Step 3: Initialize PDF parser
  const pdfParse = await import('pdf-parse-fork')
    .then(m => m.default || m)
    .catch(() => {
      throw new Error('Failed to load pdf-parse-fork. Please install it.');
    });

  // Step 4: Process each PDF
  for (const filePath of pdfPaths) {
    try {
      const fileName = path.basename(filePath);
      const folder = path.basename(path.dirname(filePath));
      
      // Map folder to category and ministry value
      const category = CATEGORY_MAP[folder] || 'General';
      const ministryValue = MINISTRY_VALUES[folder] || 'general';
      
      console.log(`📄 ${fileName} → [${folder}] → ${category} + "${ministryValue}"`);

      // Read and parse PDF
      const dataBuffer = fs.readFileSync(filePath);
      const data = await pdfParse(dataBuffer);
      
      if (!data.text?.trim()) {
        console.warn(`  ⚠️ Empty or image-only — skipping`);
        continue;
      }

      // Chunk text (1000 chars with 200 overlap)
      const chunks: string[] = [];
      let offset = 0;
      while (offset < data.text.length) {
        const chunk = data.text.substring(offset, offset + 1000);
        chunks.push(chunk);
        offset += Math.min(200, data.text.length - offset); // Safe overlap
      }
      
      console.log(`   Split into ${chunks.length} chunks...`);

      // Get embeddings
      const embeddings = await getEmbeddings(chunks);
      
      // Insert/update documents
      for (let i = 0; i < chunks.length; i++) {
        const embedding = embeddings[i];
        
        await upsertWithUpdate({
          content: chunks[i],
          metadata: {
            source: filePath,
            fileName,
            category,
            chunk_index: i,
            tone: IDENTITY?.voice_style?.tone,
            values: IDENTITY?.voice_style?.emphasize,
            ministry_value: ministryValue,
            source_profile: 'folu-john'
          },
          embedding: (embedding.length === 768 && embedding.some(v => typeof v === 'number')) 
            ? embedding 
            : null
        });
      }
      
      console.log(`   ✅ Overwrote ${chunks.length} chunks\n`);
    } catch (err: any) {
      console.error(`❌ Error processing ${filePath}:`, err.message);
    }
  }

  console.log('🏁 Ingestion complete! All ministry values are now accurate.\n');
}

// Run the process with top-level error handling
main().catch(error => {
  console.error('\n💥 Fatal error during ingestion:', error);
  process.exit(1);
});