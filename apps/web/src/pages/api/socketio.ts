import { NextApiRequest, NextApiResponse } from 'next';
import { getSocketIO } from '@/lib/socket';

import type { Server as HTTPServer } from 'http';

export const config = {
  api: {
    bodyParser: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  // Use `res.socket.server` to attach Socket.io
  const httpServer = (res.socket as unknown as { server: HTTPServer }).server;
  
  // getSocketIO initializes the server if not already done
  getSocketIO(httpServer);

  res.end();
}
