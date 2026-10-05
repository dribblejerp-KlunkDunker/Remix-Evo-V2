/**
 * Perseus variant of the agent client.
 *
 * This was a verbatim 360-line copy of agentClient.ts differing on a single
 * line — the model string — which meant every fix had to be made twice and one
 * of them was always going to be missed. It is now a thin binding over the
 * shared client with the model pinned.
 */

import {
  createInteraction as createInteractionBase,
  streamInteraction as streamInteractionBase,
  type InteractionOptions,
} from './agentClient.ts';

export const PERSEUS_MODEL = 'gemini-3.6-flash';

export function createInteraction(opts: InteractionOptions) {
  // Spread first: `{ model: X, ...opts }` would let an explicit `model: undefined`
  // on opts clobber the pin back to the base default.
  return createInteractionBase({ ...opts, model: opts.model ?? PERSEUS_MODEL });
}

export const streamInteraction = streamInteractionBase;

export type { InteractionOptions };
