import { Controller, Inject, UsePipes, ValidationPipe } from '@nestjs/common';
import { UserService } from './user.service';
import { MessagePattern, RpcException } from '@nestjs/microservices';
import { CreateUserDto } from '@app/dtos/userDtos/create.user.dto';
import { UserDto } from '@app/dtos/userDtos/user.dto';
import { UpdateUserDto } from '@app/dtos/userDtos/update.user.dto';
import { ToggleFriendDto } from '@app/dtos/userDtos/toggle.friend.dto';
import { UploadUserImageDto } from '@app/dtos/userDtos/upload.user.image.dto';
import { User } from '@app/database/entities/user.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { FriendRequestDto } from '@app/dtos/userDtos/friend.request.dto';
import { UserFriendService } from './user.friend.service';
import { userManagementCommands } from '@app/tcp';
import { friendManagementCommands } from '@app/tcp/userMessagePatterns/friend.management.nessage.patterns';
import { userImageManagementCommands } from '@app/tcp/userMessagePatterns/user.image.management.message.patterns';
import { profileManagementCommands } from '@app/tcp/userMessagePatterns/user.profile.message.patterns';

@Controller()
export class UserController {
  constructor(
    private readonly userService: UserService,
    private readonly userFriendService: UserFriendService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  @MessagePattern(userManagementCommands.createUser)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async createUser(createUserDto: CreateUserDto) {
    try {
      return await this.userService.createUser(createUserDto);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userManagementCommands.getUser)
  async getUser({ id }: { id: number }): Promise<UserDto> {
    try {
      const cachedUser: UserDto = await this.cacheManager.get('getUser');
      if (cachedUser) {
        return cachedUser;
      }

      const user = await this.userService.getUser(id);
      await this.cacheManager.set('getUser', user, 18000);

      return user;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userManagementCommands.updateUser)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async updateUser(UpdateUserDto: UpdateUserDto): Promise<UserDto> {
    try {
      return await this.userService.updateUser(UpdateUserDto);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userManagementCommands.getUsers)
  async getUsers(): Promise<UserDto[]> {
    try {
      const cachedUsers: UserDto[] = await this.cacheManager.get('getUsers');

      if (cachedUsers) {
        return cachedUsers;
      }

      const users = await this.userService.getUsers();

      await this.cacheManager.set('getUsers', users, 18000);

      return users;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userManagementCommands.deleteUser)
  async deleteUser({ id }: { id: number }) {
    try {
      return await this.userService.deleteUser(id);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.removeFriend)
  async removeFriend(toggleFriendDto: ToggleFriendDto) {
    try {
      const cacheKey = `getFriends:${toggleFriendDto.userId}`;
      await this.cacheManager.del(cacheKey);
      return await this.userFriendService.removeFriend(
        toggleFriendDto.userId,
        toggleFriendDto.friendId,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.checkIfFriends)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async checkIfFriends(toggleFriendDto: ToggleFriendDto): Promise<boolean> {
    try {
      return await this.userFriendService.checkIfFriends(
        toggleFriendDto.userId,
        toggleFriendDto.friendId,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.getUserWithFriend)
  async getUserWithFriend(
    toggleFriendDto: ToggleFriendDto,
  ): Promise<{ user: User; friend: User }> {
    try {
      return await this.userFriendService.getUserWithFriend(
        toggleFriendDto.userId,
        toggleFriendDto.friendId,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userImageManagementCommands.uploadUserImage)
  async uploadUserImage(uploadUserImageDto: UploadUserImageDto) {
    try {
      return this.userService.uploadUserImage(uploadUserImageDto, false);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userImageManagementCommands.updateUserImage)
  async updateUserImage(uploadUserImageDto: UploadUserImageDto) {
    try {
      return this.userService.uploadUserImage(uploadUserImageDto, true);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userImageManagementCommands.getUserImage)
  async getUserImage({ id }: { id: number }): Promise<string> {
    try {
      const cacheKey = `userImage:${id}`;
      const cachedImage: string = await this.cacheManager.get(cacheKey);

      if (cachedImage) {
        return cachedImage;
      }

      const userImage = await this.userService.getUserImage(id);
      await this.cacheManager.set(cacheKey, userImage, 18000);

      return userImage;
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userImageManagementCommands.deleteUserImage)
  async deleteUserImage({ id }: { id: number }) {
    try {
      return this.userService.deleteUserImage(id);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(profileManagementCommands.getUserForItemUpdate)
  async getUserForItemUpdate({ friendId }: { friendId: number }) {
    try {
      return this.userService.getUserForItemUpdate(friendId);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(userManagementCommands.getUserByEmail)
  async getUserByEmail({ userEmail }: { userEmail: string }): Promise<User> {
    try {
      return this.userService.getUserByEmail(userEmail);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.getFriends)
  async getFriends({ id, query }: { id: number; query }): Promise<UserDto[]> {
    const cacheKey = `getFriends:${id}`;
    const cachedFriends: UserDto[] = await this.cacheManager.get(cacheKey);

    if (cachedFriends) {
      return cachedFriends;
    }

    const userFriends = await this.userFriendService.getFriendsOrNonFriends(
      id,
      true,
      query,
    );
    await this.cacheManager.set(cacheKey, userFriends, 18000);
    try {
      return this.userFriendService.getFriendsOrNonFriends(id, true, query);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.getNewFriends)
  async getNewFriends({
    id,
    query,
  }: {
    id: number;
    query;
  }): Promise<UserDto[]> {
    const cacheKey = `getNewFriends:${id}`;
    const cachedFriends: UserDto[] = await this.cacheManager.get(cacheKey);

    if (cachedFriends) {
      return cachedFriends;
    }

    const userFriends = await this.userFriendService.getFriendsOrNonFriends(
      id,
      false,
      query,
    );
    await this.cacheManager.set(cacheKey, userFriends, 18000);
    try {
      return this.userFriendService.getFriendsOrNonFriends(id, false, query);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.getFriendRequests)
  async getFriendRequests({
    id,
    query,
  }: {
    id: number;
    query;
  }): Promise<FriendRequestDto[]> {
    const cacheKey = `getFriendRequests:${id}`;
    const cachedFriendRequests: FriendRequestDto[] =
      await this.cacheManager.get(cacheKey);

    if (cachedFriendRequests) {
      return cachedFriendRequests;
    }

    const getFriendRequests = await this.userFriendService.getFriendRequests(
      id,
      query,
    );
    await this.cacheManager.set(cacheKey, getFriendRequests, 18000);

    try {
      return this.userFriendService.getFriendRequests(id, query);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.createFriendRequest)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async createFriendRequest(toggleFriendDto: ToggleFriendDto) {
    try {
      const cacheKey = `getNewFriends:${toggleFriendDto.friendId}`;
      await this.cacheManager.del(cacheKey);
      return this.userFriendService.createFriendRequest(toggleFriendDto);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.acceptFriendRequest)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async acceptFriendRequest(toggleFriendDto: ToggleFriendDto) {
    try {
      return this.userFriendService.accepOrDenytFriendRequest(
        toggleFriendDto,
        true,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(friendManagementCommands.denyFriendRequest)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async denyFriendRequest(toggleFriendDto: ToggleFriendDto) {
    try {
      return this.userFriendService.accepOrDenytFriendRequest(
        toggleFriendDto,
        false,
      );
    } catch (error) {
      throw new RpcException(error.message);
    }
  }

  @MessagePattern(profileManagementCommands.getUserForProfile)
  @UsePipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
    }),
  )
  async getUserForProfile(toggleFriendDto: ToggleFriendDto) {
    try {
      return this.userService.getUserForProfile(toggleFriendDto);
    } catch (error) {
      throw new RpcException(error.message);
    }
  }
}
