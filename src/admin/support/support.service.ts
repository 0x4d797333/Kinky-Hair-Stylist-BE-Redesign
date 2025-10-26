import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SupportTicket } from './entities/support-ticket.entity';
import { LiveChatMessage } from './entities/live-chat-message.entity';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepo: Repository<SupportTicket>,

    @InjectRepository(LiveChatMessage)
    private msgRepo: Repository<LiveChatMessage>,
  ) {}

  /** ---------------- 🎟️ SUPPORT TICKETS ---------------- */
  async getAllTickets() {
    return this.ticketRepo.find({ relations: ['messages'] });
  }

  async getTicketDetails(id: string) {
    const ticket = await this.ticketRepo.findOne({
      where: { id },
      relations: ['messages'],
    });
    if (!ticket) throw new NotFoundException('Ticket not found');
    return ticket;
  }

  async replyToTicket(id: string, body: { sender: 'user' | 'admin'; text: string }) {
    const ticket = await this.getTicketDetails(id);
    const message = this.msgRepo.create({
      sender: body.sender,
      text: body.text,
      ticket,
    });
    await this.msgRepo.save(message);
    ticket.lastMessage = body.text;
    ticket.unreadCount++;
    return this.ticketRepo.save(ticket);
  }

  async assignTicket(id: string, assignedTo: string) {
    const ticket = await this.getTicketDetails(id);
    ticket.assignedTo = assignedTo;
    ticket.status = 'assigned';
    return this.ticketRepo.save(ticket);
  }

  async closeTicket(id: string) {
    const ticket = await this.getTicketDetails(id);
    ticket.status = 'closed';
    return this.ticketRepo.save(ticket);
  }

  /** ---------------- 💬 TAWK WEBHOOK HANDLER ---------------- */
  async handleTawkEvent(payload: any) {
    console.log('🔥 Tawk Event Payload:', JSON.stringify(payload, null, 2));

    const event = payload.event || payload.type || payload.action;
    console.log('Detected Event:', event);

    /** ---------------- 🟢 CHAT START ---------------- */
    if (event === 'chat:start' || event === 'chatStart') {
      const ticket = this.ticketRepo.create({
        id: payload.chatId || payload.conversationId,
        status: 'open',
        assignedTo: payload.agent?.name || null,
        userName: payload.visitor?.name || 'Anonymous User',
        userEmail: payload.visitor?.email || null,
        lastMessage: 'New chat started',
      });

      await this.ticketRepo.save(ticket);

      // 💬 Create initial system message
      const introMsg = this.msgRepo.create({
        text: 'New chat started',
        sender: 'system',
        ticket,
      });
      await this.msgRepo.save(introMsg);

      return { received: true };
    }

    /** ---------------- 💬 CHAT MESSAGE ---------------- */
    if (
      event === 'message:send' ||
      event === 'chatMessage' ||
      event === 'chat.message' ||
      event === 'message.sent'
    ) {
      const chatId = payload.chatId || payload.conversationId;
      const ticket = await this.ticketRepo.findOne({ where: { id: chatId } });

      if (ticket) {
        const messageText =
          payload.message?.text ||
          payload.message?.content ||
          payload.text ||
          payload.body ||
          payload.message ||
          '';

        const sender =
          payload.message?.sender ||
          payload.sender ||
          payload.from ||
          'user';

        // Save message
        const msg = this.msgRepo.create({
          text: messageText,
          sender,
          ticket,
        });
        await this.msgRepo.save(msg);

        // Update ticket with last message
        ticket.lastMessage = messageText;
        await this.ticketRepo.save(ticket);
      }

      return { received: true };
    }

    /** ---------------- 🔴 CHAT END ---------------- */
    if (event === 'chat:end' || event === 'chatEnd' || event === 'chat.ended') {
      const chatId = payload.chatId || payload.conversationId;
      const ticket = await this.ticketRepo.findOne({ where: { id: chatId } });
      if (ticket) {
        ticket.status = 'closed';
        await this.ticketRepo.save(ticket);
      }
      return { received: true };
    }

    console.log('⚠️ Unhandled event type:', event);
    return { ignored: true };
  }

  /** ---------------- 💻 LIVE CHAT ---------------- */
  async getLiveChatSessions() {
    return this.ticketRepo.find({
      where: { status: 'open' },
      relations: ['messages'],
    });
  }

  async sendLiveChatMessage(
    id: string,
    body: { sender: 'user' | 'admin'; text: string },
  ) {
    const ticket = await this.getTicketDetails(id);
    const message = this.msgRepo.create({
      sender: body.sender,
      text: body.text,
      ticket,
    });
    await this.msgRepo.save(message);
    ticket.lastMessage = body.text;
    return this.ticketRepo.save(ticket);
  }
}
