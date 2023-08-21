import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { LogModule } from 'src/log/log.module';
import { AuthJwtModule } from 'src/auth/jwt/auth-jwt.module';
import { AuthSessionModule } from 'src/auth/session/auth-session.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: `env/.env.${process.env.NODE_ENV}`,
      isGlobal: true
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (config: ConfigService) =>
        ({
          type: config.get('DATABASE_TYPE'),
          host: config.get('DATABASE_HOST'),
          port: config.get('DATABASE_PORT'),
          username: config.get('DATABASE_USER'),
          password: config.get('DATABASE_PASS'),
          database: config.get('DATABASE_NAME'),
          entityPrefix: 'db_',
          autoLoadEntities: true,
          synchronize: process.env.NODE_ENV === 'production' ? false : true
        } as TypeOrmModuleOptions)
    }),
    LogModule,
    AuthJwtModule,
    AuthSessionModule
  ],
  controllers: [AppController]
})
export class AppModule {}
