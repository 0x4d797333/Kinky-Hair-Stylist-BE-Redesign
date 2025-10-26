import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { SupportTicket } from './support-ticket.entity';

@Entity()
export class LiveChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // ✅ Add explicit type + include 'system' as allowed sender
  @Column({ type: 'varchar' })
  sender: 'user' | 'admin' | 'system';

  @Column({ type: 'text', nullable: true })
  text: string;

  @Column({ nullable: true })
  fileUrl?: string;

  @ManyToOne(() => SupportTicket, (ticket) => ticket.messages, {
    onDelete: 'CASCADE', // optional but good practice
  })
  ticket: SupportTicket;

  @CreateDateColumn()
  timestamp: Date;
}
