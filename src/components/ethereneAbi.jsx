export const ETHERENE_NFT_ABI = [
  "function mint() public payable",
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function hasDeclared(address user) view returns (bool)",
  "function signDeclaration(string memory message) public"
];

export const CONTRACT_ADDRESSES = {
  // Mainnets
  1: "0x...", // Ethereum Mainnet
  137: "0x2B7CF55d2660bC49d328452C5e0D07B2EC8A5c02", // Polygon Mainnet
  8453: "0x2B7CF55d2660bC49d328452C5e0D07B2EC8A5c02", // Base Mainnet
  
  // Testnets (Recommended for testing)
  84532: "0x2B7CF55d2660bC49d328452C5e0D07B2EC8A5c02", // Base Sepolia
  80002: "0x2B7CF55d2660bC49d328452C5e0D07B2EC8A5c02", // Polygon Amoy
  11155111: "0x...", // Sepolia
  
  // Upcoming / Custom
  10143: "0x..." // Monad (Placeholder)
};