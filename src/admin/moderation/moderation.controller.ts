import { Controller, Get, Param, Patch, Delete, Body, Post } from '@nestjs/common';
import { ModerationService } from './moderation.service';
import { ModerationSettings } from './entities/moderation-settings.entity';

@Controller('moderation')
export class ModerationController {
  constructor(private readonly moderationService: ModerationService) {}

  // 1️⃣ Get all flagged content
  @Get('flagged')
  getFlaggedContent() {
    return this.moderationService.getFlaggedContent();
  }

  @Post('report')
async createReport(@Body() body: any) {
  return this.moderationService.createReport(body);
}


  // 2️⃣ Get all user reviews
  @Get('reviews')
  getAllUserReviews() {
    return this.moderationService.getAllUserReviews();
  }

  // 3️⃣ Approve review
  @Patch('reviews/:id/approve')
  approveReview(@Param('id') id: string) {
    return this.moderationService.approveReview(id);
  }




  // 4️⃣ Reject review
  @Patch('reviews/:id/reject')
  rejectReview(@Param('id') id: string) {
    return this.moderationService.rejectReview(id);
  }

  // 5️⃣ Remove inappropriate content
  @Delete('flagged/:id')
  removeInappropriateContent(@Param('id') id: string) {
    return this.moderationService.removeInappropriateContent(id);
  }

  // 6️⃣ Get moderation settings
  @Get('settings')
  getSettings() {
    return this.moderationService.getSettings();
  }

  // 7️⃣ Update moderation settings
  @Patch('settings')
  updateSettings(@Body() body: Partial<ModerationSettings>) {
    return this.moderationService.updateSettings(body);
  }
}
