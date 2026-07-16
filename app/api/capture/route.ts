import { NextResponse } from "next/server"

import { getOS } from "@/config/flywheel"

/**
 * The one lead-capture endpoint for the whole OS. Any form on any brand
 * posts here; the pipeline validates, persists via the form's provider,
 * enrolls the lead in a nurture sequence, and emits analytics events.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const os = getOS()

  const result = await os.capture.capture({
    email: body?.email,
    name: body?.name,
    form: body?.form ?? "newsroom-signup",
    brandId: body?.brandId ?? "game-integrity-journal",
    source: body?.source,
  })

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 400 })
  }

  return NextResponse.json({
    ok: true,
    enrolledSequence: result.value.enrolledSequence ?? null,
  })
}
