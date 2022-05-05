const { waffle } = require('hardhat');
const { utils } = require('ethers')
const { expect } = require('chai');
const { getTree, getProofs, getRoot } = require('../helpers/merkleRoot.js');
const FarmersNFT = require('../artifacts/contracts/FarmersNFT.sol/FarmersNFT.json');

describe('FarmersNFT', function() {
    let contract;
    const [owner, wlAccount, account] = waffle.provider.getWallets();
    const merkleTree = getTree([owner.address, wlAccount.address]);
    const merkleRoot = getRoot(merkleTree);
    const [ownerProof, wlAccountProof] = getProofs([owner.address, wlAccount.address], merkleTree);


    describe.skip('owner functions', function () {
        before('get contract', async function() {
            contract = await waffle.deployContract(owner, FarmersNFT, [merkleRoot, 15]); 
            await contract.deployed();
        })

        it('can force mint', async function () {
            const forceMintTx = await contract.forceMint(1);
            await forceMintTx.wait();
            expect(await contract.balanceOf(owner.address)).to.equal(1);
        }) 

        it('non-owner cannot force mint', async function() {
            await expect(contract.connect(wlAccount).forceMint(1)).to.be.revertedWith('Ownable: caller is not the owner');
        })

        it('owner cannot mint more than devSupply', async function() {
            await expect(contract.forceMint(1)).to.be.revertedWith('ExceedsDevSupply');
        })

        it('owner can flip presale', async function() {
            const flipPre = await contract.flipPreSale();
            await flipPre.wait();
            expect(await contract.preSaleActive()).to.equal(true);
        })

        it('owner can open public sales', async function() {
            const openSales = await contract.openPublicSales();
            await openSales.wait();
            expect(await contract.mintIsActive()).to.equal(true);
        })

        it('owner cannot close public sales', async function() {
            await expect(contract.openPublicSales()).to.be.revertedWith('CanNotCloseSales');
        })

    })
    
    describe.skip('whitelist mint tests', function() {
        before('flip presale', async function() {
            contract = await waffle.deployContract(owner, FarmersNFT, [merkleRoot, 15]); 
            await contract.deployed();
            await contract.flipPreSale();
        })

        it('whitelisted account can mint', async function() {
            const wlmint = await contract.connect(wlAccount).whiteListMint(1, wlAccountProof, { value: utils.parseEther('0.07') });
            await wlmint.wait();
            expect(await contract.balanceOf(wlAccount.address)).to.equal(1);
        })

        it('non whitelisted account cannot mint', async function() {
            await expect(contract.connect(account).whiteListMint(1, wlAccountProof, { value: utils.parseEther('0.07') })).to.be.revertedWith('Unauthorized');
        })

        it('cannot mint more than max per tx', async function(){
            await expect(contract.connect(wlAccount).whiteListMint(11, wlAccountProof, { value: utils.parseEther('0.77'), gasLimit: 100000 })).to.be.revertedWith('InvalidQuantity');
        })

        it('cannot mint more than max supply', async function() {
            const mint1 = await contract.connect(wlAccount).whiteListMint(10, wlAccountProof, { value: utils.parseEther('0.7'), gasLimit: 100000 });
            await mint1.wait();
            await expect(contract.connect(wlAccount).whiteListMint(5, wlAccountProof, { value: utils.parseEther('0.35'), gasLimit: 100000 })).to.be.revertedWith('ExceedsMaxSupply');
        })

        it('check for value to match price for one', async function() {
            const mint = await contract.whiteListMint(1, ownerProof, { value: utils.parseEther('0.07') });
            await mint.wait();
            expect(await contract.balanceOf(owner.address)).to.equal(1);
        })

        it('check for value to match price for batch', async function() {
            await expect(contract.whiteListMint(4, ownerProof, { value: utils.parseEther('0.2') })).to.be.revertedWith('InvalidPaymentAmount');
        })

        it('can mint up to max token limit', async function() {
            const mint = await contract.whiteListMint(3, ownerProof, { value: utils.parseEther('0.21') });
            await mint.wait();
            expect(await contract.totalSupply()).to.equal(15);
        })
    })

    describe.skip('public mint functions', async function() {
        before('open sales', async function() {
            contract = await waffle.deployContract(owner, FarmersNFT, [merkleRoot, 15]); 
            await contract.deployed();
            await contract.openPublicSales();
        })

        it('can mint', async function() {
            const mint = await contract.publicMint(1, { value: utils.parseEther('0.07') });
            await mint.wait();
            expect(await contract.balanceOf(owner.address)).to.equal(1);
        })

        it('can not mint 0 quantity', async function() {
            await expect(contract.publicMint(0)).to.be.revertedWith('MintZeroQuantity');
        })
    })

    describe('ensure withdraw', async function() {
        before('open sales', async function() {
            contract = await waffle.deployContract(owner, FarmersNFT, [merkleRoot, 15]); 
            await contract.deployed();
            await contract.openPublicSales();
        })

        it('can withdraw', async function(){
            const mint = await contract.connect(account).publicMint(1, { value: utils.parseEther('0.07') });
            await mint.wait();
            await expect(await contract.withdraw()).to.changeEtherBalance(owner, utils.parseEther('0.07'));
        })

        it('only owner can withdraw', async function() {
            const mint = await contract.connect(account).publicMint(1, { value: utils.parseEther('0.07') });
            await mint.wait()
        })
    })
});
