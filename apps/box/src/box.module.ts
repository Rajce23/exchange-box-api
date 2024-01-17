import { Module } from '@nestjs/common';
import { BoxController } from './box.controller';
import { BoxService } from './box.service';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from '@app/database';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Box } from '@app/database/entities/box.entity';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    TypeOrmModule.forFeature([Box]),
  ],
  controllers: [BoxController],
  providers: [BoxService],
})
export class BoxModule {}
