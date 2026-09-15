import { User } from '@app/common';
import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateReviewDto, UpdateReviewDto } from './dto/review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @ApiOperation({ summary: 'Get all PR reviews' })
  @ApiQuery({ name: 'status', required: false, enum: ['open', 'merged', 'closed'] })
  @Get()
  findAll(
    @Query('status') status?: 'open' | 'merged' | 'closed',
    @User('id') userId?: string,
  ) {
    return this.reviewsService.findAll(status, userId);
  }

  @ApiOperation({ summary: 'Get PR review by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') userId: string) {
    return this.reviewsService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Create PR review' })
  @Post()
  create(@Body() dto: CreateReviewDto, @User('id') authorId: string) {
    return this.reviewsService.create(dto, authorId);
  }

  @ApiOperation({ summary: 'Update PR review' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @User('id') userId: string,
  ) {
    return this.reviewsService.update(id, dto, userId);
  }
}
