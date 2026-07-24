// investigate-db.ts
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import * as dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// 1. FORCE LOAD ENV
const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
} else {
    console.error("❌ ERROR:.env file NOT found at:", envPath);
}

// 2. SETUP CLIENTS
const sUrl = process.env.SUPABASE_URL;
const sKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const oKey = process.env.OPENAI_API_KEY;

async function runInvestigation() {
    console.log("🕵️‍♂️ Starting Cele Data Investigation...\n");

    if (!sUrl ||!sKey ||!oKey) {
        console.error("❌ ERROR: Missing credentials in.env");
        console.log({ sUrl: sUrl? "OK" : "MISSING", sKey: sKey? "OK" : "MISSING", oKey: oKey? "OK" : "MISSING" });
        return;
    }

    const supabase = createClient(sUrl, sKey);
    const openai = new OpenAI({ apiKey: oKey });

    // --- STEP 1: CONNECTION ---
    console.log("🔍 [1/3] Checking Connection...");
    try {
        const { count, error } = await supabase.from('documents').select('*', { count: 'exact', head: true });
        if (error) throw error;
        console.log(`✅ SUCCESS: Found ${count} rows in 'documents'`);
    } catch (err: any) {
        console.error("❌ CONNECTION FAILED:", err.message);
        return;
    }

    // --- STEP 2: EMBEDDINGS ---
    console.log("\n🔍 [2/3] Checking Embeddings...");
    try {
        const { data, error } = await supabase.from('documents').select('embedding').limit(1).single();
        if (error ||!data ||!data.embedding) {
            console.log("⚠️ WARNING: No embeddings found. Table is empty or column is null.");
        } else {
            const dims = (data.embedding as any[]).length;
            console.log(`✅ SUCCESS: Embedding dimensions: ${dims}`);
        }
    } catch (err: any) {
        console.log("⚠️ WARNING: Embedding check failed:", err.message);
    }

    // --- STEP 3: SEARCH ---
    console.log("\n🔍 [3/3] Testing Search (RAG)...");
    try {
        const embedRes = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: "Genesis 1:1",
        });
        const vector = embedRes.data[0].embedding;

        const { data: matches, error: rpcError } = await supabase.rpc('match_documents', {
            query_embedding: vector,
            match_count: 1,
        });

        if (rpcError) {
            console.log("❌ RPC ERROR:", rpcError.message);
        } else if (!matches || matches.length === 0) {
            console.log("⚠️ RESULT: Search worked, but returned 0 matches.");
        } else {
            console.log(`✅ SUCCESS: Found match: "${matches[0].content.substring(0, 40)}..."`);
        }
    } catch (err: any) {
        console.log("❌ SEARCH ERROR:", err.message);
    }

    console.log("\n--------------------------------------------------");
    console.log("🕵️‍♂️ INVESTIGATION COMPLETE");
    console.log("--------------------------------------------------\n");
}

runInvestigation();