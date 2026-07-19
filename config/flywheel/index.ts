/**
 * Flywheel OS — Brand Bootstrap
 * ------------------------------------------------------------------
 * The single place brands are registered. To add a brand: create a
 * folder under config/flywheel/<brand>, export a BrandConfig, and add
 * one line here. No engine or module code changes — that's the whole
 * point of the architecture.
 */

import { FlywheelOS } from "@/lib/flywheel/os"
import { gameIntegrityJournal } from "./game-integrity-journal"

const BRANDS = [gameIntegrityJournal]

let instance: FlywheelOS | null = null

/** Memoized OS singleton for the current server process. */
export function getOS(): FlywheelOS {
  if (instance) return instance
  const os = new FlywheelOS()
  for (const brand of BRANDS) os.registerBrand(brand)
  instance = os
  return os
}
