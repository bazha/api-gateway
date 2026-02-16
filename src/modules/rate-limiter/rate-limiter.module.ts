import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          ttl: 60 * 1000, // 1 minute
          limit: 100, // Increased from 5 to 100
        },
      ],
    }),
  ],
})
export class RateLimiterModule {}
