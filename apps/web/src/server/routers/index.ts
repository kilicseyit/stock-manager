import { router } from '../trpc';
import { categoryRouter } from './categories';
import { productRouter } from './products';
import { inventoryRouter } from './inventory';
import { locationRouter } from './locations';

export const appRouter = router({
  category: categoryRouter,
  product: productRouter,
  inventory: inventoryRouter,
  location: locationRouter,
});

export type AppRouter = typeof appRouter;