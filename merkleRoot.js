const {MerkleTree} = require('merkletreejs');
const keccak256 = require('keccak256');

// const addresses = [0xef33c5f78d43e6f773fafcb12e18073ba74e78a0, 0x59f6c9af6a3a7a4629b29136605071f8ff62c183, 0xb18472d707556f37d04a197a96dd86885c9ac044, 0x9d4a2f3950ff29a6d8fd1775c238489f8a70d512, 0xcd527ae9268051a33c660ff5a9b1f0012b8c4ec1, 0xcd527ae9268051a33c660ff5a9b1f0012b8c4ec1, 0x5cb99d3c63d38b9cc46c73988a100fb2210268c7, 0x1f5e12e4c375ec961c52a97316c0635b9d1182d1, 0x9d690429364a4b372b935e9063f749b8e2625824]
// const leaves = addresses.map(address => keccak256(address));
// const tree = new MerkleTree(leaves, keccak256, {sortPairs: true});

// console.log(buf2hex(tree.getRoot()));

// const leaf = keccak256(0xef33c5f78d43e6f773fafcb12e18073ba74e78a0); // Get from metamask/walletconnect
// const proof = tree.getProof(leaf).map(x => buf2hex(x.data));
// console.log(proof)
// contract.methods.mint(address, proof).send({from: address})

// Call last three lines on click of mint button
// This costs more gas on mint but is more secure
// Downside is that the root has to be updated everytime a new address is added 
const buf2hex = x => '0x' + x.toString('hex');

const getTree = (addresses) => {
    const leaves = addresses.map(address => keccak256(address));
    const tree = new MerkleTree(leaves, keccak256, {sortPairs: true});
    return tree;
}

const getProofs = (addresses, tree) => {
    const proofArray = [];
    addresses.forEach(address => { 
        let leaf = keccak256(address);
        let proof = tree.getProof(leaf).map(x => buf2hex(x.data));
        proofArray.push(proof);
    });
    return proofArray;
}

const getRoot = (tree) => {
    return buf2hex(tree.getRoot());
}
module.exports = {
    getTree,
    getProofs,
    getRoot,
}
