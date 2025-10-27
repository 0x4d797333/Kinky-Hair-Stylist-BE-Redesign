import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GiftCard, GiftCardStatus } from './entities/giftcard.entity';
import { CreateGiftCardDto } from './dto/create-giftcard.dto';
import { randomBytes } from 'crypto';
import { LessThan } from 'typeorm';

@Injectable()
export class GiftcardService {
  constructor(
    @InjectRepository(GiftCard)
    private readonly giftCardRepo: Repository<GiftCard>,
  ) {} 

  private async autoExpireCards() {
    const today = new Date().toISOString().split('T')[0];
    const expiredCards = await this.giftCardRepo.find({
      where: {
        expiryDate: LessThan(today),
        status: GiftCardStatus.ACTIVE,
      },
    });

    if (expiredCards.length === 0) return;
    for (const card of expiredCards) {
      card.status = GiftCardStatus.EXPIRED;
    }
    await this.giftCardRepo.save(expiredCards);
    console.log(`✅ Auto-expired ${expiredCards.length} gift card(s)`);
  }


  // Generate a human-readable, unique code
  private async generateGiftCardCode(): Promise<string> {
    let code: string;
    let exists: GiftCard | null;

    do {
      const segments = Array.from({ length: 3 }, () =>
        randomBytes(2).toString('hex').toUpperCase(),
      );
      code = `KHS-${segments.join('-')}`;
      exists = await this.giftCardRepo.findOne({ where: { code } });
    } while (exists);

    return code;
  }

  // Issue new gift card
  async issueGiftCard(dto: CreateGiftCardDto) {
    const code = await this.generateGiftCardCode();

    const giftCard = this.giftCardRepo.create({
      ...dto,
      code,
      currentBalance: dto.originalValue,
      purchaseDate: new Date().toISOString().split('T')[0],
      status: GiftCardStatus.ACTIVE,
    });

    const saved = await this.giftCardRepo.save(giftCard);

    return {
      message: '🎁 Gift card issued successfully.',
      giftCard: saved,
    };
  }

  // Get all gift cards
  async findAll() {
    const cards = await this.giftCardRepo.find();
    return {
      message: `Found ${cards.length} gift card(s).`,
      total: cards.length,
      data: cards,
    };
  }

  // Get one gift card
  async findOne(identifier: string) {
    const giftCard = await this.giftCardRepo.findOne({
      where: [{ id: identifier }, { code: identifier }],
    });

    if (!giftCard)
      throw new NotFoundException(`Gift card not found for ID/code: ${identifier}`);

    return {
      message: 'Gift card fetched successfully.',
      data: giftCard,
    };
  }

  // Deactivate a gift card
  async deactivateGiftCard(id: string) {
    const result = await this.giftCardRepo.findOne({ where: { id } });
    if (!result) throw new NotFoundException('Gift card not found.');

    if (result.status !== GiftCardStatus.ACTIVE) {
      throw new BadRequestException('Gift card is already inactive or used.');
    }

    result.status = GiftCardStatus.INACTIVE;
    result.lastUsedDate = new Date().toISOString().split('T')[0];
    await this.giftCardRepo.save(result);

    return {
      message: `Gift card (${result.code}) has been deactivated.`,
      data: result,
    };
  }

  // Refund gift card
  async refundGiftCard(id: string, amount: number) {
    const giftCard = await this.giftCardRepo.findOne({ where: { id } });
    if (!giftCard) throw new NotFoundException('Gift card not found.');

    if (giftCard.status !== GiftCardStatus.ACTIVE) {
      throw new BadRequestException('Gift card is not active. Cannot refund.');
    }

    giftCard.currentBalance += amount;
    const updated = await this.giftCardRepo.save(giftCard);

    return {
      message: `Refund of ${amount} applied successfully to card (${giftCard.code}).`,
      updatedBalance: updated.currentBalance,
      data: updated,
    };
  }

  // Get usage history
  async getUsageHistory(id: string) {
    const giftCard = await this.giftCardRepo.findOne({ where: { id } });
    if (!giftCard) throw new NotFoundException('Gift card not found.');

    return {
      message: `Usage history for gift card (${giftCard.code}) retrieved successfully.`,
      data: {
        lastUsedDate: giftCard.lastUsedDate,
        note: 'Transactions feature not yet implemented.',
      },
    };
  }

  // 🗑️ Delete all gift cards
  async deleteAllGiftCards() {
    const result = await this.giftCardRepo.clear();
    return {
      message: 'All gift cards have been permanently deleted.',
      result,
    };
  }

  async getTotalValue() {
  await this.autoExpireCards();
  const cards = await this.giftCardRepo.find();
  const totalValue = cards.reduce((sum, c) => sum + Number(c.originalValue || 0), 0);
  return { message: 'Total value of all issued gift cards retrieved successfully.', totalCards: cards.length, totalValue };
}

async getActiveCards() {
  await this.autoExpireCards();
  const activeCards = await this.giftCardRepo.find({ where: { status: GiftCardStatus.ACTIVE } });
  const totalActiveValue = activeCards.reduce((sum, c) => sum + Number(c.currentBalance || 0), 0);
  return { message: 'Active gift cards retrieved successfully.', totalActiveCards: activeCards.length, totalActiveValue, data: activeCards };
}


async getExpiredCards() {
  await this.autoExpireCards();
  const expiredCards = await this.giftCardRepo.find({ where: { status: GiftCardStatus.EXPIRED } });
  const totalExpiredValue = expiredCards.reduce((sum, c) => sum + Number(c.originalValue || 0), 0);
  return { message: 'Expired gift cards retrieved successfully.', totalExpiredCards: expiredCards.length, totalExpiredValue, data: expiredCards };
}

}
