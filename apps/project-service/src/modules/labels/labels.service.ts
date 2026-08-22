import { Injectable, NotFoundException } from '@nestjs/common';
import { EntityManager } from '@mikro-orm/core';
import { Label } from '../../data-access';
import { CreateLabelDto, UpdateLabelDto } from './dto/label.dto';

@Injectable()
export class LabelsService {
  constructor(private readonly em: EntityManager) {}

  async findAll() {
    return this.em.find(Label, {});
  }

  async findOne(id: string) {
    const label = await this.em.findOne(Label, { id });
    if (!label) throw new NotFoundException(`Label ${id} not found`);
    return label;
  }

  async create(dto: CreateLabelDto) {
    const label = new Label(dto);
    this.em.persist(label);
    await this.em.flush();
    return label;
  }

  async update(id: string, dto: UpdateLabelDto) {
    const label = await this.em.findOne(Label, { id });
    if (!label) throw new NotFoundException(`Label ${id} not found`);

    Object.assign(label, dto);
    await this.em.flush();
    return label;
  }

  async delete(id: string) {
    const label = await this.em.findOne(Label, { id });
    if (label) {
      this.em.remove(label);
      await this.em.flush();
    }
    return { success: true };
  }
}
