# ShopSavvy for NestJS

A NestJS module that provides an injectable ShopSavvy service for product search and price comparison.

## Install

```bash
npm install nestjs-shopsavvy
```

## Quick Start

### 1. Import the module

```typescript
import { Module } from "@nestjs/common"
import { ShopSavvyModule } from "nestjs-shopsavvy"

@Module({
  imports: [
    ShopSavvyModule.forRoot({
      apiKey: process.env.SHOPSAVVY_API_KEY!,
    }),
  ],
})
export class AppModule {}
```

### 2. Inject the service

```typescript
import { Controller, Get, Query, Param } from "@nestjs/common"
import { ShopSavvyService } from "nestjs-shopsavvy"

@Controller("products")
export class ProductsController {
  constructor(private readonly shopsavvy: ShopSavvyService) {}

  @Get("search")
  async search(@Query("q") query: string) {
    return this.shopsavvy.searchProducts(query, { limit: 10 })
  }

  @Get(":id/offers")
  async getOffers(@Param("id") id: string) {
    return this.shopsavvy.getCurrentOffers(id)
  }
}
```

## Available Methods

```typescript
shopsavvy.searchProducts(query, { limit?, offset? })
shopsavvy.getProductDetails(identifier)
shopsavvy.getCurrentOffers(identifier, { retailer? })   // retailer is a domain, e.g. "amazon.com"
shopsavvy.getPriceHistory(identifier, start, end, { retailer? })   // start/end as "YYYY-MM-DD"; data = products -> offers -> history (newest first)
shopsavvy.getDeals({ sort?, limit?, offset?, category?, retailer?, tag?, grade?, min_price?, max_price? })
// sort: "hot" | "new" | "top-hour" | "top-day" | "top-week"
shopsavvy.getUsage()
shopsavvy.scheduleProductMonitoring(identifier, "hourly" | "daily" | "weekly", { retailer? })
shopsavvy.removeProductFromSchedule(identifier)
shopsavvy.getScheduledProducts()
shopsavvy.getClient() // raw SDK client
```

## Configuration

Get your API key at [shopsavvy.com/data](https://shopsavvy.com/data).

```typescript
ShopSavvyModule.forRoot({
  apiKey: process.env.SHOPSAVVY_API_KEY!,
  // optional
  timeout: 10000,       // request timeout in ms (default 30000)
  baseUrl: undefined,   // override the ShopSavvy API base URL
})
```

`ShopSavvyModule` is global: import it once in your root module and inject `ShopSavvyService` anywhere. Works with NestJS 10 and 11.

## License

MIT
