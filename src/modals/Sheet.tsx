import { motion, AnimatePresence } from 'framer-motion';
import React from 'react';

type Props = {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  wide?: boolean;
};

export function Sheet({ title, subtitle, onClose, children, wide }: Props) {
  return (
    <motion.div
      className="sheet-bg"
      onClick={e => e.target === e.currentTarget && onClose()}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.22 }}
    >
      <motion.div
        className={`sheet${wide ? ' wide' : ''}`}
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0, transition: { duration: 0.24 } }}
        transition={{ type: 'spring', stiffness: 380, damping: 34 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="sheet-handle" />
        <header className="sheet-head">
          <div>
            {subtitle && <div className="card-eyebrow">{subtitle}</div>}
            <h2>{title}</h2>
          </div>
          <motion.button className="sheet-close" onClick={onClose} whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.92 }}>×</motion.button>
        </header>
        <div className="sheet-body">{children}</div>
      </motion.div>
    </motion.div>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
    </label>
  );
}
