import { Controller, Inject, UsePipes, ValidationPipe } from '@nestjs/common';
import { ExchangeService } from './exchange.service';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { CreateExchangeDto } from 'libs/dtos/exchangeDtos/create.exchange.dto';
import { ExchangeDto } from 'libs/dtos/exchangeDtos/exchange.dto';
import { UpdateExchangeDto } from 'libs/dtos/exchangeDtos/update.exchange.dto';
import { ExchangeWithUserDto } from 'libs/dtos/exchangeDtos/exchange.with.users.dto';
import { ChangeExchangeStatusDto } from 'libs/dtos/exchangeDtos/change.exchange.status.dto';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { exchangeManagementCommands } from '@app/tcp/exchnageMessagePatterns/exchange.management.message.patterns';
import { exchangeQueueManagementCommands } from '@app/tcp/exchnageMessagePatterns/exchnage.queue.message.patterns';
import { ExchangeUtilsService } from './exchange.utils.service';
import { ExchangeSimpleDto } from 'libs/dtos/exchangeDtos/exchange.simple.dto';
import { FullExchangeDto } from 'libs/dtos/exchangeDtos/full.exchange.dto';
import { OpenBoxDto } from 'libs/dtos/boxDtos/open.box.dto';

@Controller()
export class ExchangeController {
  constructor(
    private readonly exchangeService: ExchangeService,
    private readonly exchangeUtilsService: ExchangeUtilsService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @MessagePattern(exchangeManagementCommands.createExchange)
  async createExchange(
    createExchangeDto: CreateExchangeDto,
  ): Promise<ExchangeSimpleDto> {
    try {
      return await this.exchangeService.createExchange(createExchangeDto);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeManagementCommands.deleteExchange)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async deleteExchange({ id }: { id: number }) {
    try {
      return await this.exchangeUtilsService.deleteExchangeFromFront(id, true);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeManagementCommands.updateExchange)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async updateExchange(
    updateExchangeDto: UpdateExchangeDto,
  ): Promise<ExchangeDto> {
    try {
      return await this.exchangeService.updateExchange(updateExchangeDto);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeManagementCommands.getUserExchanges)
  async getUserExchanges({ id }: { id: number }): Promise<ExchangeSimpleDto[]> {
    try {
      const cacheKey = `userExchanges:${id}`;
      const cachedUserExchanges: ExchangeSimpleDto[] =
        await this.cacheManager.get(cacheKey);

      if (cachedUserExchanges) {
        return cachedUserExchanges;
      }

      const userExchanges =
        await this.exchangeUtilsService.getExchangesByUser(id);
      await this.cacheManager.set(cacheKey, userExchanges, 18000);

      return userExchanges;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeManagementCommands.getFullExchange)
  async getFullExchange({
    id,
    userId,
  }: {
    id: number;
    userId: number;
  }): Promise<FullExchangeDto> {
    try {
      const cacheKey = `fullExchange:${id}:${userId}`;
      const cachedFullExchange: FullExchangeDto =
        await this.cacheManager.get(cacheKey);

      if (cachedFullExchange) {
        return cachedFullExchange;
      }

      const fullExchange = await this.exchangeService.getFullExchange(
        id,
        userId,
      );

      await this.cacheManager.set(cacheKey, fullExchange, 18000);

      return fullExchange;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeManagementCommands.getAllExchanges)
  async getAllExchanges(): Promise<ExchangeWithUserDto[]> {
    try {
      const cacheKey = 'allExchanges';
      const cachedExchanges: ExchangeWithUserDto[] =
        await this.cacheManager.get(cacheKey);

      if (cachedExchanges) {
        return cachedExchanges;
      }

      const allExchanges = await this.exchangeService.getAllExchanges();
      await this.cacheManager.set(cacheKey, allExchanges, 18000);

      return allExchanges;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeQueueManagementCommands.deleteExchangeFromFront)
  async deleteExchangeFromFront({
    boxId,
    isExchange,
  }: {
    boxId: number;
    isExchange: boolean;
  }) {
    try {
      return await this.exchangeUtilsService.deleteExchangeFromFront(
        boxId,
        isExchange,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeQueueManagementCommands.changeExchangeStatus)
  async changeExchangeStatus(changeExchangeStatus: ChangeExchangeStatusDto) {
    try {
      return await this.exchangeService.changeExchangeStatus(
        changeExchangeStatus,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeQueueManagementCommands.getBoxSize)
  async getBoxSize({ id }: { id: number }): Promise<string> {
    try {
      return await this.exchangeService.getBoxSize(id);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeQueueManagementCommands.getCodeForExchnageBox)
  async getCodeForExchnageBox({ id }: { id: number }): Promise<string> {
    try {
      return await this.exchangeService.getCodeForExchnageBox(id);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(exchangeQueueManagementCommands.openBoxViaExchnageCreator)
  async openBoxViaExchnageCreator(openBoxDto: OpenBoxDto) {
    try {
      await this.exchangeService.openBoxViaExhcnage(openBoxDto, true);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(
    exchangeQueueManagementCommands.openBoxViaExchnagePickUpPerson,
  )
  async openBoxViaExchnagePickUpPerson(openBoxDto: OpenBoxDto) {
    try {
      await this.exchangeService.openBoxViaExhcnage(openBoxDto, false);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
