import { motion } from 'framer-motion';

import { cn } from '@/shared/lib/utils';

import { tabUnderlineSpring } from './transitions';

type AnimatedTabUnderlineProps = {
  layoutId: string;
  className?: string;
};

export function AnimatedTabUnderline({
  layoutId,
  className,
}: AnimatedTabUnderlineProps) {
  return (
    <motion.div
      layoutId={layoutId}
      className={cn(
        'bg-brand-accent absolute inset-x-0 -bottom-px z-10 h-[3px]',
        className,
      )}
      transition={tabUnderlineSpring}
    />
  );
}
