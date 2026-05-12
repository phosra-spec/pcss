import type {
  Bearing,
  Verdict,
  Receipt,
  Threshold,
} from "@phosra/types"

export type PhosraErrorCode =
  | "network"
  | "timeout"
  | "schema_invalid"
  | "signature_invalid"
  | "unauthorized"
  | "default_deny"
  | "replay_mismatch"
  | "internal"

export class PhosraError extends Error {
  readonly code: PhosraErrorCode
  readonly status?: number
  readonly capability?: string
  readonly verdict?: Verdict
  readonly retryable: boolean
  readonly requestId?: string
  override readonly cause?: unknown

  constructor(args: {
    code: PhosraErrorCode
    message: string
    status?: number | undefined
    capability?: string | undefined
    verdict?: Verdict | undefined
    retryable?: boolean | undefined
    requestId?: string | undefined
    cause?: unknown
  }) {
    super(args.message)
    this.name = "PhosraError"
    this.code = args.code
    if (args.status !== undefined) this.status = args.status
    if (args.capability !== undefined) this.capability = args.capability
    if (args.verdict !== undefined) this.verdict = args.verdict
    this.retryable = args.retryable ?? false
    if (args.requestId !== undefined) this.requestId = args.requestId
    if (args.cause !== undefined) this.cause = args.cause
  }
}

export type PhosraAuth =
  | { kind: "bearer"; token: string }
  | { kind: "mtls"; cert: string; key: string }
  | { kind: "none" }

export interface PhosraClientOptions {
  /** Base URL ending at `/v1` (or your equivalent). */
  baseUrl?: string
  auth?: PhosraAuth
  /** Injectable fetch for edge runtimes that don't ship a global. */
  fetch?: typeof fetch
  retry?: {
    attempts: number
    backoff: "decorrelated-jitter" | "exponential" | "none"
  }
  timeoutMs?: number
  /** User-Agent style identifier sent in the implementer header. */
  implementer?: string
}

const DEFAULT_BASE_URL = "https://api.phosra.com/v1"

/**
 * PhosraClient — primary entry point.
 *
 * The default singleton `phosra` is bound to the reference Phosra
 * implementation. Adopters running their own Lens/Notary endpoints
 * construct a custom client via `new PhosraClient({ baseUrl })`.
 */
export class PhosraClient {
  readonly bearing: BearingNamespace
  readonly lens: LensNamespace
  readonly threshold: ThresholdNamespace
  readonly aegis: AegisNamespace
  readonly notary: NotaryNamespace

  constructor(private readonly opts: PhosraClientOptions = {}) {
    this.bearing = new BearingNamespace(this)
    this.lens = new LensNamespace(this)
    this.threshold = new ThresholdNamespace(this)
    this.aegis = new AegisNamespace(this)
    this.notary = new NotaryNamespace(this)
  }

  /** @internal */
  async _request<T>(
    path: string,
    init: Omit<RequestInit, "body"> & { body?: unknown; idempotencyKey?: string },
  ): Promise<T> {
    const baseUrl = this.opts.baseUrl ?? DEFAULT_BASE_URL
    const url = baseUrl.replace(/\/$/, "") + path
    const fetcher = this.opts.fetch ?? globalThis.fetch
    const idempotencyKey = init.idempotencyKey ?? this._idempotencyKey()
    const baseHeaders: Record<string, string> = {
      "content-type": "application/json",
      "accept": "application/json",
      "idempotency-key": idempotencyKey,
    }
    if (this.opts.implementer) baseHeaders["x-phosra-implementer"] = this.opts.implementer
    if (this.opts.auth?.kind === "bearer") {
      baseHeaders["authorization"] = `Bearer ${this.opts.auth.token}`
    }

    const attempts = this.opts.retry?.attempts ?? 3
    const backoff = this.opts.retry?.backoff ?? "decorrelated-jitter"
    const timeoutMs = this.opts.timeoutMs ?? 5_000

    let lastErr: PhosraError | undefined
    let prevDelay = 100

    for (let attempt = 0; attempt < attempts; attempt++) {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), timeoutMs)

      let response: Response | undefined
      try {
        response = await fetcher(url, {
          ...init,
          headers: { ...baseHeaders, ...(init.headers ?? {}) },
          body: init.body == null ? undefined : JSON.stringify(init.body),
          signal: controller.signal,
        })
      } catch (err) {
        lastErr = new PhosraError({
          code: "network",
          message: `request failed: ${String(err)}`,
          cause: err,
          retryable: true,
        })
      } finally {
        clearTimeout(timeout)
      }

