'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface BottomSheetProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    title?: string;
}

export function BottomSheet({ isOpen, onClose, children, title }: BottomSheetProps) {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm"
                    />

                    {/* Sheet */}
                    <motion.div
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        className="fixed bottom-0 left-0 right-0 z-[60] bg-background border-t border-border rounded-t-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Drag Handle & Header */}
                        <div className="flex-shrink-0 bg-background/80 backdrop-blur-md px-4 py-3 border-b border-border-subtle sticky top-0 z-10">
                            <div className="w-12 h-1.5 bg-border rounded-full mx-auto mb-3" />
                            <div className="flex items-center justify-between">
                                <h2 className="text-sm font-semibold text-foreground tracking-tight">
                                    {title}
                                </h2>
                                <button
                                    onClick={onClose}
                                    className="p-1.5 rounded-full hover:bg-card-hover text-muted-foreground transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-4 overflow-y-auto overscroll-contain pb-safe-bottom">
                            {children}
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}
