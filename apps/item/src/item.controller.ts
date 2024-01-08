import { Controller } from '@nestjs/common';
import { ItemService } from './item.service';
import { CreateItemDto } from '@app/dtos/itemDtos/create.item.dto';
import { MessagePattern } from '@nestjs/microservices';
import { itemMessagePatterns } from '@app/tcp/item.messages.patterns';
import { ItemDto } from '@app/dtos/itemDtos/item.dto';
import { UpdateItemDto } from '@app/dtos/itemDtos/update.item.dto';

@Controller()
export class ItemController {
  constructor(private readonly itemService: ItemService) {}

  // Create a new item using the provided DTO
  @MessagePattern(itemMessagePatterns.createItem)
  async createItem(createItemDto: CreateItemDto): Promise<ItemDto> {
    return await this.itemService.createItem(createItemDto);
  }

  // Retrieve all items
  @MessagePattern(itemMessagePatterns.getAllItems)
  async getAllItems(): Promise<ItemDto[]> {
    return await this.itemService.getAllItems();
  }

  // Retrieve items belonging to a specific user
  @MessagePattern(itemMessagePatterns.getUserItems)
  async getUserItems(user_id: number): Promise<ItemDto[]> {
    return await this.itemService.getUserItems(user_id, false);
  }

  // Retrieve forgotten items belonging to a specific user
  @MessagePattern(itemMessagePatterns.getUserForgotenItems)
  async getUserForgotenItems(user_id: number): Promise<ItemDto[]> {
    return await this.itemService.getUserItems(user_id, true);
  }

  // Delete an item based on its ID
  @MessagePattern(itemMessagePatterns.deleteItem)
  async deleteItem(item_id: number): Promise<boolean> {
    return await this.itemService.deleteItem(item_id);
  }

  // Update an existing item using the provided DTO
  @MessagePattern(itemMessagePatterns.updateItem)
  async updateItem(updateItemDto: UpdateItemDto): Promise<ItemDto> {
    return await this.itemService.udpateItem(updateItemDto);
  }

  // Retrieve an item based on its ID
  @MessagePattern(itemMessagePatterns.getItem)
  async getItem(item_id: number): Promise<ItemDto> {
    return await this.itemService.getItem(item_id);
  }
}
