// TODO: Setup Events on mint and reveal
// TODO: Add mint complience modifiers
// TODO:
// TODO:
// TODO:
// TODO:

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "erc721a/contracts/ERC721A.sol";

contract FarmersNFT is ERC721A, Ownable {

    // Constant token information
    uint256 public MAX_TOKEN;
    uint256 public constant MAX_MINT_PER_TX = 10; // SET MAX MINT
    uint256 public constant TOKEN_PRICE = 0.07 ether;

    // Token supply
    uint256 public devSupplyLeft = 1; // ! SET MAX DEV AMOUNT

    // URI
    string public notRevealedUri = "INSERT IPFS METADATA LINK TO HIDDEN IMAGE";
    string private baseURI;

    // Control booleans
    bool public mintIsActive = false;
    bool public preSaleActive = false;
    bool public revealed = false;

    // MerkleProof Root
    bytes32 private root;

    // Returned Errors
    error Unauthorized();
    error MintHasNotStarted();
    error ExceedsMaxSupply();
    error InvalidQuantity();
    error ExceedsDevSupply();
    error CanNotCloseSales();
    error InvalidPaymentAmount();

    event TokenMinted(address minter, uint256 quantity);

    constructor(bytes32 _root, uint256 _supply) ERC721A("Farmer", "FRM") {
            root = _root;
            MAX_TOKEN = _supply;
        }

    // Variable setters only callable by contract owner
    function flipPreSale() external onlyOwner {
        preSaleActive = !preSaleActive;
    }

    // ! This is one way. Once mint is open there will be no stopping it.
    function openPublicSales() external onlyOwner {
        if (mintIsActive) revert CanNotCloseSales();
        mintIsActive = true;
    }

    // See https://docs.opensea.io/docs/metadata-standards for URI standards  
    function setBaseURI(string memory _uri) public onlyOwner {
        baseURI = _uri;
    }
 
    function contractURI() public pure returns (string memory) {
        return "INSERT CONTRACT LEVEL METADATA HERE";
    }

    function isValid(bytes32[] memory _proof, bytes32 _leaf) private view returns (bool) {
        return MerkleProof.verify(_proof, root, _leaf);
    }
    // Mint functions

    // Checks to make sure there is still a supply for dev tokens and doesn't exceed max tokens
    function forceMint(uint256 _quantity) external onlyOwner {
        if (devSupplyLeft < _quantity) revert ExceedsDevSupply(); 
        unchecked {
            if (totalSupply() + _quantity > MAX_TOKEN) revert ExceedsMaxSupply();
            devSupplyLeft -= _quantity;
        }
        _safeMint(msg.sender, _quantity);
        emit TokenMinted(msg.sender, _quantity);
    }

    // Checks to make sure the pre-sale is active, would not exceed max token,
    // the address is on the whitelist and has an allowance to mint,
    // and the address doesn't exceed max owned per address
    function whiteListMint(uint256 _quantity, bytes32[] memory _proof) public payable {
        if (!preSaleActive) revert MintHasNotStarted();
        if (!(isValid(_proof, keccak256(abi.encodePacked(msg.sender))))) revert Unauthorized();
        if (_quantity > MAX_MINT_PER_TX) revert InvalidQuantity(); 
        // Should be safe as _quantity gets checked to be less than MAX_MINT_PER_TX and greater than 0 in safeMint 
        unchecked {
            if (msg.value != TOKEN_PRICE * _quantity) revert InvalidPaymentAmount();
            if (totalSupply() + _quantity > MAX_TOKEN) revert ExceedsMaxSupply();
        }
        _safeMint(msg.sender, _quantity);
        emit TokenMinted(msg.sender, _quantity);
    }

    // Checks to make sure the public mint is active, a valid purchase quantity,
    // doesn't exceed max tokens
    function publicMint(uint256 _quantity) public payable {
        if (!mintIsActive) revert MintHasNotStarted();
        if (_quantity > MAX_MINT_PER_TX) revert InvalidQuantity(); 
        unchecked {
            if (msg.value != TOKEN_PRICE * _quantity) revert InvalidPaymentAmount();
            if (totalSupply() + _quantity > MAX_TOKEN) revert ExceedsMaxSupply();
        }
        _safeMint(msg.sender, _quantity);
        emit TokenMinted(msg.sender, _quantity);
    }

    function withdraw() public onlyOwner {
        payable(owner()).transfer(address(this).balance);
    }

    function _baseURI() internal view override returns (string memory) {
        return baseURI;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        if (!revealed) return notRevealedUri;
        return super.tokenURI(tokenId);
    }

    function _startTokenId() internal pure override returns (uint256) {
        return 1;
    }

}
