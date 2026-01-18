export class ObjectPool<T> {
  private available: T[] = []
  private inUse: Set<T> = new Set()
  private factory: () => T
  private reset: (obj: T) => void
  private maxSize: number

  constructor(factory: () => T, reset: (obj: T) => void, initialSize: number = 10, maxSize: number = 100) {
    this.factory = factory
    this.reset = reset
    this.maxSize = maxSize

    for (let i = 0; i < initialSize; i++) {
      this.available.push(factory())
    }
  }

  acquire(): T {
    let obj: T

    if (this.available.length > 0) {
      obj = this.available.pop()!
    } else if (this.inUse.size < this.maxSize) {
      obj = this.factory()
    } else {
      const oldest = Array.from(this.inUse)[0]
      this.release(oldest)
      obj = this.available.pop()!
    }

    this.inUse.add(obj)
    return obj
  }

  release(obj: T): void {
    if (this.inUse.has(obj)) {
      this.inUse.delete(obj)
      this.reset(obj)
      this.available.push(obj)
    }
  }

  releaseAll(): void {
    this.inUse.forEach((obj) => {
      this.reset(obj)
      this.available.push(obj)
    })
    this.inUse.clear()
  }

  clear(): void {
    this.available = []
    this.inUse.clear()
  }

  getStats(): { available: number; inUse: number; total: number } {
    return {
      available: this.available.length,
      inUse: this.inUse.size,
      total: this.available.length + this.inUse.size
    }
  }
}

export class PoolManager {
  private pools: Map<string, ObjectPool<any>> = new Map()

  createPool<T>(
    name: string,
    factory: () => T,
    reset: (obj: T) => void,
    initialSize: number = 10,
    maxSize: number = 100
  ): ObjectPool<T> {
    const pool = new ObjectPool(factory, reset, initialSize, maxSize)
    this.pools.set(name, pool)
    return pool
  }

  getPool<T>(name: string): ObjectPool<T> | undefined {
    return this.pools.get(name)
  }

  hasPool(name: string): boolean {
    return this.pools.has(name)
  }

  releaseAll(): void {
    this.pools.forEach((pool) => pool.releaseAll())
  }

  clearAll(): void {
    this.pools.forEach((pool) => pool.clear())
    this.pools.clear()
  }

  getStats(): Record<string, { available: number; inUse: number; total: number }> {
    const stats: Record<string, { available: number; inUse: number; total: number }> = {}
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getStats()
    })
    return stats
  }
}

export const poolManager = new PoolManager()
