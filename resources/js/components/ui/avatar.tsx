import * as React from 'react';
import { cn } from '@/lib/utils';

export function Avatar({
    className,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'relative flex h-8 w-8 shrink-0 overflow-hidden rounded-full ring-1 ring-zinc-200 dark:ring-zinc-800',
                className,
            )}
            {...props}
        />
    );
}

export function AvatarFallback({
    className,
    children,
    ...props
}: React.HTMLAttributes<HTMLDivElement>) {
    return (
        <div
            className={cn(
                'flex h-full w-full items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200',
                className,
            )}
            {...props}
        >
            {children}
        </div>
    );
}

