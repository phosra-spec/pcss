import { PhosraClient } from "./client.js"

/**
 * Default singleton client bound to the reference Phosra endpoint.
 *
 * For custom endpoints (your own Lens, an adopter-hosted reference),
 * construct your own client via `new PhosraClient({ baseUrl })`.
 */
export const phosra = new PhosraClient()
