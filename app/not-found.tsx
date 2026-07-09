import Link from "next/link"

import { Button } from "@/components/ui/button"

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center">
      <p className="mono text-crimson">404</p>
      <h1 className="mt-2 text-4xl text-bone">This report doesn&apos;t exist.</h1>
      <p className="mt-4 text-lg text-steel">
        The page you&apos;re looking for was moved, removed, or never filed.
      </p>
      <Button asChild className="mt-8">
        <Link href="/">Back to the front page</Link>
      </Button>
    </div>
  )
}
