import { Controller, Get } from '@nestjs/common';
import { WalletService } from './wallet.service';

@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get('transactions')
  async getAllWalletTransactions() {
    return this.walletService.getAllWalletTransactions();
  }

  @Get('total-balance')
getTotalBalance() {
  return this.walletService.getTotalWalletBalance();
}

@Get('pending-withdrawals')
getPendingWithdrawals() {
  return this.walletService.getPendingWithdrawals();
}

@Get('todays-earnings')
getTodaysEarnings() {
  return this.walletService.getTodaysEarnings();
}

@Get('platform-fees')
getPlatformFees() {
  return this.walletService.getPlatformFees();
}

}
