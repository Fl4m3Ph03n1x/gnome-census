const server = require("./server/server.js");
const PORT = process.env.PORT;

server().listen(PORT);
console.log(`Server listening on port ${PORT}!`);
