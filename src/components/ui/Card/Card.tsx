import { forwardRef, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { motion, type HTMLMotionProps } from 'framer-motion';
import styles from './Card.module.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'glass' | 'neumorphic';
}

type MotionCardProps = CardProps & HTMLMotionProps<"div">;

export const Card = forwardRef<HTMLDivElement, MotionCardProps>(
  ({ className, variant = 'glass', children, ...props }, ref) => {
    return (
      <motion.div
        ref={ref}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={clsx(styles.card, styles[variant], className)}
        {...props}
      >
        {children}
      </motion.div>
    );
  }
);

Card.displayName = 'Card';
