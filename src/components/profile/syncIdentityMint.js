import { base44 } from '@/api/base44Client';

export default async function syncIdentityMint(pending) {
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      const response = await base44.functions.invoke('requestMint', pending);
      if (!response.data?.success) throw new Error(response.data?.error || 'Unable to sync your identity.');
      return response.data;
    } catch (error) {
      if (!error.response?.data?.transactionPending || attempt === 19) throw error;
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }
}