import { describe, it, expect } from 'vitest';
import { validationErrorsFromAxios } from './errors';

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

    it('flattens only one level of nesting (Object.values + .flat default)', () => {
      // Object.values(data) wraps the inner array as a single element;
      // .flat() peels that outer wrapper off but leaves any inner arrays
      // intact. So if Laravel ever emits an array-of-arrays for a single
      // field, the inner arrays survive — they'd render via FormErrors'
      // nested v-for, not as flat banner strings.
      const err = {
        response: {
          data: {
            tags: [['a', 'b'], 'c'],
          },
        },
      };
      expect(validationErrorsFromAxios(err, 'fb')).toEqual([['a', 'b'], 'c']);
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
});
