import "reflect-metadata"
import { describe, test, expect, beforeAll, afterAll } from "bun:test"
import { Injectable, Module } from "@nestjs/common"
import { NestFactory } from "@nestjs/core"
import type { INestApplicationContext } from "@nestjs/common"
// The compiled package (what npm installs), not src/: this proves the published
// build's decorators and DI metadata work in a real Nest application.
import { ShopSavvyModule, ShopSavvyService } from "../dist"

// Local HTTP server standing in for api.shopsavvy.com; records every request.
type Seen = { method: string; path: string; params: Record<string, string>; auth: string | null; body: unknown }
const seen: Seen[] = []
let api: ReturnType<typeof Bun.serve>
let app: INestApplicationContext
const apiKey = "ss_test_nestjs123"

// A consumer injected by type, the way users write it in controllers/services.
@Injectable()
class PriceChecker {
  constructor(readonly shopsavvy: ShopSavvyService) {}
}

beforeAll(async () => {
  api = Bun.serve({
    port: 0,
    async fetch(req) {
      const url = new URL(req.url)
      const text = await req.text()
      seen.push({
        method: req.method,
        path: url.pathname,
        params: Object.fromEntries(url.searchParams),
        auth: req.headers.get("authorization"),
        body: text ? JSON.parse(text) : null,
      })
      if (url.pathname === "/v1/products/offers/history") {
        // The real shape: one entry per product, each offer carrying its own history
        // (newest first; `currency` null / `availability` absent when unknown).
        return Response.json({
          success: true,
          data: [{
            title: "Sony WH-1000XM5",
            shopsavvy: "abc123",
            category: null,
            offers: [
              {
                id: "o1",
                retailer: "Amazon",
                price: 299.99,
                currency: "USD",
                seller: null,
                history: [
                  { timestamp: "2026-01-02T00:00:00Z", price: 299.99, currency: "USD", availability: "in" },
                  { timestamp: "2025-12-20T00:00:00Z", price: 329.99, currency: null },
                ],
              },
              { id: "o2", retailer: "eBay", price: 210, currency: "USD", seller: "audio_reseller" },
            ],
          }],
          meta: { credits_used: 2, credits_remaining: 998 },
        })
      }
      if (url.pathname === "/v1/products/scheduled" && req.method === "PUT") {
        // What the API's schedule handler returns: each scheduled product plus its schedule.
        return Response.json({
          success: true,
          data: [{ title: "Sony WH-1000XM5", shopsavvy: "abc123", schedule: url.searchParams.get("schedule"), ...(url.searchParams.get("retailer") && { retailer: url.searchParams.get("retailer") }) }],
          meta: { credits_used: 1, credits_remaining: 997 },
        })
      }
      if (url.pathname === "/v1/products/scheduled" && req.method === "DELETE") {
        return Response.json({ success: true, message: "Products successfully removed from schedule", meta: { credits_used: 0, credits_remaining: 0 } })
      }
      if (url.pathname === "/v1/deals") {
        return Response.json({ success: true, deals: [], pagination: { total: 0, has_more: false, limit: 5, offset: 0 } })
      }
      return Response.json({ success: true, data: [{ title: "Sony WH-1000XM5", shopsavvy: "abc123" }] })
    },
  })

  @Module({
    imports: [ShopSavvyModule.forRoot({ apiKey, baseUrl: `http://127.0.0.1:${api.port}/v1` })],
    providers: [PriceChecker],
  })
  class AppModule {}

  app = await NestFactory.createApplicationContext(AppModule, { logger: false })
})

afterAll(async () => {
  await app.close()
  api.stop(true)
})

