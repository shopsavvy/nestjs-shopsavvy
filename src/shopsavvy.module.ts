import { Module, DynamicModule, Global } from "@nestjs/common"
import { ShopSavvyService } from "./shopsavvy.service"
import { SHOPSAVVY_OPTIONS } from "./constants"

export interface ShopSavvyModuleOptions {
  apiKey: string
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
