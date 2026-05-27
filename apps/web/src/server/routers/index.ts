import { router } from '../trpc';
import { categoryRouter } from './categories';
import { productRouter } from './products';

export const appRouter = router({
  category: categoryRouter,
  product: productRouter,
});

export type AppRouter = typeof appRouter;