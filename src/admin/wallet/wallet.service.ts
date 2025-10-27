import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from '../payment/entities/payment.entity';
import { Withdrawal } from '../withdrawal/entities/withdrawal.entity';
import { GiftCard } from '../giftcard/entities/giftcard.entity';
import { Between } from 'typeorm';
import moment from 'moment';


@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Withdrawal)
    private readonly withdrawalRepo: Repository<Withdrawal>,
    @InjectRepository(GiftCard)
    private readonly giftCardRepo: Repository<GiftCard>,
  ) {}

  async getAllWalletTransactions(): Promise<any[]> {
    const payments = await this.paymentRepo.find();
    const withdrawals = await this.withdrawalRepo.find();
    const giftCards = await this.giftCardRepo.find();

    const capitalize = (str: string) => {
      if (!str) return '';
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const paymentTx = payments.map((p) => ({
      id: p.id,
      user: p.client,
      type: capitalize(p.refundType ? 'Refund' : p.fee ? 'Fee' : 'Earning'),
      amount: Number(p.amount),
      description: p.refundType
        ? `Refund to ${p.client}`
        : p.fee
        ? `Fee charged for ${p.business}`
        : `Payment from ${p.client}`,
      status: capitalize(p.status),
      balance: 0,
      date: p.createdAt.toISOString().split('T')[0],
      time: p.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    const withdrawalTx = withdrawals.map((w) => ({
      id: w.id,
      user: w.businessName,
      type: 'Withdrawal',
      amount: Number(w.amount),
      description: `Withdrawal request by ${w.businessName}`,
      status: capitalize(w.status),
      balance: Number(w.currentBalance),
      date: w.createdAt.toISOString().split('T')[0],
      time: w.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    const giftCardTx = giftCards.map((g) => ({
      id: g.id,
      user: g.purchaser.name,
      type: 'Earning',
      amount: Number(g.originalValue),
      description: `Gift card purchased for ${g.recipient.name}`,
      status: capitalize(g.status),
      balance: Number(g.currentBalance),
      date: g.createdAt.toISOString().split('T')[0],
      time: g.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));

    return [...paymentTx, ...withdrawalTx, ...giftCardTx];
  }
// 1️⃣ TOTAL WALLET BALANCE
  async getTotalWalletBalance() {
  // Get data from all sources
  const [payments, withdrawals, giftcards] = await Promise.all([
    this.paymentRepo.find(),
    this.withdrawalRepo.find(),
    this.giftCardRepo.find(),
  
  ]);

  // Sum amounts (assuming each model has an `amount` field)
  const totalPayments = payments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const totalWithdrawals = withdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);
  const totalGiftcards = giftcards.reduce((sum, g) => sum + Number(g.currentBalance|| g.originalValue || 0), 0);
 

  // Total system-wide balance
  const totalBalance = totalPayments + totalGiftcards - totalWithdrawals;

  // Daily comparison
  const startOfYesterday = moment().subtract(1, 'day').startOf('day').toDate();
  const endOfYesterday = moment().subtract(1, 'day').endOf('day').toDate();

  const [yesterdayPayments, yesterdayWithdrawals, yesterdayGiftcards] =
    await Promise.all([
      this.paymentRepo.find({ where: { createdAt: Between(startOfYesterday, endOfYesterday) } }),
      this.withdrawalRepo.find({ where: { createdAt: Between(startOfYesterday, endOfYesterday) } }),
      this.giftCardRepo.find({ where: { createdAt: Between(startOfYesterday, endOfYesterday) } }),
      
    ]);

  const yesterdayBalance =
    yesterdayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0) +
    yesterdayGiftcards.reduce((sum, g) => sum + Number(g.currentBalance || g.originalValue || 0), 0) +
    yesterdayWithdrawals.reduce((sum, w) => sum + Number(w.amount || 0), 0);

  const percentChange =
    yesterdayBalance > 0
      ? ((totalBalance - yesterdayBalance) / yesterdayBalance) * 100
      : 0;

  return {
    totalBalance,
    percentChange: percentChange.toFixed(2) + '%',
   
  };
}

  // 2️⃣ PENDING WITHDRAWALS
  async getPendingWithdrawals() {
    const pending = await this.withdrawalRepo.find({ where: { status: 'Pending' } });
    const totalPendingAmount = pending.reduce((sum, w) => sum + Number(w.amount || 0), 0);
    const totalRequests = pending.length;

    return {
      totalPendingAmount,
      totalRequests,
    };
  }

  // 3️⃣ TODAY’S EARNINGS
  async getTodaysEarnings() {
    const todayStart = moment().startOf('day').toDate();
    const todayEnd = moment().endOf('day').toDate();
    const yesterdayStart = moment().subtract(1, 'day').startOf('day').toDate();
    const yesterdayEnd = moment().subtract(1, 'day').endOf('day').toDate();

    const todayPayments = await this.paymentRepo.find({
      where: { createdAt: Between(todayStart, todayEnd) },
    });
    const yesterdayPayments = await this.paymentRepo.find({
      where: { createdAt: Between(yesterdayStart, yesterdayEnd) },
    });

    const todayTotal = todayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const yesterdayTotal = yesterdayPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);

    const percentChange =
      yesterdayTotal > 0 ? ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100 : 0;

    return {
      todayTotal,
      percentChange: percentChange.toFixed(2) + '%',
    };
  }

  // 4️⃣ PLATFORM FEES
  async getPlatformFees() {
    const paymentsWithFees = await this.paymentRepo
  .createQueryBuilder('payment')
  .where('payment.fee > 0')
  .getMany();


    const totalFeeAmount = paymentsWithFees.reduce(
      (sum, p) => sum + Number(p.amount || 0),
      0,
    );
    const avgFeeRate =
      paymentsWithFees.length > 0
        ? totalFeeAmount / paymentsWithFees.length
        : 0;

    return {
      totalFeeAmount,
      avgFeeRate: avgFeeRate.toFixed(2),
    };
  }

}
