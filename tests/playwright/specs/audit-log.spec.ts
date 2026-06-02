/**
 * Audit log surfaces user actions (#731 A.3).
 *
 * Compliance feature with zero E2E coverage before this spec. Creates a
 * contact via the standard form, then asserts the audit log timeline
 * contains the corresponding "Added X as a contact." row.
 */

import { test, expect } from '../support/console-gate';
import { loginAsFreshUser } from '../support/auth';
import { createContact } from '../support/contacts';

test.describe('Monica v4 — audit log', () => {
  test('creating a contact produces a corresponding audit log entry', async ({ page, consoleGate }) => {
    await loginAsFreshUser(page);

    // Use a unique first name so the audit-log row anchor is stable
    // against any future "Added Audit Subject as a contact." entries left
    // by other test runs sharing this user (the fresh user is per-test
    // here, but the anchor is cheap insurance against future churn).
    const stamp = Date.now();
    const firstName = `Audit${stamp}`;
    await createContact(page, firstName, 'Subject', 'Woman');

    await page.goto('/settings/auditlogs');
    await expect(page.getByRole('heading', { name: 'Everything that has happened to this account' })).toBeVisible();

    // logs.php's settings_log_contact_created_with_name interpolates the
    // contact's full name into the description column.
    await expect(page.getByText(`Added ${firstName} Subject as a contact.`)).toBeVisible();

    consoleGate.assertNoUnknownErrors('/settings/auditlogs');
  });
});
