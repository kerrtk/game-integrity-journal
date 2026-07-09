import { NextResponse } from "next/server"
import { z } from "zod"

const newsletterSchema = z.object({
  email: z.string().email(),
})

// NOTE: this is a stub. Wire this up to an email service provider (e.g. Brevo)
// once the newsroom has a subscriber list ready to receive contacts.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = newsletterSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "A valid email address is required." }, { status: 400 })
  }

  return NextResponse.json({ ok: true })
}
