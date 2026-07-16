/**
 * Flywheel OS — Event Sinks
 * ------------------------------------------------------------------
 * A sink is any destination an event can be routed to: the server log,
 * an in-memory buffer (used by the OS dashboard), or — in production —
 * a warehouse / product-analytics vendor. New vendors plug in by
 * implementing `EventSink`; nothing else changes.
 */

import type { FlywheelEvent } from "./schema"

export interface EventSink {
  readonly id: string
  emit(event: FlywheelEvent): void | Promise<void>
}

/** Writes a compact line to the server console. */
export const consoleSink: EventSink = {
  id: "console",
  emit(event) {
    const value = event.valueCents ? ` $${(event.valueCents / 100).toFixed(2)}` : ""
    // eslint-disable-next-line no-console
    console.log(
      `[flywheel] ${event.brandId} · ${event.stage}/${event.name}` +
        `${event.entity ? ` · ${event.entity}` : ""}${value}`
    )
  },
}

/**
 * Keeps the last N events in memory. Perfect for the dashboard's
 * "recent activity" feed and for computing live KPIs without a database.
 * In a serverless deployment this is per-instance and ephemeral by
 * design — swap in a durable sink for real analytics.
 */
export class MemorySink implements EventSink {
  readonly id = "memory"
  private readonly buffer: FlywheelEvent[] = []

  constructor(private readonly max = 500) {}

  emit(event: FlywheelEvent) {
    this.buffer.push(event)
    if (this.buffer.length > this.max) this.buffer.shift()
  }

  recent(limit = 50): FlywheelEvent[] {
    return this.buffer.slice(-limit).reverse()
  }

  all(): FlywheelEvent[] {
    return [...this.buffer]
  }
}
