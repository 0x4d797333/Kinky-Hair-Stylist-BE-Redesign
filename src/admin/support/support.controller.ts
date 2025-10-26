import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Headers, 
} from '@nestjs/common';
import { SupportService } from './support.service';

@Controller('support')
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  // 1️⃣ Get all support tickets
  @Get('tickets')
  getAllTickets() {
    return this.supportService.getAllTickets();
  }

  // 2️⃣ Get single ticket details
  @Get('tickets/:id')
  getTicket(@Param('id') id: string) {
    return this.supportService.getTicketDetails(id);
  }

  // 3️⃣ Reply to a ticket
  @Post('tickets/:id/reply')
  replyToTicket(
    @Param('id') id: string,
    @Body() body: { sender: 'user' | 'admin'; text: string },
  ) {
    return this.supportService.replyToTicket(id, body);
  }

  // 4️⃣ Assign ticket to a team member
  @Patch('tickets/:id/assign')
  assignTicket(
    @Param('id') id: string,
    @Body() body: { assignedTo: string },
  ) {
    return this.supportService.assignTicket(id, body.assignedTo);
  }

  // 5️⃣ Close ticket
  @Patch('tickets/:id/close')
  closeTicket(@Param('id') id: string) {
    return this.supportService.closeTicket(id);
  }

  // 6️⃣ Get live chat sessions
  @Get('live-sessions')
  getLiveChats() {
    return this.supportService.getLiveChatSessions();
  }    

 @Post('tawk-webhook')
  async handleTawkWebhook(
    @Body() body: any,
    @Headers('x-tawk-signature') signature?: string
  ) {
    // Optional: verify webhook signature using the secret key
    // await this.supportService.verifyTawkSignature(signature, body);
console.log('Webhook received body:', JSON.stringify(body, null, 2));
  console.log('Signature:', signature);
    // Handle Tawk event
    return this.supportService.handleTawkEvent(body);
  }     

  // 7️⃣ Send live chat message
  @Post('live-sessions/:id/send')
  sendLiveChatMessage(
    @Param('id') id: string,
    @Body() body: { sender: 'user' | 'admin'; text: string },
  ) {
    return this.supportService.sendLiveChatMessage(id, body);
  }
}
