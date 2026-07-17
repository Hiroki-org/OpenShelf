import { bench, describe } from 'vitest';

const searchParams = new URLSearchParams('?foo=1&bar=2&baz=3&qux=4&quux=5&corge=6&grault=7&garply=8&waldo=9&fred=10');
const changes = {
  foo: '2',
  bar: null,
  baz: '4',
  qux: null,
  quux: '6',
  newKey1: '1',
  newKey2: '2',
  newKey3: '3'
};

describe('URLSearchParams Update Benchmarks', () => {
  bench('original - Object.entries', () => {
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(changes)) {
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
  });

  bench('optimized - Object.keys with for..of', () => {
    const params = new URLSearchParams(searchParams);
    for (const key of Object.keys(changes)) {
      const value = changes[key as keyof typeof changes];
      if (!value) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
  });

  bench('optimized - for..in loop', () => {
    const params = new URLSearchParams(searchParams);
    for (const key in changes) {
      if (Object.prototype.hasOwnProperty.call(changes, key)) {
        const value = changes[key as keyof typeof changes];
        if (!value) {
          params.delete(key);
        } else {
          params.set(key, value);
        }
      }
    }
  });
});
