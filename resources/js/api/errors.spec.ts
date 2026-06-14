import { describe, it, expect } from 'vitest';
import { validationErrorsFromAxios } from './errors';

describe('validationErrorsFromAxios', () => {
  it('flattens a Laravel 422 envelope into a single array of messages', () => {
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

  it('falls back when the payload is not an object', () => {
    expect(validationErrorsFromAxios({ response: { data: 'oops' } }, 'fb')).toEqual(['fb']);
  });

  it('accepts a multi-element fallback when callers want to surface several lines', () => {
    expect(validationErrorsFromAxios(new Error('boom'), ['fallback', 'boom'])).toEqual(['fallback', 'boom']);
  });

  it('falls back when there is no response on the error', () => {
    expect(validationErrorsFromAxios(new Error('network'), 'fb')).toEqual(['fb']);
  });

  it('falls back when the error has no shape we recognise', () => {
    expect(validationErrorsFromAxios(undefined, 'fb')).toEqual(['fb']);
    expect(validationErrorsFromAxios(null, 'fb')).toEqual(['fb']);
  });

  it('returns an empty array when the envelope is an empty object (no fallback needed)', () => {
    expect(validationErrorsFromAxios({ response: { data: {} } }, 'fb')).toEqual([]);
  });
});
