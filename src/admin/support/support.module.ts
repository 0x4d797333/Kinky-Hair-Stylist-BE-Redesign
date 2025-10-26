import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { LiveChatMessage } from './entities/live-chat-message.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';

@Module({
  imports: [TypeOrmModule.forFeature([SupportTicket, LiveChatMessage])],
  providers: [SupportService],
  controllers: [SupportController],
})
export class SupportModule {}
