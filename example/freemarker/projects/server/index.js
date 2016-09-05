const net = require('net');
const server = net.createServer((socket) => {
    socket.end(JSON.stringify(getData()));
}).on('error', (err) => {
    // handle errors here
    throw err;
});


function getData() {
    let itemList = [];
    for (let k = 0; k < 10; k++) {
        itemList.push({ name: 'iphone' + k, price: 20 * k });
    }
}

// grab a random port.
server.listen({
    host: 'localhost',
    port: 4000,
    exclusive: true
}, () => {
    console.log('startup server url: http://localhost:4000');
});