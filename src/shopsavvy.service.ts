import { Injectable, Inject } from "@nestjs/common"
import { ShopSavvyDataAPI } from "@shopsavvy/sdk"
import { SHOPSAVVY_OPTIONS } from "./constants"
import type { ShopSavvyModuleOptions } from "./shopsavvy.module"

/**
 * Injectable ShopSavvy service for NestJS.
 *
 * Usage in any controller or service:
 *   constructor(private readonly shopsavvy: ShopSavvyService) {}
 *
 *   async search(query: string) {
 *     return this.shopsavvy.searchProducts(query)
 *   }
 */
@Injectable()
export class ShopSavvyService {
  private client: ShopSavvyDataAPI

  constructor(@Inject(SHOPSAVVY_OPTIONS) options: ShopSavvyModuleOptions) {
    this.client = new ShopSavvyDataAPI({ apiKey: options.apiKey })
  }

  async searchProducts(query: string, options?: { limit?: number; offset?: number }) {
    return this.client.searchProducts(query, options)
  }

  async getProductDetails(identifier: string) {
    return this.client.getProductDetails(identifier)
  }

  async getCurrentOffers(identifier: string, options?: { retailer?: string }) {
    return this.client.getCurrentOffers(identifier, options)
  }

  async getPriceHistory(identifier: string, start: string, end: string, options?: { retailer?: string }) {
    return this.client.getPriceHistory(identifier, start, end, options)
  }

  async getDeals(options?: { limit?: number; sort?: string }) {
    return this.client.getDeals(options as any)
  }

  async getUsage() {
    return this.client.getUsage()
  }

  async scheduleProductMonitoring(identifier: string, schedule: string) {
    return this.client.scheduleProductMonitoring(identifier, schedule as any)
  }

  async removeProductFromSchedule(identifier: string) {
    return this.client.removeProductFromSchedule(identifier)
  }

  async getScheduledProducts() {
    return this.client.getScheduledProducts()
  }

  /** Access the raw SDK client for advanced usage. */
  getClient(): ShopSavvyDataAPI {
    return this.client
  }
}
