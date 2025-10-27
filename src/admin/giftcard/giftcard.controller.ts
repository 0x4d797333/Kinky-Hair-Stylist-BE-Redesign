import { Controller, Get, Post, Body, Param, Patch, Delete } from '@nestjs/common';
import { GiftcardService } from './giftcard.service';
import { CreateGiftCardDto } from './dto/create-giftcard.dto';

@Controller('giftcards')
export class GiftcardController {
  constructor(private readonly giftcardService: GiftcardService) {}

  @Post()
  async create(@Body() dto: CreateGiftCardDto) {
    return await this.giftcardService.issueGiftCard(dto);
  }

  @Get()
  async findAll() {
    return await this.giftcardService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.giftcardService.findOne(id);
  }

  @Patch(':id/deactivate')
  async deactivate(@Param('id') id: string) {
    return await this.giftcardService.deactivateGiftCard(id);
  }

  @Patch(':id/refund/:amount')
  async refund(@Param('id') id: string, @Param('amount') amount: string) {
    return await this.giftcardService.refundGiftCard(id, parseFloat(amount));
  }

  @Get(':id/usage')
  async getUsageHistory(@Param('id') id: string) {
    return await this.giftcardService.getUsageHistory(id);
  }

  @Delete('delete-all')
async deleteAll() {
  return this.giftcardService.deleteAllGiftCards();
}
@Get('stats/total-value')
getTotalValue() {
  return this.giftcardService.getTotalValue();
}

@Get('stats/active')
getActiveCards() {
  return this.giftcardService.getActiveCards();
}



@Get('stats/expired')
getExpiredCards() {
  return this.giftcardService.getExpiredCards();
}


}
