import { Injectable } from '@nestjs/common';
import { MenuItem, Order, Parent, Student } from './types';

@Injectable()
export class DataStore {
  readonly parents = new Map<string, Parent>();
  readonly students = new Map<string, Student>();
  readonly menuItems = new Map<string, MenuItem>();
  readonly orders = new Map<string, Order>();

  constructor() {
    this.seed();
  }

  private seed(): void {
    const parents: Parent[] = [
      { id: 'parent-1', name: 'Alex Parent', walletBalance: 50 },
      { id: 'parent-2', name: 'Jordan Parent', walletBalance: 5 },
    ];
    const students: Student[] = [
      { id: 'student-1', name: 'Sam Student', allergens: ['nuts'], parentId: 'parent-1' },
      { id: 'student-2', name: 'Riley Student', allergens: [], parentId: 'parent-2' },
    ];
    const menuItems: MenuItem[] = [
      { id: 'menu-1', name: 'Peanut Butter Sandwich', price: 6.5, allergens: ['nuts'], available: true },
      { id: 'menu-2', name: 'Cheese Sandwich', price: 5.0, allergens: ['dairy'], available: true },
      { id: 'menu-3', name: 'Apple Juice', price: 2.5, allergens: [], available: true },
      { id: 'menu-4', name: 'Pasta Bake (sold out)', price: 8.0, allergens: ['dairy'], available: false },
    ];

    parents.forEach((p) => this.parents.set(p.id, p));
    students.forEach((s) => this.students.set(s.id, s));
    menuItems.forEach((m) => this.menuItems.set(m.id, m));
  }
}
