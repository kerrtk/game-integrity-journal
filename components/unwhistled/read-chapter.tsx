"use client"

import * as Dialog from "@radix-ui/react-dialog"
import { X } from "lucide-react"

import { Button } from "@/components/ui/button"

/**
 * "Read the first chapter" reader — a focus-trapped glass overlay.
 * NOTE: placeholder chapter text. Drop in the real excerpt when ready.
 */
export function ReadChapter() {
  return (
    <Dialog.Root>
      <Dialog.Trigger asChild>
        <Button variant="ghost" size="lg">
          Read first chapter
        </Button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-ink/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content className="fixed inset-0 z-[101] mx-auto flex max-w-3xl flex-col px-6 py-10 focus:outline-none">
          <div className="glass-strong flex h-full flex-col overflow-hidden rounded-xl">
            <div className="flex items-center justify-between border-b border-line px-7 py-4">
              <Dialog.Title className="mono text-[11px] text-gold-soft">
                Unwhistled · Chapter One
              </Dialog.Title>
              <Dialog.Close className="text-steel transition-colors hover:text-bone" aria-label="Close">
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <div className="prose-article overflow-y-auto px-7 py-8">
              <h2 className="cinema mb-6 text-3xl normal-case text-bone">The Pattern, Not the Play</h2>
              <p>
                A single missed call is an accident. Two is a coincidence. But keep a record long
                enough and the accidents start to rhyme — same situations, same silence, same
                corrections issued only once the footage went viral.
              </p>
              <p>
                This book is not a highlight reel of bad nights for referees. It is a case file: every
                incident cross-checked against footage, box scores, and the league&apos;s own
                statements, arranged so the pattern makes the argument on its own.
              </p>
              <p className="mono text-sm text-steel">
                [ Placeholder excerpt — the full first chapter goes here. ]
              </p>
            </div>
            <div className="border-t border-line px-7 py-4 text-center">
              <Dialog.Close asChild>
                <Button variant="gold" size="sm">
                  Close
                </Button>
              </Dialog.Close>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
