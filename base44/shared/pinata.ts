// Server-side Pinata IPFS pinning helpers used by on-chain NFT minting.
// These run with server credentials and only handle URLs produced by our own
// GenerateImage integration, so they do not need the user-facing SSRF guard.

async function pinFile(blob, filename) {
  const jwt = process.env.PINATA_JWT;
  if (!jwt) throw new Error('PINATA_JWT is not configured.');
  const formData = new FormData();
  formData.append('file', blob, filename);
  const res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
    method: 'POST',
    headers: { Authorization: `Bearer ${jwt}` },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.details || data.message || 'IPFS upload failed.');
  return `https://gateway.pinata.cloud/ipfs/${data.IpfsHash}`;
}

export async function pinataUploadFile(fileUrl) {
  const res = await fetch(fileUrl);
  if (!res.ok) throw new Error('Failed to fetch the generated image for IPFS upload.');
  const blob = await res.blob();
  return pinFile(blob, 'identity.png');
}

export async function pinataUploadJson(obj) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  return pinFile(blob, 'metadata.json');
}