import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PlatformSettingsEntity } from './entities/platform-settings.entity';
import {
  UpdateGeneralSettingsDto,
  UpdateNotificationSettingsDto,
  UpdatePaymentSettingsDto,
  UpdateFeaturesSettingsDto,
  UpdateIntegrationsSettingsDto,
} from './DTOs/platform-settings.dto';

@Injectable()
export class PlatformSettingsService {
  constructor(
    @InjectRepository(PlatformSettingsEntity)
    private readonly repo: Repository<PlatformSettingsEntity>,
  ) {}

  /** Fetch settings or throw if none found */
  private async getSettings() {
    const settings = await this.repo.findOne({ where: {} }); // ✅ correct for TypeORM 0.3+
    if (!settings) throw new NotFoundException('Platform settings not found');
    return settings;
  }

  /** ---------------- GENERAL ---------------- */
  async getGeneral() {
    const s = await this.getSettings();
    return s.general;
  }

  async updateGeneral(dto: UpdateGeneralSettingsDto) {
    const s = await this.getSettings();
    s.general = { ...s.general, ...dto };
    return this.repo.save(s);
  }

  /** ---------------- NOTIFICATIONS ---------------- */
  async getNotifications() {
    const s = await this.getSettings();
    return s.notifications;
  }

  async updateNotifications(dto: UpdateNotificationSettingsDto) {
    const s = await this.getSettings();
    s.notifications = {
      email: { ...s.notifications.email, ...(dto.email || {}) },
      push: { ...s.notifications.push, ...(dto.push || {}) },
    };
    return this.repo.save(s);
  }

  /** ---------------- PAYMENTS ---------------- */
  async getPayments() {
    const s = await this.getSettings();
    return s.payments;
  }

  async updatePayments(dto: UpdatePaymentSettingsDto) {
    const s = await this.getSettings();
    s.payments = {
      ...s.payments,
      ...dto,
      methods: { ...s.payments.methods, ...(dto.methods || {}) },
    };
    return this.repo.save(s);
  }

  /** ---------------- FEATURES ---------------- */
  async getFeatures() {
    const s = await this.getSettings();
    return s.features;
  }

  async updateFeatures(dto: UpdateFeaturesSettingsDto) {
    const s = await this.getSettings();
    s.features = {
      user: { ...s.features.user, ...(dto.user || {}) },
      business: { ...s.features.business, ...(dto.business || {}) },
    };
    return this.repo.save(s);
  }

  /** ---------------- INTEGRATIONS ---------------- */
  async getIntegrations() {
    const s = await this.getSettings();
    return s.integrations;
  }

  async updateIntegrations(dto: UpdateIntegrationsSettingsDto) {
  const s = await this.getSettings();

  s.integrations = {
    paymentGateways: {
      stripe: {
        enabled: dto.paymentGateways?.stripe?.enabled ?? s.integrations.paymentGateways.stripe.enabled,
        key: dto.paymentGateways?.stripe?.key ?? s.integrations.paymentGateways.stripe.key,
        description: dto.paymentGateways?.stripe?.description ?? s.integrations.paymentGateways.stripe.description,
      },
      paypal: {
        enabled: dto.paymentGateways?.paypal?.enabled ?? s.integrations.paymentGateways.paypal.enabled,
        key: dto.paymentGateways?.paypal?.key ?? s.integrations.paymentGateways.paypal.key,
        description: dto.paymentGateways?.paypal?.description ?? s.integrations.paymentGateways.paypal.description,
      },
    },
    communication: {
      twilio: {
        enabled: dto.communication?.twilio?.enabled ?? s.integrations.communication.twilio.enabled,
        key: dto.communication?.twilio?.key ?? s.integrations.communication.twilio.key,
        description: dto.communication?.twilio?.description ?? s.integrations.communication.twilio.description,
      },
      sendgrid: {
        enabled: dto.communication?.sendgrid?.enabled ?? s.integrations.communication.sendgrid.enabled,
        key: dto.communication?.sendgrid?.key ?? s.integrations.communication.sendgrid.key,
        description: dto.communication?.sendgrid?.description ?? s.integrations.communication.sendgrid.description,
      },
    },
  };

  return this.repo.save(s);
}

}
