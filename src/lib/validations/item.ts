import * as z from 'zod';

export const createItemSchema = z.object({
  name: z.string()
    .min(1, 'Item name is required')
    .max(200, 'Item name cannot exceed 200 characters'),
  description: z.string()
    .min(1, 'Description is required')
    .max(1000, 'Description cannot exceed 1000 characters'),
  quantity: z.number()
    .min(0, 'Quantity cannot be negative')
    .default(0),
  price: z.number()
    .min(0, 'Price cannot be negative'),
  costPrice: z.number()
    .min(0, 'Cost price cannot be negative')
    .default(0),
  category: z.string()
    .min(1, 'Category is required')
    .max(100, 'Category cannot exceed 100 characters'),
  sku: z.string()
    .max(50, 'SKU cannot exceed 50 characters')
    .optional(),
  barcode: z.string()
    .max(100, 'Barcode cannot exceed 100 characters')
    .optional(),
  unit: z.enum(['pieces', 'boxes', 'kg', 'liters', 'meters', 'pairs', 'sets', 'units'], {
    message: 'Unit must be one of: pieces, boxes, kg, liters, meters, pairs, sets, units'
  }),
  minQuantity: z.number()
    .min(0, 'Minimum quantity cannot be negative')
    .default(0),
  maxQuantity: z.number()
    .min(0, 'Maximum quantity cannot be negative'),
  location: z.string()
    .max(200, 'Location cannot exceed 200 characters')
    .optional(),
  supplier: z.string()
    .max(200, 'Supplier cannot exceed 200 characters')
    .optional(),
  tags: z.array(z.string().max(50, 'Tag cannot exceed 50 characters'))
    .optional(),
  imageUrl: z.string()
    .url('Image URL must be a valid URL')
    .optional()
    .or(z.literal('')),
}).refine((data) => data.maxQuantity >= data.minQuantity, {
  message: 'Maximum quantity must be greater than or equal to minimum quantity',
  path: ['maxQuantity'],
});

export const updateItemSchema = createItemSchema.partial();

export const itemQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(10),
  search: z.string().optional(),
  category: z.string().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  inStock: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  sortBy: z.enum(['name', 'price', 'quantity', 'createdAt', 'updatedAt']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const itemIdSchema = z.object({
  id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid item ID format'),
});

export const quantityUpdateSchema = z.object({
  quantity: z.number()
    .min(0, 'Quantity cannot be negative'),
  reason: z.string()
    .min(1, 'Reason is required')
    .max(200, 'Reason cannot exceed 200 characters'),
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional(),
});

export type CreateItemInput = z.infer<typeof createItemSchema>;
export type UpdateItemInput = z.infer<typeof updateItemSchema>;
export type ItemQueryInput = z.infer<typeof itemQuerySchema>;
export type ItemIdInput = z.infer<typeof itemIdSchema>;
export type QuantityUpdateInput = z.infer<typeof quantityUpdateSchema>; 