import { NextResponse } from "next/server"
import { z } from "zod"

const contactSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  topic: z.string().optional(),
  message: z.string().min(10),
})

/**
 * Contact stub. Validates and accepts the message. NOTE: wire this to a
 * real inbox / ticketing / Brevo transactional email before launch —
 * right now it just acknowledges receipt.
 */
export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = contactSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: "Please complete all fields." }, { status: 400 })
  }

  // TODO: deliver to a real inbox / Brevo transactional template.
  return NextResponse.json({ ok: true })
}
