/**
 * Flywheel OS — Result
 * ------------------------------------------------------------------
 * A tiny discriminated-union result type. Pipeline steps and providers
 * return `Result` instead of throwing, so one failing integration never
 * takes down the whole capture/nurture flow.
 */

export type Result<T> = { ok: true; value: T } | { ok: false; error: string }

export const ok = <T>(value: T): Result<T> => ({ ok: true, value })
export const err = <T = never>(error: string): Result<T> => ({ ok: false, error })

/** Run a thunk, converting a thrown error into an `err` result. */
export async function attempt<T>(fn: () => Promise<T> | T): Promise<Result<T>> {
  try {
    return ok(await fn())
  } catch (e) {
    return err(e instanceof Error ? e.message : String(e))
  }
}
