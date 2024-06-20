/**
 * Copyright (C) 2022-2024 Permanent Data Solutions, Inc. All Rights Reserved.
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */
import { CacheParams, PromiseCache } from './promiseCache';

interface ReadThroughPromiseCacheParams<K, V, D = void> {
  readThroughFunction: (key: K, readThroughData?: D) => Promise<V>;
  cacheParams: CacheParams;
}

export class ReadThroughPromiseCache<K, V, D = void> {
  private readonly cache: PromiseCache<K, V>;
  private readonly readThroughFunction: (
    key: K,
    readThroughData?: D,
  ) => Promise<V>;
  constructor({
    cacheParams,
    readThroughFunction,
  }: ReadThroughPromiseCacheParams<K, V, D>) {
    this.cache = new PromiseCache(cacheParams);
    this.readThroughFunction = readThroughFunction;
  }

  async get(key: K, readThroughData?: D): Promise<V> {
    const cachedValue = this.cache.get(key);
    if (cachedValue) {
      return cachedValue;
    }

    const valuePromise = this.readThroughFunction(key, readThroughData);

    valuePromise.catch(() => {
      this.cache.remove(key);
    });

    this.cache.put(key, valuePromise);

    return valuePromise;
  }

  put(key: K, value: Promise<V>): Promise<V> {
    this.cache.put(key, value);
    return value;
  }

  remove(key: K): void {
    this.cache.remove(key);
  }

  clear(): void {
    this.cache.clear();
  }

  size(): number {
    return this.cache.size();
  }
}
