import { describe, it, expect, vi } from 'vitest';
import { ref } from 'vue';
import { validationErrorsFromAxios, withFormErrors } from './errors';

describe('validationErrorsFromAxios', () => {
  describe('legacy Laravel 422 envelope { field: [msgs] }', () => {
    it('flattens a multi-field envelope to a single array of messages', () => {
      const err = {
        response: {
          data: {
            email: ['The email field is required.'],
            name: ['Too short.', 'Already taken.'],
          },
        },
      };
      expect(validationErrorsFromAxios(err, 'fallback')).toEqual([
        'The email field is required.',
        'Too short.',
        'Already taken.',
      ]);
    });

    it('preserves field iteration order', () => {
      // FormErrors.vue renders the flattened messages in this order; if it
      // ever changed, the error display would silently reorder under users.
      const err = {
        response: {
          data: {
            zeta: ['z'],
            alpha: ['a'],
            mu: ['m'],
          },
        },
      };
      expect(validationErrorsFromAxios(err, 'fb')).toEqual(['z', 'a', 'm']);
    });

    it('returns an empty array when the envelope is an empty object', () => {
      // Empty envelope ≠ no errors. FormErrors.vue treats an empty list as
      // "no banner needed" via the `errors.length > 0` v-if at the root.
      expect(validationErrorsFromAxios({ response: { data: {} } }, 'fb')).toEqual([]);
    });

    it('falls back when a nested array slips through .flat()', () => {
      // `Object.values({tags: [['a','b'],'c']}).flat()` peels one level off
      // and produces `[['a','b'], 'c']`. The leading inner array is NOT a
      // valid FormErrorList entry (must be string OR Record<string,string[]>),
      // so the per-element validator rejects the whole batch and the
      // fallback fires. Better than rendering the inner array as a
      // mystery row in FormErrors' v-for.
      const err = {
        response: {
          data: {
            tags: [['a', 'b'], 'c'],
          },
        },
      };
      expect(validationErrorsFromAxios(err, 'fb')).toEqual(['fb']);
    });
  });

  describe('modern Laravel envelope { message, errors }', () => {
    it('returns the positional tuple [banner, errorsObject] that FormErrors.vue consumes via index 1', () => {
      // FormErrors.vue:14-24 checks errors[0] for the well-known banner
      // string and renders errors[1] as a nested per-field v-for. Our
      // contract: pass Object.values through .flat() — neither value is
      // an array at the top level so neither flattens, and the tuple
      // shape is preserved.
      const err = {
        response: {
          data: {
            message: 'The given data was invalid.',
            errors: { email: ['Required.'] },
          },
        },
      };
      const out = validationErrorsFromAxios(err, 'fb');
      expect(out[0]).toBe('The given data was invalid.');
      expect(out[1]).toEqual({ email: ['Required.'] });
    });
  });

  describe('non-422 failures (network, 500, no response)', () => {
    it('falls back when the payload is a string', () => {
      expect(validationErrorsFromAxios({ response: { data: 'oops' } }, 'fb')).toEqual(['fb']);
    });

    it('falls back when the payload is null specifically', () => {
      // response.data === null can happen on 204-then-typed-as-AxiosError.
      // The `data && typeof data === "object"` guard catches it explicitly.
      expect(validationErrorsFromAxios({ response: { data: null } }, 'fb')).toEqual(['fb']);
    });

    it('falls back when the response is present but has no data', () => {
      expect(validationErrorsFromAxios({ response: {} }, 'fb')).toEqual(['fb']);
    });

    it('falls back when there is no response on the error', () => {
      expect(validationErrorsFromAxios(new Error('network'), 'fb')).toEqual(['fb']);
    });

    it('falls back for undefined errors', () => {
      expect(validationErrorsFromAxios(undefined, 'fb')).toEqual(['fb']);
    });

    it('falls back for null errors', () => {
      expect(validationErrorsFromAxios(null, 'fb')).toEqual(['fb']);
    });

    it('falls back for primitive errors', () => {
      // axios shouldn't hand us a primitive, but be defensive.
      expect(validationErrorsFromAxios('boom', 'fb')).toEqual(['fb']);
      expect(validationErrorsFromAxios(42, 'fb')).toEqual(['fb']);
    });
  });

  describe('runtime validation of FormErrorList element shapes', () => {
    it('falls back when a field value is a single string instead of an array', () => {
      // Laravel's contract is always string[] per field, but if a service
      // ever emits `{ field: "single-string" }` directly the per-element
      // validator rejects it — Object.values gives ["single-string"] which
      // .flat()s to the same, and that string passes; OK so this is fine.
      // The interesting failure is when a NESTED value isn't a string:
      const err = { response: { data: { field: [{ foo: 'bar' }] } } };
      // Object.values → [[{foo:'bar'}]]; .flat() → [{foo:'bar'}]; {foo:'bar'}
      // is a plain object whose values aren't string[] → validator rejects.
      expect(validationErrorsFromAxios(err, 'fb')).toEqual(['fb']);
    });

    it('falls back when an inner-object value is not a string array', () => {
      // Modern-envelope-ish shape with a malformed `errors` map:
      //   { message: 'X', errors: { email: 'not-an-array' } }
      // Object.values → ['X', { email: 'not-an-array' }]; flat unchanged.
      // The inner object's value is not string[], so it fails the entry
      // check and the whole batch falls back.
      const err = {
        response: {
          data: {
            message: 'Banner',
            errors: { email: 'should-have-been-array' },
          },
        },
      };
      expect(validationErrorsFromAxios(err, 'fb')).toEqual(['fb']);
    });

    it('falls back when an inner string-array contains non-strings', () => {
      const err = {
        response: {
          data: {
            message: 'Banner',
            errors: { email: ['ok', 42, 'also ok'] },
          },
        },
      };
      expect(validationErrorsFromAxios(err, 'fb')).toEqual(['fb']);
    });

    it('accepts a fully-valid modern envelope with multiple fields', () => {
      const err = {
        response: {
          data: {
            message: 'The given data was invalid.',
            errors: {
              email: ['Required.', 'Invalid format.'],
              name: ['Too short.'],
            },
          },
        },
      };
      const out = validationErrorsFromAxios(err, 'fb');
      expect(out[0]).toBe('The given data was invalid.');
      expect(out[1]).toEqual({ email: ['Required.', 'Invalid format.'], name: ['Too short.'] });
    });

    it('accepts an empty array as a valid string[] (rule-defined-but-no-msgs case)', () => {
      // Laravel can emit `{ field: [] }` when a rule fires with no message
      // (rare but valid). The empty array passes isStringArray, the whole
      // batch validates, and we return [] (FormErrors hides on .length === 0).
      const err = { response: { data: { field: [] } } };
      expect(validationErrorsFromAxios(err, 'fb')).toEqual([]);
    });

    it('falls back when one of N entries is invalid (all-or-nothing)', () => {
      // If ANY entry fails the predicate, the whole batch falls back.
      // Avoids partial rendering of a corrupted envelope.
      const err = {
        response: {
          data: {
            good_field: ['Required.'],
            bad_field: [{ nested: 'object' }],
          },
        },
      };
      expect(validationErrorsFromAxios(err, 'fb')).toEqual(['fb']);
    });
  });

  describe('multi-element fallbacks (CreateGift / CreateActivity)', () => {
    it('returns a multi-element fallback verbatim', () => {
      expect(validationErrorsFromAxios(new Error('boom'), ['fallback', 'boom'])).toEqual([
        'fallback',
        'boom',
      ]);
    });

    it('does NOT use the fallback when a valid 422 envelope is present', () => {
      // The whole point of the fallback is "we didn't get useful validation
      // errors back" — if we did, fallback is ignored entirely.
      const err = { response: { data: { name: ['Required.'] } } };
      expect(validationErrorsFromAxios(err, ['ignored1', 'ignored2'])).toEqual(['Required.']);
    });

    it('wraps a string fallback into a single-element array', () => {
      // String fallback (most common path) and array fallback are
      // interchangeable from FormErrors' perspective; both produce a
      // single visible banner.
      expect(validationErrorsFromAxios(new Error('boom'), 'just one line')).toEqual(['just one line']);
    });

    it('accepts an empty-array fallback (callers can suppress display)', () => {
      // Edge case: a caller passing [] means "render nothing if not a
      // validation error". FormErrors.vue's `errors.length > 0` v-if then
      // hides the banner entirely.
      expect(validationErrorsFromAxios(new Error('boom'), [])).toEqual([]);
    });
  });

  describe('function fallbacks (CreateGift / CreateActivity dynamic message)', () => {
    it('calls the fallback function with the original error so the caller can read error.message', () => {
      const fallback = vi.fn((e: unknown) => {
        const msg = (e as { message?: string }).message ?? '';
        return ['Please try again', msg];
      });
      const err = new Error('Network unreachable');
      const out = validationErrorsFromAxios(err, fallback);
      expect(fallback).toHaveBeenCalledTimes(1);
      expect(fallback).toHaveBeenCalledWith(err);
      expect(out).toEqual(['Please try again', 'Network unreachable']);
    });

    it('does not call the fallback function when a valid envelope is present', () => {
      // Same "fallback ignored on success" guarantee as the string/array
      // variants — extends to function fallbacks too.
      const fallback = vi.fn(() => 'should-not-fire');
      const err = { response: { data: { name: ['Required.'] } } };
      validationErrorsFromAxios(err, fallback);
      expect(fallback).not.toHaveBeenCalled();
    });

    it('wraps a function-returned string into a single-element array', () => {
      expect(validationErrorsFromAxios(new Error('x'), () => 'one liner')).toEqual(['one liner']);
    });
  });
});

