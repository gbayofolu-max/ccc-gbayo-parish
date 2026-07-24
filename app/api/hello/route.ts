import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const name = (body as any).name ?? 'world';
  return NextResponse.json({ greeting: `Hello, ${name}!` });
}
