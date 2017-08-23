const server = require("./server/server.js");
const PORT = 3000;

server().listen(PORT);
console.log(`Server listening on port ${PORT}!`);
