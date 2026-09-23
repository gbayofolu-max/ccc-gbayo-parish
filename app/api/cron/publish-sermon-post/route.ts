import { NextRequest, NextResponse } from "next/server";
import { publishNextQueuedPost } from "@/ai/sermons/publishNext";

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const result = await publishNextQueuedPost();
  return NextResponse.json(result);
}
