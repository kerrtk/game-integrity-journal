/**
 * Flywheel OS — Event Bus
 * ------------------------------------------------------------------
 * Fan-out of every flywheel event to every registered sink. This is the
 * seam where "every action is measured": modules call `bus.track(...)`,
 * the bus validates and timestamps the event, then routes it everywhere.
 */

import { flywheelEventSchema, type FlywheelEvent, type FlywheelEventInput } from "./schema"
import type { EventSink } from "./sinks"

export class EventBus {
  private readonly sinks: EventSink[] = []

  use(sink: EventSink): this {
    this.sinks.push(sink)
    return this
  }

  /** Validate, normalize, and fan an event out to all sinks. */
  async track(input: FlywheelEventInput): Promise<FlywheelEvent> {
    const event = flywheelEventSchema.parse(input)
    await Promise.all(
      this.sinks.map(async (sink) => {
        try {
          await sink.emit(event)
        } catch (e) {
          // A sink must never break the caller's flow.
          // eslint-disable-next-line no-console
          console.error(`[flywheel] sink "${sink.id}" failed:`, e)
        }
      })
    )
    return event
  }
}
