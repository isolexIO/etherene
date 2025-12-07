# How to Deploy Your Etherene NFT Contract

Since I cannot deploy to the blockchain directly, follow these simple steps to deploy your contract using Remix IDE (no installation required).

## Step 1: Open Remix
1. Go to [https://remix.ethereum.org/](https://remix.ethereum.org/).
2. In the "File Explorer" (left sidebar), create a new file named `EthereneIdentityNFT.sol`.
3. Copy the content of `components/EthereneIdentityNFT.sol` from this project and paste it into Remix.

## Step 2: Compile
1. Click the "Solidity Compiler" icon (looks like an 'S' logo) on the left sidebar.
2. Ensure "Compiler" is set to `0.8.20` (or newer).
3. Click **Compile EthereneIdentityNFT.sol**.

## Step 3: Select Your Network (Low Fees!)
Click the "Deploy & Run Transactions" icon (Ethereum logo).
Under "Environment", select **Injected Provider - MetaMask**.

Connect MetaMask to one of these low-fee networks:

### 🔵 Base (Coinbase L2) - Very Cheap
- **Mainnet**: Chain ID `8453`
- **Sepolia Testnet**: Chain ID `84532` (Free to test!)
- *Great for users within the Coinbase ecosystem.*

### 🟣 Polygon (Matic) - Extremely Cheap
- **Mainnet**: Chain ID `137`
- **Amoy Testnet**: Chain ID `80002` (Free to test!)
- *Mature ecosystem with very low fees.*

### 🟣 Monad (High Performance)
- **Devnet**: Chain ID `10143` (Example)
- *If you have access to Monad, just add the network to MetaMask and deploy!*

## Step 4: Deploy
1. In the "Deploy" section of Remix:
   - Make sure `EthereneIdentityNFT` is selected in the "Contract" dropdown.
   - You will see input fields for the `constructor` arguments:
     - `name`: "Etherene Identity"
     - `symbol`: "EID"
     - `baseTokenURI_`: "https://[YOUR-APP-ID].base44.app/functions/nftMetadata?id=" 
       - *Note: Replace [YOUR-APP-ID] with your actual app ID from the URL bar.*
       - *Important: Include the `?id=` at the end.*
2. Click **Transact** (or "Deploy").
3. Confirm in MetaMask.

## Step 5: Update the App
1. Once deployed, look at the "Deployed Contracts" section in Remix.
2. Copy the **address** of your new contract (e.g., `0x123...`).
3. Come back to the chat and tell me:
   > "I deployed the contract to [Network Name]. The address is [Your Address]."

I will then update the app configuration to use your live contract!