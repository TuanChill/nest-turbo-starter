'use client';

import * as React from 'react';
import { motion } from 'motion/react';

interface RevealProps {
   children: React.ReactNode;
   className?: string;
   delay?: number;
   y?: number;
}

export function Reveal({ children, className, delay = 0, y = 16 }: RevealProps) {
   return (
      <motion.div
         className={className}
         initial={{ opacity: 0, y }}
         whileInView={{ opacity: 1, y: 0 }}
         viewport={{ once: true, margin: '-80px' }}
         transition={{ duration: 0.5, delay, ease: [0.21, 0.47, 0.32, 0.98] }}
      >
         {children}
      </motion.div>
   );
}
