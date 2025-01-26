const ConsistentHashing = require('.');

// example implementation of a distributed cache system
class DistributedCache {
  constructor(nodes = []) {
    this.hasher = new ConsistentHashing(nodes);
    this.caches = new Map();

    // initialise cache storage for each node
    nodes.forEach((node) => this.caches.set(node, new Map()));
  }

  async set(key, value, ttl = 3600) {
    const node = this.hasher.getNode(key);
    const cache = this.caches.get(node);

    if (!cache) {
      throw new Error(`Node ${node} is not available`);
    }

    cache.set(key, {value, expires: Date.now() + ttl * 1000});

    return {node, key, value};
  }

  async get(key) {
    const node = this.hasher.getNode(key);
    const cache = this.caches.get(node);

    if (!cache) {
      throw new Error(`Node ${node} is not available`);
    }

    const data = cache.get(key);

    if (!data) {
      return null;
    }

    // check if the data has expired
    if (Date.now() > data.expires) {
      cache.delete(key);
      return null;
    }

    return data.value;
  }

  addNode(node) {
    this.hasher.addNode(node);
    this.caches.set(node, new Map());

    // in real world scenario, we would need to redistribute the cache data to the new node
    return this.hasher.getAllNodes();
  }

  removeNode(node) {
    this.hasher.removeNode(node);
    this.caches.delete(node);

    // in real world scenario, we would need to redistribute the cache data to the remaining nodes
    return this.hasher.getAllNodes();
  }

  getStats() {
    const stats = {
      nodes: {},
      totalKeys: 0,
    };

    for (const [node, cache] of this.caches) {
      stats.nodes[node] = cache.size;
      stats.totalKeys += cache.size;
    }

    return stats;
  }
}

module.exports = DistributedCache;
