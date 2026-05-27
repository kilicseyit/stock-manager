import { router } from '../trpc';
import { categoryRouter } from './categories';
import { productRouter } from './products';
import { inventoryRouter } from './inventory';
import { locationRouter } from './locations';
import { notificationRouter } from './notifications';

export const appRouter = router({
  category: categoryRouter,
  product: productRouter,
  inventory: inventoryRouter,
  location: locationRouter,
  notification: notificationRouter,
});

export type AppRouter = typeof appRouter;