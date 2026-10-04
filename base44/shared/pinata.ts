import { secrets } from 'base44:runtime';

export function assertNftStorageConfigured() {
  if (!secrets.get('PINATA_JWT')) throw new Error('NFT image storage is not configured. Minting is unavailable before payment.');
}

async function pinFile(blob, filename) {
  const jwt = secrets.get('PINATA_JWT');
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
  const url = new URL(fileUrl);
  const allowed = url.hostname === 'media.base44.com' || url.hostname === 'images.unsplash.com' || url.hostname === 'qtrypzzcjebvfcihiynt.supabase.co';
  if (url.protocol !== 'https:' || !allowed) throw new Error('Use an Etherene-generated or stored profile image for NFT minting.');
  const res = await fetch(url, { redirect: 'manual' });
  if (!res.ok) throw new Error('Failed to fetch the generated image for IPFS upload.');
  const blob = await res.blob();
  return pinFile(blob, 'identity.png');
}

export async function pinataUploadJson(obj) {
  const blob = new Blob([JSON.stringify(obj)], { type: 'application/json' });
  return pinFile(blob, 'metadata.json');
}