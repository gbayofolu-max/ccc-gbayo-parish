import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json({
    success: true,
    envCheck: {
      supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      jinaKey: !!process.env.JINA_API_KEY,

      cerebrasKeys: [
        !!process.env.CEREBRAS_KEY_1,
        !!process.env.CEREBRAS_KEY_2,
        !!process.env.CEREBRAS_KEY_3,
        !!process.env.CEREBRAS_KEY_4,
        !!process.env.CEREBRAS_KEY_5,
        !!process.env.CEREBRAS_KEY_6,
      ],

      groqKeys: [
        !!process.env.GROQ_KEY_1,
        !!process.env.GROQ_KEY_2,
        !!process.env.GROQ_KEY_3,
        !!process.env.GROQ_KEY_4,
        !!process.env.GROQ_KEY_5,
        !!process.env.GROQ_KEY_6,
      ],
    },
  });
}