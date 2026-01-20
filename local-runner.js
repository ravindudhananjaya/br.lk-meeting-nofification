const app = require('./api/index.js');
const port = 3001; // Use 3001 to avoid conflicts
app.listen(port, () => console.log(`Local server running on http://localhost:${port}`));
