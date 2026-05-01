const axios = require('axios');
const api = axios.create({ baseURL: '/api' });
const config = { method: 'post', url: '/auth/login', baseURL: '/api', data: { username: 'admin' } };
try {
  console.log('Uri:', api.getUri(config));
} catch(e) {
  console.error('Error:', e.message);
}