describe('withFormErrors', () => {
  it('clears the target errors before running the action (form-bag target)', async () => {
    const form: { errors: Array<string | Record<string, string[]>> } = {
      errors: ['stale message from a previous submit'],
    };
    await withFormErrors(form, async () => 'success', 'fb');
    expect(form.errors).not.toContain('stale message from a previous submit');
  });

  it('returns the action result on success and leaves errors empty', async () => {
    const form = { errors: [] as Array<string | Record<string, string[]>> };
    const result = await withFormErrors(form, async () => ({ data: { id: 42 } }), 'fb');
    expect(result).toEqual({ data: { id: 42 } });
    expect(form.errors).toEqual([]);
  });

  it('returns undefined on rejection and writes the normalised errors', async () => {
    const form = { errors: [] as Array<string | Record<string, string[]>> };
    const err = { response: { data: { email: ['Required.'] } } };
    const result = await withFormErrors(form, async () => { throw err; }, 'fb');
    expect(result).toBeUndefined();
    expect(form.errors).toEqual(['Required.']);
  });

  it('applies the fallback when the rejection has no valid envelope', async () => {
    const form = { errors: [] as Array<string | Record<string, string[]>> };
    const result = await withFormErrors(form, async () => { throw new Error('boom'); }, 'general failure');
    expect(result).toBeUndefined();
    expect(form.errors).toEqual(['general failure']);
  });

  it('accepts a function fallback that sees the error', async () => {
    const form = { errors: [] as Array<string | Record<string, string[]>> };
    await withFormErrors(
      form,
      async () => { throw new Error('boom'); },
      (e) => ['general failure', (e as { message?: string }).message ?? ''],
    );
    expect(form.errors).toEqual(['general failure', 'boom']);
  });

  it('writes errors into a Ref target instead of a form-bag', async () => {
    // CreateGift / CreateActivity hold their error list in a top-level
    // ref. The helper discriminates via Vue's `isRef` so both shapes work.
    const errors = ref<Array<string | Record<string, string[]>>>([]);
    await withFormErrors(errors, async () => { throw new Error('boom'); }, 'fb');
    expect(errors.value).toEqual(['fb']);
  });

  it('clears a Ref target before running the action', async () => {
    const errors = ref<Array<string | Record<string, string[]>>>(['prior']);
    await withFormErrors(errors, async () => 'ok', 'fb');
    expect(errors.value).toEqual([]);
  });
});