describe("ShopSavvyModule.forRoot", () => {
  test("provides ShopSavvyService to other providers by type", () => {
    const checker = app.get(PriceChecker)
    expect(checker.shopsavvy).toBeInstanceOf(ShopSavvyService)
    const resolved: ShopSavvyService = app.get(ShopSavvyService)
    expect(resolved === checker.shopsavvy).toBe(true)
  })

  test("searchProducts reaches /products/search with the bearer key", async () => {
    seen.length = 0
    const result = await app.get(ShopSavvyService).searchProducts("sony", { limit: 5 })
    expect(result.data[0].title).toBe("Sony WH-1000XM5")
    expect(seen[0]).toMatchObject({ method: "GET", path: "/v1/products/search", params: { q: "sony", limit: "5" }, auth: `Bearer ${apiKey}` })
  })

  test("getCurrentOffers forwards ids and retailer", async () => {
    seen.length = 0
    await app.get(ShopSavvyService).getCurrentOffers("B09XS7JWHH", { retailer: "amazon.com" })
    expect(seen[0]).toMatchObject({ path: "/v1/products/offers", params: { ids: "B09XS7JWHH", retailer: "amazon.com" } })
  })

  test("getPriceHistory sends start/end and returns products -> offers -> history", async () => {
    seen.length = 0
    const result = await app.get(ShopSavvyService).getPriceHistory("B09XS7JWHH", "2026-01-01", "2026-01-31")
    expect(seen[0]).toMatchObject({ path: "/v1/products/offers/history", params: { ids: "B09XS7JWHH", start: "2026-01-01", end: "2026-01-31" } })
    expect(result.data).toHaveLength(1)
    expect(result.data[0].shopsavvy).toBe("abc123")
    const [amazon, ebay] = result.data[0].offers
    expect(amazon.history.map((point) => [point.timestamp, point.price, point.currency])).toEqual([
      ["2026-01-02T00:00:00Z", 299.99, "USD"],
      ["2025-12-20T00:00:00Z", 329.99, null],
    ])
    // the SDK normalizes an offer the API sent without `history` to an empty array
    expect(ebay.history).toEqual([])
  })

  test("getDeals forwards sort and filters", async () => {
    seen.length = 0
    const result = await app.get(ShopSavvyService).getDeals({ sort: "top-week", limit: 5, category: "electronics" })
    expect(result.deals).toEqual([])
    expect(seen[0]).toMatchObject({ path: "/v1/deals", params: { sort: "top-week", limit: "5", category: "electronics" } })
  })

  // The API's schedule/unschedule handlers read ONLY the query string (ids, schedule,
  // retailer); a JSON body is ignored.
  test("scheduleProductMonitoring PUTs ids + schedule as query params, no body", async () => {
    seen.length = 0
    const result = await app.get(ShopSavvyService).scheduleProductMonitoring("B09XS7JWHH", "daily")
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ method: "PUT", path: "/v1/products/scheduled", params: { ids: "B09XS7JWHH", schedule: "daily" }, body: null })
    expect(result.success).toBe(true)
  })

  test("scheduleProductMonitoring forwards a retailer domain", async () => {
    seen.length = 0
    await app.get(ShopSavvyService).scheduleProductMonitoring("B09XS7JWHH", "hourly", { retailer: "amazon.com" })
    expect(seen[0]).toMatchObject({ method: "PUT", path: "/v1/products/scheduled", params: { ids: "B09XS7JWHH", schedule: "hourly", retailer: "amazon.com" }, body: null })
  })

  test("removeProductFromSchedule DELETEs with ids as a query param, no body", async () => {
    seen.length = 0
    const result = await app.get(ShopSavvyService).removeProductFromSchedule("B09XS7JWHH")
    expect(seen).toHaveLength(1)
    expect(seen[0]).toMatchObject({ method: "DELETE", path: "/v1/products/scheduled", params: { ids: "B09XS7JWHH" }, body: null })
    expect(result.success).toBe(true)
  })

  test("getScheduledProducts GETs /products/scheduled", async () => {
    seen.length = 0
    await app.get(ShopSavvyService).getScheduledProducts()
    expect(seen[0]).toMatchObject({ method: "GET", path: "/v1/products/scheduled", params: {} })
  })

  test("getClient exposes the underlying SDK client", () => {
    expect(typeof app.get(ShopSavvyService).getClient().getProductReview).toBe("function")
  })
})
