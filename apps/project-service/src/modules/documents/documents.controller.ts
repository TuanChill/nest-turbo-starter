import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { CreateDocumentDto, CreateFolderDto, UpdateDocumentDto } from './dto/document.dto';
import { DocumentsService } from './documents.service';

@ApiTags('Documents')
@Controller('documents')
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) {}

  @ApiOperation({ summary: 'Get all document folders' })
  @ApiQuery({ name: 'teamId', required: false })
  @Get('folders')
  findAllFolders(@Query('teamId') teamId?: string) {
    return this.documentsService.findAllFolders(teamId);
  }

  @ApiOperation({ summary: 'Create document folder' })
  @Post('folders')
  createFolder(@Body() dto: CreateFolderDto) {
    return this.documentsService.createFolder(dto);
  }

  @ApiOperation({ summary: 'Get document by ID' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create new document' })
  @Post()
  createDocument(@Body() dto: CreateDocumentDto) {
    return this.documentsService.createDocument(dto);
  }

  @ApiOperation({ summary: 'Update document' })
  @Patch(':id')
  updateDocument(@Param('id') id: string, @Body() dto: UpdateDocumentDto) {
    return this.documentsService.updateDocument(id, dto);
  }

  @ApiOperation({ summary: 'Delete document' })
  @Delete(':id')
  deleteDocument(@Param('id') id: string) {
    return this.documentsService.deleteDocument(id);
  }
}
