import { NextResponse } from "next/server"

import { getOS } from "@/config/flywheel"

/**
 * Read-only health check for the Brevo capture wiring. Reports booleans
 * only — never the API key or any secret value — so it's safe to expose.
 * Used to confirm the deployment actually received BREVO_API_KEY and that
 * the Brevo capture provider registered (vs. the console fallback).
 */
export const dynamic = "force-dynamic"

export async function GET() {
  const os = getOS()
  return NextResponse.json({
    brevoKeyPresent: Boolean(process.env.BREVO_API_KEY),
    brevoProviderRegistered: Boolean(os.providers.get("brevo")),
    listIdConfigured: process.env.BREVO_LIST_ID ?? null,
    senderConfigured: Boolean(process.env.BREVO_SENDER_EMAIL),
  })
}
