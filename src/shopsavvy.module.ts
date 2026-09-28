import { Module, DynamicModule, Global } from "@nestjs/common"
import { ShopSavvyService } from "./shopsavvy.service"
import { SHOPSAVVY_OPTIONS } from "./constants"

export interface ShopSavvyModuleOptions {
  /** Your ShopSavvy API key (ss_live_... or ss_test_...). */
  apiKey: string
  /** Override the ShopSavvy API base URL. */
  baseUrl?: string
  /** Request timeout in milliseconds. Default: 30000. */
  timeout?: number
}

@Global()
@Module({})
export class ShopSavvyModule {
  /**
   * Register the ShopSavvy module with an API key.
   *
   * Usage:
   *   @Module({
   *     imports: [ShopSavvyModule.forRoot({ apiKey: process.env.SHOPSAVVY_API_KEY })],
   *   })
   *   export class AppModule {}
   */
  static forRoot(options: ShopSavvyModuleOptions): DynamicModule {
    return {
      module: ShopSavvyModule,
      providers: [
        {
          provide: SHOPSAVVY_OPTIONS,
          useValue: options,
        },
        ShopSavvyService,
      ],
      exports: [ShopSavvyService],
    }
  }
}
