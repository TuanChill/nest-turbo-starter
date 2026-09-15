import { User } from '@app/common';
import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateUploadDto } from './dto/upload.dto';
import { UploadsService } from './uploads.service';

@ApiTags('Uploads')
@Controller('uploads')
export class UploadsController {
  constructor(private readonly uploadsService: UploadsService) {}

  @ApiOperation({ summary: 'Create a target-scoped presigned upload' })
  @Post('presign')
  createPresignedUpload(@Body() dto: CreateUploadDto, @User('id') memberId: string) {
    return this.uploadsService.createPresignedUpload(dto, memberId);
  }

  @ApiOperation({ summary: 'Verify and complete a presigned upload' })
  @Post(':id/complete')
  complete(@Param('id') id: string, @User('id') memberId: string) {
    return this.uploadsService.complete(id, memberId);
  }

  @ApiOperation({ summary: 'List target-scoped completed uploads' })
  @ApiQuery({ name: 'issueIdentifier', required: false })
  @ApiQuery({ name: 'projectId', required: false })
  @Get()
  findAll(
    @User('id') memberId: string,
    @Query('issueIdentifier') issueIdentifier?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.uploadsService.findAll(memberId, issueIdentifier, projectId);
  }
}
