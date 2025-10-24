
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';
import { BookingPolicies } from './booking-policies.entity';
import { BookingDay } from './booking-day.entity';
import { CompanySize } from '../types/constants';
import {Appointment} from "./appointment.entity";

export enum BusinessStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
  UNDER_REVIEW = 'under_review',
  SUSPENDED = 'suspended',
}

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  businessName: string;

  @Column()
  description: string;

  @ManyToOne(() => User, (user) => user.businesses, { onDelete: 'CASCADE', eager: true })
  @JoinColumn({ name: 'owner_id' })
  owner: User;

  @Column({ nullable: true })
  ownerName: string;

  @Column({ nullable: true })
  ownerEmail: string;

  @Column({ nullable: true })
  ownerPhone: string;

  @Column()
  primaryAudience: string;

  @OneToMany(() => Appointment, (appointment) => appointment.business, {
    cascade: true, nullable: true,
  })
  appointments: Appointment[];

  @Column('text', { array: true, default: [] })
  services: string[];

  @Column({ nullable: true })
  category: string;

 @Column({ nullable: true })
  location: string;

  @OneToOne(() => BookingPolicies, (policies) => policies.business, {
    cascade: true,
    eager: true,
  })
  bookingPolicies: BookingPolicies;

  @Column({ type: 'enum', enum: CompanySize })
  companySize: CompanySize;

  @OneToMany(() => BookingDay, (day) => day.business, {
    cascade: true,
    eager: true,
  })
  bookingHours: BookingDay[];

  @Column()
  howDidYouHear: string;

  @Column({
    type: 'enum',
    enum: BusinessStatus,
    default: BusinessStatus.PENDING,
  })   
  status: BusinessStatus;

  // 🧩 New fields for frontend dashboard
  @Column({ type: 'float', default: 0 })
  revenue: number;

  @Column({ type: 'int', default: 0 })
  bookings: number;

  @Column({ type: 'int', default: 0 })
  staff: number;

  @Column({ type: 'varchar', default: 'Free' })
  plan: string;

  @Column({
    type: 'jsonb',
    nullable: true,
    default: () =>
        `'{"rating":0,"reviews":0,"completionRate":0,"avgResponseMins":0}'`,
  })
  performance: {
    rating: number;
    reviews: number;
    completionRate: number;
    avgResponseMins: number;
  };

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
