import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

/**
 * Provides authorization using JSON Web Tokens (JWT).
 */
@Module({
  imports: [JwtModule.register({ global: true })]
})
export class AuthJwtModule {}
