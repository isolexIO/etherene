import React from 'react';
import { ExternalLink, Loader2 } from 'lucide-react';

export default function IdentityMintReceipt({ profile, isOwner, isMinting, onComplete }) {
  if (!profile) return null;
  const nft = profile.nft_mint_address;
  return (
    <div className="space-y-3 border-t border-border pt-4">
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="text-muted-foreground">Identity NFT</span>
        <span>{nft ? 'Delivered to wallet' : 'Not yet delivered'}</span>
      </div>
      {nft && <a href={`https://solscan.io/token/${nft}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline break-all">View identity NFT <ExternalLink className="h-4 w-4 shrink-0" /></a>}
      <a href={`https://sns.id/domain/${encodeURIComponent(profile.subdomain)}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-sm underline">View SNS subdomain <ExternalLink className="h-4 w-4" /></a>
      {isOwner && profile.fee_charged && !nft && <button onClick={onComplete} disabled={isMinting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{isMinting && <Loader2 className="h-4 w-4 animate-spin" />}{isMinting ? 'Completing mint...' : 'Complete paid mint'}</button>}
      {isOwner && profile.fee_charged && !nft && <p className="text-xs text-muted-foreground">Resumes your existing payment without charging again.</p>}
    </div>
  );
}