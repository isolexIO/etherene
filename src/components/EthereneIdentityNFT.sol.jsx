// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

contract EthereneIdentityNFT is ERC721, Ownable {
    using Counters for Counters.Counter;
    Counters.Counter private _tokenIdCounter;

    string private _baseTokenURI;

    constructor(string memory name, string memory symbol, string memory baseTokenURI_)
        ERC721(name, symbol)
        Ownable(msg.sender)
    {
        _baseTokenURI = baseTokenURI_;
    }

    function mint() public payable returns (uint256) {
        _tokenIdCounter.increment();
        uint256 newItemId = _tokenIdCounter.current();
        _safeMint(msg.sender, newItemId);
        return newItemId;
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseTokenURI;
    }

    function setBaseURI(string memory baseTokenURI_) public onlyOwner {
        _baseTokenURI = baseTokenURI_;
    }
}