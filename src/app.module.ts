import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailModule } from './email/email.module';
import { BusinessModule } from './business/business.module';
import { AdminModule } from './admin/admin.module';
import { GiftcardModule } from './admin/giftcard/giftcard.module';
import { PaymentModule } from './admin/payment/payment.module';
import { TransactionFeeModule } from './admin/transaction-fee/transaction-fee.module';
import { WithdrawalModule } from './admin/withdrawal/withdrawal.module';
import { WalletModule } from './admin/wallet/wallet.module';
import { ModerationModule } from './admin/moderation/moderation.module';
import { SupportModule } from './admin/support/support.module';
import { PlatformSettingsModule } from './admin/platform-settings/platform-settings.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST'),
        port: configService.get<number>('DB_PORT'),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        synchronize: true,
        logging: true,
      }),
      inject: [ConfigService],
    }),
    EmailModule,
    BusinessModule,
    AdminModule,
    GiftcardModule,
    PaymentModule,
    TransactionFeeModule,
    WithdrawalModule,
    WalletModule,
    ModerationModule,
    SupportModule,
    PlatformSettingsModule,
  ],
  controllers: [],
})
export class AppModule {}
