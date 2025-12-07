export const ETHERENE_NFT_ABI = [
  "function mint() public payable",
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function hasDeclared(address user) view returns (bool)",
  "function signDeclaration(string memory message) public"
];

export const CONTRACT_ADDRESSES = {
  1: "0x...", // Mainnet
  5: "0x...", // Goerli
  11155111: "0x...", // Sepolia
  8453: "0x...", // Base
  137: "0x..." // Polygon
};