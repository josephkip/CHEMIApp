const axios = require('axios');
const config = { headers: new axios.AxiosHeaders({ 'Content-Type': 'application/json', common: { Authorization: 'Bearer token' } }) };
console.log(config.headers.toJSON());
