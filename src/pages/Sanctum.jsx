import React from 'react';
import { motion } from 'framer-motion';
import { useWeb3 } from '../Layout';
import { createPageUrl } from '../utils';

export default function Sanctum() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold">Sanctum</h1>
      <p>Welcome to the Sanctum.</p>
    </div>
  );
}