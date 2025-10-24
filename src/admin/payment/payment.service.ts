import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.entity';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { RefundPaymentDto } from './dto/refund-payment.dto';
import axios from 'axios';

@Injectable()
export class PaymentService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
  ) {}

  // 🧾 Create new PayPal payment
  async createPayment(dto: CreatePaymentDto) {
    const { client, business, amount, method } = dto;

    if (!amount || amount <= 0) {
      throw new BadRequestException('Invalid amount provided');
    }

    if (method !== 'paypal') {
      throw new BadRequestException(`Unsupported payment method: ${method}`);
    }

    let paymentIntentId: string | null = null;
    let status: string = 'pending';
    let fee = amount * 0.034 + 0.3; // PayPal typical fee structure

    try {
      // 🅿️ PAYPAL PAYMENT
      const response = await axios.post(
        `${process.env.PAYPAL_SANDBOX_URL}/v1/payments/payment`,
        {
          intent: 'sale',
          payer: { payment_method: 'paypal' },
          transactions: [
            {
              amount: { total: amount.toFixed(2), currency: 'USD' },
              description: `Payment from ${client} to ${business}`,
            },
          ],
          redirect_urls: {
            return_url: 'http://localhost:3000/payment/success',
            cancel_url: 'http://localhost:3000/payment/cancel',
          },
        },
        {
          auth: {
            username: process.env.PAYPAL_CLIENT_ID!,
            password: process.env.PAYPAL_SECRET_KEY!,
          },
        },
      );

      paymentIntentId = response.data.id;
      status = 'successful';

      // 💾 Save payment in DB
      const payment = this.paymentRepo.create({
        client,
        business,
        amount,
        method,
        status,
        fee: Number(fee.toFixed(2)),
        gatewayTransactionId: paymentIntentId,
      } as Partial<Payment>);

      return await this.paymentRepo.save(payment);
    } catch (error) {
      console.error('💥 PayPal payment creation failed:', error.response?.data || error.message);
      throw new Error(`Payment failed: ${error.message}`);
    }
  }

  // 📋 Get all payment transactions
  async getAll() {
    const payments = await this.paymentRepo.find();

    return payments.map((p) => ({
      ...p,
      date: p.createdAt.toISOString().split('T')[0],
      time: p.createdAt.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      }),
    }));
  }

  // 🔍 Get one payment
  async getOne(id: string) {
    const payment = await this.paymentRepo.findOne({ where: { id } });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  // 💸 Process PayPal refund
  async refund(dto: RefundPaymentDto) {
    const { transactionId, amount, refundType, reason } = dto;

    const payment = await this.paymentRepo.findOne({ where: { id: transactionId } });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.method !== 'paypal') {
      throw new BadRequestException('Refunds are only supported for PayPal payments.');
    }

    // 🅿️ PAYPAL REFUND REQUEST
    await axios.post(
      `${process.env.PAYPAL_SANDBOX_URL}/v1/payments/sale/${payment.gatewayTransactionId}/refund`,
      { amount: { total: amount.toFixed(2), currency: 'USD' } },
      {
        auth: {
          username: process.env.PAYPAL_CLIENT_ID!,
          password: process.env.PAYPAL_SECRET_KEY!,
        },
      },
    );

    // Update refund info
    payment.status = 'refunded';
    payment.refundType = refundType;
    payment.reason = reason;
    await this.paymentRepo.save(payment);

    return { message: 'Refund successful', payment };
  }

  // ⚠️ Retrieve all disputed transactions
  async getDisputes() {
    return this.paymentRepo.find({ where: { status: 'disputed' } });
  }

  // 🗑️ Delete all payments
  async deleteAllPayments() {
    const result = await this.paymentRepo.clear();
    return { message: 'All payments deleted.', result };
  }
}
    