import { NextResponse } from "next/server"

import { getOS } from "@/config/flywheel"

/**
 * Temporary read-only verification endpoint (booleans only, no secrets).
 * GET ?test=1 runs the real newsroom-signup capture with a fixed probe
 * address to confirm the live Brevo wiring after a key rotation. Removed
 * once verified.
 */
export const dynamic = "force-dynamic"

const PROBE_EMAIL = "gij-health-probe@gameintegrityjournal.com"

export async function GET(request: Request) {
  const os = getOS()
  const runTest = new URL(request.url).searchParams.get("test") === "1"

  const snapshot: Record<string, unknown> = {
    brevoKeyPresent: Boolean(process.env.BREVO_API_KEY),
    brevoProviderRegistered: Boolean(os.providers.get("brevo")),
    listIdConfigured: process.env.BREVO_LIST_ID ?? null,
  }

  if (runTest) {
    const result = await os.capture.capture({
      email: PROBE_EMAIL,
      form: "newsroom-signup",
      brandId: "game-integrity-journal",
      source: "health-probe-rotate",
    })
    snapshot.captureOk = result.ok
    snapshot.captureProviderId = result.ok ? result.value.providerId : null
    snapshot.captureError = result.ok ? null : result.error
  }

  return NextResponse.json(snapshot)
}
