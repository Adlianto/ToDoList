import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

type DialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, children }: DialogProps) {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
            }
        };
        if (open) {
            document.body.style.overflow = 'hidden';
            window.addEventListener('keydown', handleKeyDown);
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [open, onOpenChange]);

    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
            <div
                className="fixed inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
                onClick={() => onOpenChange(false)}
            />
            <div className="relative z-50 w-full max-w-lg">{children}</div>
        </div>
    );
}

export function DialogContent({
    className,
    children,
    onClose,
    ...props
}: React.HTMLAttributes<HTMLDivElement> & { onClose?: () => void }) {
    return (
        <div
            className={cn(
                'relative w-full rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl transition-all dark:border-zinc-800 dark:bg-zinc-900',
                className,
            )}
            {...props}
        >
            {onClose && (
                <button
                    type="button"
                    onClick={onClose}
                    className="absolute top-4 right-4 rounded-md p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
                >
                    <X className="h-4 w-4" />
                    <span className="sr-only">Close</span>
                </button>
            )}
            {children}
        </div>
    );
}

export function DialogHeader({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex flex-col space-y-1.5 text-center sm:text-left',
                className,
            )}
            {...props}
        />
    );
}

export function DialogTitle({
    className,
    ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
    return (
        <h2
            className={cn(
                'text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100',
                className,
            )}
            {...props}
        />
    );
}

export function DialogDescription({
    className,
    ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
    return (
        <p
            className={cn('text-xs text-zinc-500 dark:text-zinc-400', className)}
            {...props}
        />
    );
}

export function DialogFooter({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end',
                className,
            )}
            {...props}
        />
    );
}

