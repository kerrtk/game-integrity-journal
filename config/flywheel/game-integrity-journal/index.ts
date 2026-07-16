import type { BrandConfig } from "@/lib/flywheel/os"
import { brand } from "./brand"
import { content } from "./content"
import { offers } from "./offers"
import { captureForms } from "./capture"
import { sequences } from "./nurture"
import { processes } from "./processes"
import { automations } from "./automations"

/** The complete Game Integrity Journal brand, ready to register. */
export const gameIntegrityJournal: BrandConfig = {
  brand,
  content,
  offers,
  captureForms,
  sequences,
  processes,
  automations,
}
