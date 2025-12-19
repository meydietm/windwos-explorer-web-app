import 'dotenv/config';

import { cors } from '@elysiajs/cors';
import { Elysia } from 'elysia';

import { folderRoutes } from './modules/folders/folders.routes';
import { searchRoutes } from './modules/search/search.routes';

const port = Number(process.env.API_PORT ?? 3001);

export const app = new Elysia()
  .use(
    cors({
      // Dev-friendly default: allow all origins.
      // If you want to lock it down later, set CORS_ORIGIN=http://localhost:5173
      origin: process.env.CORS_ORIGIN ?? true,
      credentials: true,
    }),
  )
  .onError(({ code, error, set }) => {
    set.headers['content-type'] = 'application/json; charset=utf-8';

    if (code === 'NOT_FOUND') {
      set.status = 404;
      return { error: { code: 'NOT_FOUND', message: 'Route not found' } };
    }

    if (code === 'VALIDATION') {
      set.status = 400;
      return { error: { code: 'BAD_REQUEST', message: error.message } };
    }

    set.status = set.status ?? 500;

    const message =
      error instanceof Error
        ? error.message
        : (typeof error === 'object' && error !== null && 'message' in error && typeof (error as { message: unknown }).message === 'string')
          ? (error as { message: string }).message
          : "Unexpected error";
    return {
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: message,
      },
    };
  })
  .use(folderRoutes)
  .use(searchRoutes)
  .get('/health', () => ({ ok: true }))
  .get('/api/v1/health', () => ({ ok: true }));

app.listen({ port });

console.log(`[api] listening on http://localhost:${port}`);
