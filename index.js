// TODO - remove/fix ES6 function calls
// TODO - integrate

var bitcore = require('bitcore-lib-dash');
var p2p = require('bitcore-p2p-dash');
// var MerkleTree = require('webcoin/lib/merkleTree') // 1.0.2
var BufferUtil = bitcore.util.buffer;

var address = 'XeLeGpVwjedxUE4A5ynag4WxowA4nobUuZ'
var blockHash = '0000000000154ef1f88653a6757f1182680a4d5831d815010d5fa646ae79ce35' // 100014
// expect:
// tx: 0f15750e8a662ff7d02123677461477eb3b3222d6ca785b98f64c17d7d458699
//   in block: 397697:0000000000000000021b3bd248ee38a47e0a9904d6a4bfbd7fcfe200bb533e97
// tx: ffe2822fd404e829ef4758617b01d2c4b9b26ab9a1a146e23be468aa0d881fa5
//   in block: 397706:0000000000000000040e04147d502a27736d404a7a1dcddda8e490006be28157

var pool = new p2p.Pool({ relay: false, maxSize: 1 });
var messages = new p2p.Messages();

var _emit = pool.emit;
pool.emit = function (type) {
    console.log(`New event: ${type}`);
    return _emit.apply(this, arguments);
};

var _sendMessage = pool.sendMessage;
pool.sendMessage = function (message) {
    console.log('Send message:', message.command);
    return _sendMessage.apply(this, arguments);
}

pool.on('peerinv', (peer, msg) => {
    console.log('peerinv:')
msg.inventory.forEach((item) => console.log(`${item.type} ${item.hash.reverse().toString('hex')}`))
})

pool.on('peerready', () => {
    setTimeout(() => {
    var filter = p2p.BloomFilter.create(100, 0.0001, 0, p2p.BloomFilter.BLOOM_UPDATE_ALL)
    filter.insert(new Buffer(bitcore.Address(address).toObject().hash, 'hex'))
    var message = messages.FilterLoad(filter)
    pool.sendMessage(message)
}, 1000)
setTimeout(() => {
    var message = messages.GetHeaders({
        starts: [ new Buffer(blockHash, 'hex').reverse() ]
    })
    pool.sendMessage(message)
}, 2000)
})

pool.on('peerheaders', (peer, msg) => {
    var items = msg.headers.slice(0, 20).map((item) => ({
            type: 3,
            hash: new Buffer(item.hash, 'hex').reverse()
        }))
var message = messages.GetData(items)
pool.sendMessage(message)
})

pool.on('peermerkleblock', (peer, msg) => {
    // var tree = MerkleTree.fromMerkleBlock(msg.merkleBlock)
    // if (tree.txids.length === 0) return
//console.log(`Block: ${msg.merkleBlock.header.hash}, txids: ${tree.txids.map(x => x.reverse().toString('hex')).join(' ,')}`)
    console.log('merkleblock:', msg.merkleBlock)

    var merkleblock = new bitcore.MerkleBlock(msg.merkleBlock);

    var blockHeader = new bitcore.BlockHeader.fromObject(merkleblock.header);

    var blockHeaderObject = blockHeader.toObject();

    var prevhash = new Buffer(blockHeaderObject.prevHash, 'hex');
    var merkleRoot = new Buffer(blockHeaderObject.merkleRoot, 'hex');

    console.log(BufferUtil.bufferToHex(BufferUtil.reverse(prevhash)));
    console.log(BufferUtil.bufferToHex(merkleRoot));

    console.log(blockHeader.toObject());

})

pool.on('peertx', (peer, msg) => {
    // console.log('peertx:', msg.transaction.hash)
})

pool.connect()