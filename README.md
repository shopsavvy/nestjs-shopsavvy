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
shopsavvy.getCurrentOffers(identifier, { retailer? })
shopsavvy.getPriceHistory(identifier, start, end, { retailer? })
shopsavvy.getDeals({ limit?, sort? })
shopsavvy.getUsage()
shopsavvy.scheduleProductMonitoring(identifier, schedule)
shopsavvy.removeProductFromSchedule(identifier)
shopsavvy.getScheduledProducts()
shopsavvy.getClient() // raw SDK client
```

## Configuration

Get your API key at [shopsavvy.com/data](https://shopsavvy.com/data).

```typescript
ShopSavvyModule.forRoot({
  apiKey: process.env.SHOPSAVVY_API_KEY!,
})
```

## License

MIT
