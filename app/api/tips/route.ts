import { NextResponse } from "next/server"
import { z } from "zod"

/**
 * Confidential tip stub. Contact details are optional by design — a
 * source can submit anonymously. Validates and acknowledges receipt.
 *
 * NOTE: before launch, wire this to a secure intake (encrypted inbox /
 * ticketing / Brevo transactional) and DO NOT log IP or headers here —
 * anonymity is the promise this page makes.
 */
const tipSchema = z.object({
  category: z.string().optional(),
  message: z.string().min(20, "Please add a little more detail."),
  contact: z.string().optional(),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = tipSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Please add more detail to your tip." }, { status: 400 })
  }

  // TODO: deliver to a secure intake. Never persist request metadata.
  return NextResponse.json({ ok: true })
}
