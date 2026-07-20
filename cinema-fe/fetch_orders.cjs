const http = require('http');

http.get('http://localhost:5000/api/Orders', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    try {
      const orders = JSON.parse(data);
      const items = orders.$values ? orders.$values.flatMap(o => o.items?.$values || o.items || []) : orders.flatMap(o => o.items?.$values || o.items || []);
      console.log(JSON.stringify(items.slice(0, 5), null, 2));
    } catch (e) {
      console.log("Parse error:", e);
    }
  });
}).on('error', (e) => {
  console.log("Error:", e);
});
