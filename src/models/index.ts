// Export all models for easy importing
export { default as User } from './User';
export { default as Item } from './Item';
export { default as Category } from './Category';
export { default as Order } from './Order';
export { default as Transaction } from './Transaction';

// Export interfaces and types
export type { IUser, UserRole } from './User';
export type { IItem } from './Item';
export type { ICategory } from './Category';
export type { IOrder, OrderStatus } from './Order';
export type { ITransaction } from './Transaction';

// Re-export mongoose for convenience
export { Schema, model, connect, disconnect } from 'mongoose';