      if (response) {
        const requestId = response.headers.get("x-request-id") ?? undefined
        if (response.status === 401) {
          throw new PhosraError({
            code: "unauthorized",
            message: "unauthorized — check auth configuration",
            status: 401,
            requestId,
          })
        }
        if (response.status === 422) {
          throw new PhosraError({
            code: "schema_invalid",
            message: "request body does not validate against the schema",
            status: 422,
            requestId,
          })
        }
        if (response.status === 429) {
          const retryAfter = parseRetryAfter(response.headers.get("retry-after"))
          lastErr = new PhosraError({
            code: "network",
            message: "rate limited",
            status: 429,
            retryable: true,
            requestId,
          })
          if (attempt < attempts - 1) {
            await sleep(retryAfter ?? nextBackoff(prevDelay, backoff))
            prevDelay = Math.min(prevDelay * 3, 30_000)
            continue
          }
          throw lastErr
        }
        if (response.status >= 500) {
          lastErr = new PhosraError({
            code: "network",
            message: `server error ${response.status}`,
            status: response.status,
            retryable: true,
            requestId,
          })
          if (attempt < attempts - 1) {
            await sleep(nextBackoff(prevDelay, backoff))
            prevDelay = Math.min(prevDelay * 3, 30_000)
            continue
          }
          throw lastErr
        }
        if (!response.ok) {
          throw new PhosraError({
            code: "internal",
            message: `unexpected ${response.status}`,
            status: response.status,
            requestId,
          })
        }
        return (await response.json()) as T
      }

      // Network error path: retry if we have attempts left.
      if (attempt < attempts - 1) {
        await sleep(nextBackoff(prevDelay, backoff))
        prevDelay = Math.min(prevDelay * 3, 30_000)
        continue
      }
      throw lastErr!
    }
    throw lastErr ?? new PhosraError({ code: "internal", message: "exhausted retries with no response" })
  }

  /** @internal — collision-resistant idempotency key via Web Crypto */
  _idempotencyKey(): string {
    const g = globalThis as { crypto?: { randomUUID?: () => string } }
    return g.crypto?.randomUUID?.() ?? Date.now().toString(36) + Math.random().toString(36).slice(2, 12)
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

function nextBackoff(prevDelayMs: number, mode: "decorrelated-jitter" | "exponential" | "none"): number {
  if (mode === "none") return 0
  if (mode === "exponential") return Math.min(prevDelayMs * 2, 30_000)
  // decorrelated jitter (AWS): random between base and prev*3
  const base = 100
  return Math.min(30_000, base + Math.random() * (prevDelayMs * 3 - base))
}

function parseRetryAfter(header: string | null): number | undefined {
  if (!header) return undefined
  // RFC 7231: either delta-seconds or HTTP-date
  const seconds = Number(header)
  if (Number.isFinite(seconds) && seconds >= 0) return seconds * 1000
  const dateMs = Date.parse(header)
  if (Number.isFinite(dateMs)) {
    const ms = dateMs - Date.now()
    return ms > 0 ? ms : 0
  }
  return undefined
}

class BearingNamespace {
  constructor(private readonly client: PhosraClient) {}

  async identify(args: {
    subject: Record<string, unknown>
    jurisdiction?: string
    acceptable_confidence?: ("attested" | "inferred" | "unverified")[]
  }): Promise<Bearing> {
    return this.client._request<Bearing>("/bearing/identify", {
      method: "POST",
      body: args,
    })
  }
}

class LensNamespace {
  constructor(private readonly client: PhosraClient) {}

  async evaluate(args: {
    bearing: Bearing
    surface: string
    capability: string
    jurisdiction?: string
  }): Promise<Verdict> {
    return this.client._request<Verdict>("/lens/evaluate", {
      method: "POST",
      body: args,
    })
  }
}

class ThresholdNamespace {
  constructor(private readonly client: PhosraClient) {}

  async check(args: {
    bearing: Bearing
    scope: string
  }): Promise<Verdict> {
    return this.client._request<Verdict>("/threshold/check", {
      method: "POST",
      body: args,
    })
  }
}

class AegisNamespace {
  constructor(private readonly client: PhosraClient) {}

  async check(args: {
    bearing: Bearing
    category: "csam" | "gambling-minors" | "dark-patterns" | "age-inappropriate-monetization"
    content: Record<string, unknown>
  }): Promise<Verdict> {
    return this.client._request<Verdict>("/aegis/check", {
      method: "POST",
      body: args,
    })
  }
}

class NotaryNamespace {
  constructor(private readonly client: PhosraClient) {}

  async sign(args: { verdict: Verdict }): Promise<Receipt> {
    return this.client._request<Receipt>("/notary/sign", {
      method: "POST",
      body: args,
    })
  }

  async verify(args: { receipt: Receipt }): Promise<{ valid: boolean; replays: boolean }> {
    return this.client._request<{ valid: boolean; replays: boolean }>(
      "/notary/verify",
      { method: "POST", body: args },
    )
  }
}
