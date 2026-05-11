/**
 * In-memory store. The default storage backend for the reference server.
 *
 * Implementers building their own server are free to swap this for any
 * KV / SQL / object store; the Store interface is the only contract.
 */

import type { Bearing, Receipt } from "@phosra/types"

export interface Store {
  putBearing(b: Bearing): void
  getBearing(bearingId: string): Bearing | undefined
  putReceipt(r: Receipt): void
  getReceipt(receiptId: string): Receipt | undefined
}

export class MemoryStore implements Store {
  private bearings = new Map<string, Bearing>()
  private receipts = new Map<string, Receipt>()

  putBearing(b: Bearing): void {
    this.bearings.set(b.bearing_id, b)
  }

  getBearing(bearingId: string): Bearing | undefined {
    return this.bearings.get(bearingId)
  }

  putReceipt(r: Receipt): void {
    this.receipts.set(r.receipt_id, r)
  }

  getReceipt(receiptId: string): Receipt | undefined {
    return this.receipts.get(receiptId)
  }
}
