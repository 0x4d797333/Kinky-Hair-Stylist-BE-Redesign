import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class ModerationSettings {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('simple-array')
  bannedWords: string[];

  @Column({ default: false })
  autoFlagReviews: boolean;

  @Column({ default: true })
  notifyAdmin: boolean;

  @Column({ nullable: true })
  reviewFlagThreshold: number;
}
