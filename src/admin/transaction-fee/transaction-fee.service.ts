import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TransactionFeeConfig } from './entities/transaction-fee.entity';
import { UpdateTransactionFeeDto } from './dto/update-transaction-fee.dto';

@Injectable()
export class TransactionFeeService {
  constructor(
    @InjectRepository(TransactionFeeConfig)
    private feeRepo: Repository<TransactionFeeConfig>,
  ) {}

  // Get the current transaction fee configuration
  async getCurrentConfig(): Promise<{ message: string; data: TransactionFeeConfig }> {
    // Try to find the most recent configuration
    let config = await this.feeRepo.findOne({
    order: { updatedAt: 'DESC' }, // Ensures we always get the latest config
    where: {},
  });

    // If no config exists yet, create a default one
    if (!config) {
      config = this.feeRepo.create();
      await this.feeRepo.save(config);
      return {
        message: 'No existing config found — default configuration created successfully.',
        data: config,
      };  
    }

    // Return existing config
    return {
      message: 'Transaction fee configuration retrieved successfully.',
      data: config,
    };
  }

  //  Update the transaction fee settings
  async updateConfig(dto: UpdateTransactionFeeDto): Promise<{ message: string; data: TransactionFeeConfig }> {
    // Retrieve the current configuration
    const { data: currentConfig } = await this.getCurrentConfig();

    // Update the configuration fields with the provided DTO values
    Object.assign(currentConfig, dto);

    // Save and return updated config
    const updated = await this.feeRepo.save(currentConfig);
    return {
      message: 'Transaction fee configuration updated successfully.',
      data: updated,
    };
  }

  // Get a list of all previous fee configurations (change history)
 async getChangeHistory(): Promise<any[]> {
  const history = await this.feeRepo.find({
    order: { createdAt: 'DESC' },
  });

  if (!history.length) {
    throw new NotFoundException('No configuration change history found.');
  }

  return [
    {
      message: 'Transaction fee configuration history retrieved successfully.',
    },
    ...history,
  ];
}
}
