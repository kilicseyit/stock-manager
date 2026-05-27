import { router } from '../trpc';
import { categoryRouter } from './categories';
import { productRouter } from './products';
import { inventoryRouter } from './inventory';
import { locationRouter } from './locations';
import { notificationRouter } from './notifications';
import { supplierRouter } from './suppliers';
import { orderRouter } from './orders';

export const appRouter = router({
  category: categoryRouter,
  product: productRouter,
  inventory: inventoryRouter,
  location: locationRouter,
  notification: notificationRouter,
  supplier: supplierRouter,
  order: orderRouter,
});

export type AppRouter = typeof appRouter;