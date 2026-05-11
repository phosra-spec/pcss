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
  readonly status: number | undefined
  readonly capability: string | undefined
  readonly verdict: Verdict | undefined
  readonly retryable: boolean
  readonly requestId: string | undefined
  override readonly cause: unknown

  constructor(args: {
    code: PhosraErrorCode
    message: string
    status?: number
    capability?: string
    verdict?: Verdict
    retryable?: boolean
    requestId?: string
    cause?: unknown
  }) {
    super(args.message)
    this.name = "PhosraError"
    this.code = args.code
    this.status = args.status
    this.capability = args.capability
    this.verdict = args.verdict
    this.retryable = args.retryable ?? false
    this.requestId = args.requestId
    this.cause = args.cause
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
  async _request<T>(path: string, init: RequestInit & { body?: unknown }): Promise<T> {
    const baseUrl = this.opts.baseUrl ?? DEFAULT_BASE_URL
    const url = baseUrl.replace(/\/$/, "") + path
    const fetcher = this.opts.fetch ?? globalThis.fetch
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "accept": "application/json",
      "idempotency-key": this._ulid(),
    }
    if (this.opts.implementer) headers["x-phosra-implementer"] = this.opts.implementer
    if (this.opts.auth?.kind === "bearer") {
      headers["authorization"] = `Bearer ${this.opts.auth.token}`
    }
    const controller = new AbortController()
    const timeoutMs = this.opts.timeoutMs ?? 5_000
    const timeout = setTimeout(() => controller.abort(), timeoutMs)

    let response: Response
    try {
      response = await fetcher(url, {
        ...init,
        headers: { ...headers, ...(init.headers ?? {}) },
        body: init.body == null ? undefined : JSON.stringify(init.body),
        signal: controller.signal,
      })
    } catch (err) {
      throw new PhosraError({
        code: "network",
        message: `request failed: ${String(err)}`,
        cause: err,
        retryable: true,
      })
    } finally {
      clearTimeout(timeout)
    }

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
    if (response.status >= 500) {
      throw new PhosraError({
        code: "network",
        message: `server error ${response.status}`,
        status: response.status,
        retryable: true,
        requestId,
      })
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

  /** @internal — ULID-style request key */
  _ulid(): string {
    return (
      Date.now().toString(36) +
      Math.random().toString(36).slice(2, 12)
    )
  }
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
