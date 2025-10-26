import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { LiveChatMessage } from './live-chat-message.entity';

export type TicketStatus = 'open' | 'assigned' | 'closed';
export type ConversationCategory = 'Booking' | 'Payment' | 'Technical';

@Entity()
export class SupportTicket {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ nullable: true })
  userName: string;

 @Column({ nullable: true })
  userEmail: string;

  @Column({ nullable: false, default: 'General' })
  category?: ConversationCategory;

  @Column()
  lastMessage: string;

  @Column({ nullable: true })
  assignedTo?: string;

  @Column({ default: 'open' })
  status: TicketStatus;

  @Column({ default: 0 })
  unreadCount: number;

  @OneToMany(() => LiveChatMessage, (msg) => msg.ticket, { cascade: true })
  messages: LiveChatMessage[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
