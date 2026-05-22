import { AnimatePresence, motion, type HTMLMotionProps } from 'framer-motion';
import type { ReactNode } from 'react';

import { panelFadeMotion, panelFadeTransition } from './transitions';

type AnimatedPanelProps = HTMLMotionProps<'div'> & {
  panelKey: string;
  children: ReactNode;
};

export function AnimatedPanel({
  panelKey,
  children,
  className,
  ...props
}: AnimatedPanelProps) {
  return (
    <motion.div
      key={panelKey}
      initial={panelFadeMotion.initial}
      animate={panelFadeMotion.animate}
      exit={panelFadeMotion.exit}
      transition={panelFadeTransition}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

type AnimatedPanelSwitchProps = {
  children: ReactNode;
};

export function AnimatedPanelSwitch({ children }: AnimatedPanelSwitchProps) {
  return <AnimatePresence mode="wait">{children}</AnimatePresence>;
}
