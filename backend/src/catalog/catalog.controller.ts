import { Controller, Get, NotFoundException, Param } from '@nestjs/common';
import { DataStore } from '../data/data.store';

@Controller()
export class CatalogController {
  constructor(private readonly data: DataStore) {}

  @Get('students')
  students() {
    return Array.from(this.data.students.values());
  }

  @Get('menu-items')
  menuItems() {
    return Array.from(this.data.menuItems.values());
  }

  @Get('parents/:id')
  parent(@Param('id') id: string) {
    const parent = this.data.parents.get(id);
    if (!parent) throw new NotFoundException(`Parent ${id} not found`);
    return parent;
  }
}
