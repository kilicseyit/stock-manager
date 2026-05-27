import { NextResponse } from 'next/server';
import { runLowStockCheck } from '@/workers/lowStockWorker';

export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return new NextResponse('Forbidden', { status: 403 });
  }

  try {
    const notificationsCreated = await runLowStockCheck();
    return NextResponse.json({ notificationsCreated });
  } catch (error) {
    console.error('Error running manual worker trigger:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
