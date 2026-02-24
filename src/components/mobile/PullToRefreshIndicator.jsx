import React from 'react';
import { RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PullToRefreshIndicator({ distance, isRefreshing }) {
  const rotation = Math.min((distance / 120) * 360, 360);
  const opacity = Math.min(distance / 60, 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: Math.max(opacity, isRefreshing ? 1 : 0), y: -20 }}
      className="fixed top-20 left-1/2 -translate-x-1/2 z-40 pointer-events-none"
    >
      <motion.div
        animate={{ rotate: isRefreshing ? 360 : rotation }}
        transition={{ duration: isRefreshing ? 1 : 0, repeat: isRefreshing ? Infinity : 0 }}
        className="w-8 h-8 flex items-center justify-center"
      >
        <RefreshCw className="w-5 h-5 text-indigo-600" />
      </motion.div>
    </motion.div>
  );
}