export interface Parent {
  id: string;
  name: string;
  walletBalance: number;
}

export interface Student {
  id: string;
  name: string;
  allergens: string[];
  parentId: string;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  allergens: string[];
  available: boolean;
}

export interface OrderLine {
  menuItemId: string;
  quantity: number;
}

export interface Order {
  id: string;
  studentId: string;
  items: OrderLine[];
  total: number;
  createdAt: string;
}
