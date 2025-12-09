import { PublicKey } from "@solana/web3.js";

/**
 * Validates and returns a Solana PublicKey object.
 * Handles strings, PublicKey objects, and checks for valid base58 format.
 * @param {any} key - The key to validate (string or PublicKey)
 * @returns {PublicKey} - A valid PublicKey object
 * @throws {Error} - If the key is invalid
 */
export function validateSolanaPK(key) {
  if (!key) throw new Error("Missing public key input");
  
  try {
    if (key instanceof PublicKey) {
      return key;
    }
    
    if (typeof key === 'object' && key.constructor && key.constructor.name === 'PublicKey') {
        // Handle instances from different web3.js versions/contexts
        return new PublicKey(key.toString());
    }

    const keyString = String(key).trim();
    
    // Check for common invalid inputs
    if (keyString === 'undefined' || keyString === 'null' || keyString === '[object Object]') {
        throw new Error(`Invalid key string: "${keyString}"`);
    }

    return new PublicKey(keyString);
  } catch (err) {
    throw new Error(`Invalid public key input: ${err instanceof Error ? err.message : String(err)}`);
  }
}