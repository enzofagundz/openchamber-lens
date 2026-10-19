import { describe, expect, test } from 'bun:test';

import { UpstreamClient } from '../src/service/upstream.ts';
import type { RawMessage } from '../src/shared/types.ts';

const assistantNew: RawMessage = {
  id: 'm_new',
  type: 'assistant',
  time: { created: 2_000 },
};

const assistantOld: RawMessage = {
  id: 'm_old_a',
  type: 'assistant',
  time: { created: 1_100 },
};

const userOld: RawMessage = {
  id: 'm_old_u',
  type: 'user',
  text: 'pedido antigo',
  time: { created: 1_000 },
};

describe('UpstreamClient.getConversation', () => {
  test('walks older pages and returns chronological messages', async () => {
    const fetchImpl = async (input: string | URL) => {
      const url = new URL(String(input));
      const older = url.searchParams.has('cursor');
      const body = older
        ? { data: [userOld, assistantOld], cursor: {} }
        : { data: [assistantNew], cursor: { next: 'older' } };
      return new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const client = new UpstreamClient('http://127.0.0.1:1', fetchImpl, () => 0);
    const messages = await client.getConversation('ses_test');

    expect(messages.map((message) => message.id)).toEqual(['m_old_u', 'm_old_a', 'm_new']);
  });

  test('stops at max pages', async () => {
    let calls = 0;
    const fetchImpl = async () => {
      calls += 1;
      return new Response(JSON.stringify({ data: [assistantNew], cursor: { next: 'more' } }), {
        status: 200,
        headers: { 'content-type': 'application/json' },
      });
    };

    const client = new UpstreamClient('http://127.0.0.1:1', fetchImpl, () => 0);
    const messages = await client.getConversation('ses_test', 3);

    expect(calls).toBe(3);
    expect(messages).toHaveLength(1);
  });
});
