import { DataStore } from '../data/data.store';
import { MenuItem, Student } from '../data/types';
import { CreateOrderDto } from './orders.dto';
import {
  AllergenConflictError,
  DomainException,
  ItemUnavailableError,
} from '../common/errors';

export function requireStudent(data: DataStore, id: string) {
  const s = data.students.get(id);
  if (!s) throw new DomainException('STUDENT_NOT_FOUND', `Student ${id} not found`, 404);
  return s;
}

export function resolveLines(data: DataStore, dto: CreateOrderDto): { item: MenuItem; quantity: number }[] {
  const quantities = new Map<string, number>();
  for (const line of dto.items) {
    quantities.set(line.menuItemId, (quantities.get(line.menuItemId) ?? 0) + line.quantity);
  }
  const lines: { item: MenuItem; quantity: number }[] = [];
  const missing: string[] = [];
  for (const [id, quantity] of quantities) {
    const item = data.menuItems.get(id);
    if (!item) missing.push(id);
    else lines.push({ item, quantity });
  }
  if (missing.length) {
    throw new DomainException('MENU_ITEM_NOT_FOUND', `Menu item(s) not found: ${missing.join(', ')}`, 404);
  }
  return lines;
}

export function assertAvailable(items: MenuItem[]): void {
  const unavailable = items.filter((i) => !i.available).map((i) => i.id);
  if (unavailable.length) {
    throw new ItemUnavailableError(unavailable);
  }
}

export function assertNoAllergenConflict(student: Student, items: MenuItem[]): void {
  const studentAllergens = new Set(student.allergens.map((a) => a.toLowerCase()));
  const conflicting = new Set<string>();
  for (const item of items) {
    for (const a of item.allergens) {
      if (studentAllergens.has(a.toLowerCase())) conflicting.add(a);
    }
  }
  if (conflicting.size) {
    throw new AllergenConflictError(Array.from(conflicting));
  }
}

export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
