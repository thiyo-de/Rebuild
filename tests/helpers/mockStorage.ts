/**
 * In-memory Storage mock for deterministic opaque-box E2E testing.
 */
export class MockLocalStorage implements Storage {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  clear(): void {
    this.store = {};
  }

  getItem(key: string): string | null {
    return Object.prototype.hasOwnProperty.call(this.store, key) ? this.store[key] : null;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] ?? null;
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  dump(): Record<string, string> {
    return { ...this.store };
  }
}

export function setupTestEnvironment(): MockLocalStorage {
  const mockStorage = new MockLocalStorage();
  // Attach to globalThis
  (globalThis as any).localStorage = mockStorage;
  return mockStorage;
}
