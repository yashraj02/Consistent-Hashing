const crypto = require('crypto');

class ConsistentHashing {
  constructor(nodes = [], options = {}) {
    this.replicas = options.replicas || 3;
    this.algorithm = options.algorithm || 'md5';
    this.ring = new Map();
    this.sortedKeys = [];

    // add nodes to the ring
    nodes.forEach((node) => this.addNode(node));
  }

  hash(key) {
    return crypto.createHash(this.algorithm).update(key).digest('hex');
  }

  hashToLong(hash) {
    // use first 32 bits of the md5 hash
    return parseInt(hash.substring(0, 8), 16);
  }

  addNode(node) {
    // add virtual nodes to the ring
    for (let i = 0; i < this.replicas; i++) {
      const virtualNode = `${node}:${i}`;
      const hash = this.hash(virtualNode);
      const hashKey = this.hashToLong(hash);
      this.ring.set(hashKey, node);
    }

    // update the sorted keys
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  removeNode(node) {
    // remove virtual nodes from the ring
    for (let i = 0; i < this.replicas; i++) {
      const virtualNode = `${node}:${i}`;
      const hash = this.hash(virtualNode);
      const hashKey = this.hashToLong(hash);
      this.ring.delete(hashKey);
    }

    // update the sorted keys
    this.sortedKeys = Array.from(this.ring.keys()).sort((a, b) => a - b);
  }

  getNode(key) {
    if (this.ring.size === 0) {
      throw new Error('Ring is empty');
    }

    const hash = this.hash(key);
    const hashKey = this.hashToLong(hash);

    // find the first node in the ring that comes after the hash key
    const nodeKeys = this.sortedKeys;
    for (let i = 0; i < nodeKeys.length; i++) {
      if (hashKey <= nodeKeys[i]) {
        return this.ring.get(nodeKeys[i]);
      }
    }

    // if we reached here then the key is greater than all nodes in the ring, so return the first node
    return this.ring.get(nodeKeys[0]);
  }

  getAllNodes() {
    return [...new Set(this.ring.values())];
  }
}

module.exports = ConsistentHashing;
