export async function findPublicIdentity(base44, body) {
  let filter;
  if (typeof body.address === 'string' && body.address) filter = { address: body.address };
  else if (typeof body.id === 'string' && !/^\d+$/.test(body.id)) filter = { id: body.id };
  else {
    const tokenId = Number(body.tokenId ?? body.id);
    if (!Number.isSafeInteger(tokenId) || tokenId < 0) return null;
    filter = { token_id: tokenId };
  }
  return (await base44.entities.Identity.filter(filter, '-created_date', 1))[0] || null;
}