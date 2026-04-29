import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { DataStore } from '../data/data.store';
import { Order } from '../data/types';
import { CreateOrderDto } from './orders.dto';
import { InsufficientBalanceError, PaymentFailedError } from '../common/errors';
import {
  assertAvailable,
  assertNoAllergenConflict,
  requireStudent,
  resolveLines,
  round2,
} from './orders.helpers';

@Injectable()
export class OrdersService {
  constructor(private readonly data: DataStore) {}

  create(dto: CreateOrderDto): Order {
    const student = requireStudent(this.data, dto.studentId);
    const parent = this.data.parents.get(student.parentId)!;

    const lines = resolveLines(this.data, dto);

    assertAvailable(lines.map((l) => l.item));
    assertNoAllergenConflict(student, lines.map((l) => l.item));

    const total = round2(
      lines.reduce((acc, l) => acc + l.item.price * l.quantity, 0),
    );

    if (parent.walletBalance < total) {
      throw new InsufficientBalanceError({ balance: parent.walletBalance, required: total });
    }

    try {
      parent.walletBalance = round2(parent.walletBalance - total);

      const order: Order = {
        id: randomUUID(),
        studentId: student.id,
        items: lines.map((l) => ({ menuItemId: l.item.id, quantity: l.quantity })),
        total,
        createdAt: new Date().toISOString(),
      };
      this.data.orders.set(order.id, order);
      return order;
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'unknown';
      throw new PaymentFailedError(reason);
    }
  }
}
