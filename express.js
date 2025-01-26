const DistributedCache = require('./distributedCache');
const express = require('express');
const app = express();
app.use(express.json());

// initialise distributed cache with some nodes
const cache = new DistributedCache(['node1', 'node2', 'node3']);

// routes
app.post('/cache/:key', async (req, res) => {
  try {
    const {key} = req.params;
    const {value, ttl} = req.body;
    const result = await cache.set(key, value, ttl);
    res.json(result);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.get('/cache/:key', async (req, res) => {
  try {
    const {key} = req.params;
    const result = await cache.get(key);

    if (!result) {
      return res.status(404).json({error: 'Not found'});
    } else {
      res.json({key, value: result});
    }
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.post('/nodes', async (req, res) => {
  try {
    const {node} = req.body;
    const nodes = cache.addNode(node);
    res.json({nodes});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.delete('/nodes/:node', async (req, res) => {
  try {
    const {node} = req.params;
    const nodes = cache.removeNode(node);
    res.json({nodes});
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

app.get('/stats', async (req, res) => {
  try {
    const stats = cache.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
