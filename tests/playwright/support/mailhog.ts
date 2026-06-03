/**
 * Mailhog HTTP API helper.
 *
 * The dev compose stack ships a Mailhog container at host:port 8025 (mapped
 * from container :8025). All outgoing mail from the dev app lands in its
 * inbox and is queryable via /api/v2/messages.
 *
 * Pattern:
 *
 *   import { waitForEmailTo, extractUrl } from '../support/mailhog';
 *
 *   const message = await waitForEmailTo('alice@example.org');
 *   const resetUrl = extractUrl(message, /(https?:\/\/[^\s)"']+\/password\/reset\/[^\s)"']+)/);
 *   await page.goto(resetUrl);
 *
 * Filters by recipient. Mailhog accumulates messages across dev sessions;
 * recipient-based matching is sufficient because `setup:frontendtestuser`
 * mints faker-generated emails per call (unique across runs).
 *
 * The body decoder handles RFC 2045 quoted-printable: strips soft line
 * breaks (`=\r\n` and `=\n`) and decodes `=XX` hex escapes. Laravel's mail
 * pipeline emits multipart/alternative with a text/plain leg first; the
 * decoded body therefore contains the raw URL we want.
 *
 * Override `PW_MAILHOG_URL` to point at a non-default host (defaults to
 * http://localhost:8025).
 */
const MAILHOG_URL = process.env.PW_MAILHOG_URL ?? 'http://localhost:8025';
const DEFAULT_TIMEOUT_MS = 5000;
const POLL_INTERVAL_MS = 250;

export type MailhogAddress = {
  Mailbox: string;
  Domain: string;
};

export type MailhogMessage = {
  ID: string;
  From: MailhogAddress;
  To: MailhogAddress[];
  Content: {
    Headers: Record<string, string[]>;
    Body: string;
  };
  Created?: string;
};

type MailhogListResponse = {
  total: number;
  count: number;
  start: number;
  items: MailhogMessage[];
};

/**
 * Polls Mailhog until a message addressed to `recipient` is found. Returns
 * the most-recent match. Throws with the list of recipients seen on the last
 * poll cycle if the timeout fires — makes flake diagnosis fast.
 *
 * `since` (optional) discards any message whose Created timestamp predates
 * it; useful when a recipient email could be reused across tests.
 */
export async function waitForEmailTo(
  recipient: string,
  opts?: { timeoutMs?: number; since?: Date },
): Promise<MailhogMessage> {
  const timeoutMs = opts?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const since = opts?.since;
  const deadline = Date.now() + timeoutMs;
  const target = recipient.toLowerCase();

  let lastRecipients: string[] = [];

  while (Date.now() < deadline) {
    const response = await fetch(`${MAILHOG_URL}/api/v2/messages?limit=100`);
    if (!response.ok) {
      throw new Error(`Mailhog returned ${response.status} querying /api/v2/messages`);
    }
    const data = (await response.json()) as MailhogListResponse;
    const matches = data.items.filter((msg) => {
      if (since && msg.Created && new Date(msg.Created) < since) return false;
      return msg.To.some(
        (addr) => `${addr.Mailbox}@${addr.Domain}`.toLowerCase() === target,
      );
    });
    if (matches.length > 0) {
      return matches[0]; // /api/v2/messages returns newest-first
    }
    lastRecipients = data.items.flatMap((msg) =>
      msg.To.map((addr) => `${addr.Mailbox}@${addr.Domain}`),
    );
    await sleep(POLL_INTERVAL_MS);
  }

  throw new Error(
    `Timed out after ${timeoutMs}ms waiting for an email to ${recipient}. ` +
      `Last poll saw recipients: ${lastRecipients.slice(0, 10).join(', ') || '(inbox empty)'}` +
      (lastRecipients.length > 10 ? ` (+${lastRecipients.length - 10} more)` : ''),
  );
}

/**
 * Decodes the message body and returns the first regex match's capture
 * group. Caller-supplied pattern keeps this helper agnostic across reset /
 * verify / etc. URL shapes.
 */
export function extractUrl(message: MailhogMessage, pattern: RegExp): string {
  const decoded = decodeQuotedPrintable(message.Content.Body);
  const match = pattern.exec(decoded);
  if (!match) {
    throw new Error(
      `extractUrl: pattern ${pattern} did not match decoded body. ` +
        `Body preview: ${decoded.slice(0, 200)}`,
    );
  }
  return match[1] ?? match[0];
}

/**
 * Returns the path + query portion of an absolute URL, discarding scheme
 * and host. Use this when handing a Mailhog-extracted URL to playwright's
 * page.goto so its configured `baseURL` applies — Monica renders mail URLs
 * via Laravel's URL helper, which uses APP_URL (`http://localhost`) and
 * doesn't know about the host:port the playwright run is targeting.
 */
export function urlPathOnly(absoluteUrl: string): string {
  const parsed = new URL(absoluteUrl);
  return parsed.pathname + parsed.search;
}

function decodeQuotedPrintable(input: string): string {
  // Strip soft line breaks (RFC 2045 §6.7): `=` immediately followed by CRLF
  // (or LF) means "this line continues on the next line, ignore the break".
  const unwrapped = input.replace(/=\r?\n/g, '');
  // Decode `=XX` hex escapes → byte value.
  return unwrapped.replace(/=([0-9A-Fa-f]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16)),
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
