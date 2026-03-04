import React from 'react';
import { motion } from 'framer-motion';

/**
 * Consistent full-page loading indicator using a staggered animated dots pattern.
 * Use inside a page's main content area wherever data is being fetched.
 *
 * @param {string} [text] - Optional label shown below the dots
 */
const PageLoader = ({ text }) => (
  <div className="flex flex-col items-center justify-center py-32 gap-5">
    <div className="flex items-center gap-2">
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.span
          key={i}
          className="w-2 h-2 rounded-full bg-blue-500 dark:bg-blue-400"
          animate={{ y: [0, -10, 0], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }}
        />
      ))}
    </div>
    {text && (
      <p className="text-sm font-medium text-slate-400 dark:text-zinc-500 tracking-wide">{text}</p>
    )}
  </div>
);

export default PageLoader;
