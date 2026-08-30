import { User } from '@app/common';
import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { DocumentsService } from './documents.service';
import {
  CreateDocumentDto,
  CreateFolderDto,
  UpdateDocumentDto,
} from './dto/document.dto';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({ summary: 'Get all document folders' })
  @ApiQuery({ name: 'teamId', required: false })
  @Get('folders')
  findAllFolders(@User('id') memberId: string, @Query('teamId') teamId?: string) {
    return this.documentsService.findAllFolders(memberId, teamId);
  }

  @ApiOperation({ summary: 'Create document folder' })
  @Post('folders')
  createFolder(@Body() dto: CreateFolderDto, @User('id') memberId: string) {
    return this.documentsService.createFolder(dto, memberId);
  }

  @ApiOperation({ summary: 'Get document by ID' })
  @Get(':id')
  findOne(@Param('id') id: string, @User('id') memberId: string) {
    return this.documentsService.findOne(id, memberId);
  }

  @ApiOperation({ summary: 'Create new document' })
  @Post()
  createDocument(@Body() dto: CreateDocumentDto, @User('id') creatorId: string) {
    return this.documentsService.createDocument(dto, creatorId);
  }

  @ApiOperation({ summary: 'Update document' })
  @Patch(':id')
  updateDocument(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentDto,
    @User('id') memberId: string,
  ) {
    return this.documentsService.updateDocument(id, dto, memberId);
  }

  @ApiOperation({ summary: 'Delete document' })
  @Delete(':id')
  deleteDocument(@Param('id') id: string, @User('id') memberId: string) {
    return this.documentsService.deleteDocument(id, memberId);
  }
}
