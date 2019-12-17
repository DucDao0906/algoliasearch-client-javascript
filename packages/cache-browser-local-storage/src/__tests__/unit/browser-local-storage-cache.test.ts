import { version } from '@algolia/client-common';

import { createBrowserLocalStorageCache } from '../..';

const notAvailableStorage: Storage = new Proxy(window.localStorage || {}, {
  get() {
    return () => {
      throw new Error('Component is not available');
    };
  },
});

describe('browser local storage cache', () => {
  beforeEach(() => window.localStorage.clear());

  it('sets/gets values', async () => {
    const cache = createBrowserLocalStorageCache({ key: version });

    const defaultValue = () => Promise.resolve({ bar: 1 });

    const missMock = jest.fn();

    expect(
      await cache.get({ key: 'foo' }, defaultValue, {
        miss: () => Promise.resolve(missMock()),
      })
    ).toMatchSnapshot({ bar: 1 });

    expect(missMock.mock.calls.length).toBe(1);

    await cache.set({ key: 'foo' }, { foo: 2 });

    expect(
      await cache.get({ key: 'foo' }, defaultValue, {
        miss: () => Promise.resolve(missMock()),
      })
    ).toMatchObject({ foo: 2 });

    expect(missMock.mock.calls.length).toBe(1);
  });

  it('deletes keys', async () => {
    const cache = createBrowserLocalStorageCache({ key: version });
    await cache.set({ key: 'foo' }, { bar: 1 });

    await cache.delete({ key: 'foo' });

    const defaultValue = () => Promise.resolve({ bar: 2 });

    const missMock = jest.fn();

    expect(
      await cache.get({ key: 'foo' }, defaultValue, {
        miss: () => Promise.resolve(missMock()),
      })
    ).toMatchObject({ bar: 2 });

    expect(missMock.mock.calls.length).toBe(1);
  });

  it('do throws localstorage related exceptions', async () => {
    const cache = createBrowserLocalStorageCache({
      key: version,
      localStorage: notAvailableStorage,
    });
    const key = { foo: 'bar' };
    const value = 'foo';
    const fallback = 'bar';

    const message = 'Component is not available';
    await expect(cache.delete(key)).rejects.toEqual(new Error(message));
    await expect(cache.set(key, value)).rejects.toEqual(new Error(message));
    await expect(cache.get(key, () => Promise.resolve(fallback))).rejects.toEqual(
      new Error(message)
    );
  });
  it('creates a namespace within local storage', async () => {
    const cache = createBrowserLocalStorageCache({
      key: version,
    });
    const key = { foo: 'bar' };
    const value = 'foo';
    expect(localStorage.getItem(`algoliasearch-client-js-${version}`)).toBeNull();

    await cache.set(key, value);

    expect(localStorage.getItem(`algoliasearch-client-js-${version}`)).toBe(
      '{"{\\"foo\\":\\"bar\\"}":"foo"}'
    );
  });
});
