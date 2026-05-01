const http = require('http');
try {
  http.request({ headers: { common: { 'Accept': 'json' } } });
  console.log('Success');
} catch(e) {
  console.error('Error:', e.message);
}
