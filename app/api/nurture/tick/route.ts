import { NextResponse } from "next/server"

import { getOS } from "@/config/flywheel"

/**
 * Nurture worker tick. A scheduler (Vercel Cron — see vercel.json) calls
 * this on an interval; it delivers every step that's currently due and
 * schedules the next. Optionally guarded by CRON_SECRET.
 *
 * Note: enrollments live in memory per server instance (see the engine).
 * Back the engine with durable storage before relying on this across a
 * multi-instance deployment.
 */
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET
  if (secret) {
    const auth = request.headers.get("authorization")
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }
  }

  const os = getOS()
  const due = os.nurture.due()
  let delivered = 0
  for (const enrollment of due) {
    const result = await os.nurture.advance(enrollment)
    if (result.ok) delivered += 1
  }

  return NextResponse.json({ ok: true, processed: due.length, delivered })
}
