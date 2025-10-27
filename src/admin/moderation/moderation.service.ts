import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { FlaggedContent } from './entities/flagged-content.entity';
import { ModerationSettings } from './entities/moderation-settings.entity';

@Injectable()
export class ModerationService {
  constructor(
    @InjectRepository(FlaggedContent)
    private readonly flaggedRepo: Repository<FlaggedContent>,
    @InjectRepository(ModerationSettings)
    private readonly settingsRepo: Repository<ModerationSettings>,
  ) {}

  // 1️⃣ Get all flagged content
  async getFlaggedContent() {
    return this.flaggedRepo.find({ order: { createdAt: 'DESC' } });
  }

  // 2️⃣ Get all user reviews (flagged type = Review)
  async getAllUserReviews() {
    return this.flaggedRepo.find({ where: { type: 'Review' } });
  }
   // ✅ Create new reported content (review/profile/business)
async createReport(data: Partial<FlaggedContent>): Promise<FlaggedContent> {
  const report = this.flaggedRepo.create({
    ...data,
    status: 'Pending',
    createdAt: new Date(),
  });
  return this.flaggedRepo.save(report);
}


  // 3️⃣ Approve review
  async approveReview(id: string) {
    const review = await this.flaggedRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    review.status = 'Approved';
    return this.flaggedRepo.save(review);
  }

  // 4️⃣ Reject review
  async rejectReview(id: string) {
    const review = await this.flaggedRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');
    review.status = 'Rejected';
    return this.flaggedRepo.save(review);
  }

  // 5️⃣ Remove inappropriate content
  async removeInappropriateContent(id: string) {
    const content = await this.flaggedRepo.findOne({ where: { id } });
    if (!content) throw new NotFoundException('Flagged content not found');
    await this.flaggedRepo.remove(content);
    return { message: 'Inappropriate content removed successfully' };
  }

  // 6️⃣ Get moderation settings
  async getSettings() {
   let settings = await this.settingsRepo.findOne({ where: {} });

    if (!settings) {
      settings = this.settingsRepo.create({
        bannedWords: ['inappropriate', 'scam', 'fake', 'terrible'],
        Reviews:true,
        UserProfile:true,
        images: false,
      });
      await this.settingsRepo.save(settings);
    }
    return settings;
  }

  // 7️⃣ Update moderation settings
  async updateSettings(updateData: Partial<ModerationSettings>) {
    let settings = await this.settingsRepo.findOne({ where: {} });;
    if (!settings) {
      settings = this.settingsRepo.create(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    return this.settingsRepo.save(settings);
  }
}
