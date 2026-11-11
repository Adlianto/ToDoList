import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
    'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2',
    {
        variants: {
            variant: {
                default:
                    'bg-zinc-900 text-zinc-50 hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200',
                secondary:
                    'bg-zinc-100 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700',
                destructive:
                    'bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-950/70 dark:text-red-300',
                outline:
                    'border border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300',
                success:
                    'bg-emerald-100 text-emerald-800 hover:bg-emerald-200 dark:bg-emerald-950/70 dark:text-emerald-300',
                warning:
                    'bg-amber-100 text-amber-800 hover:bg-amber-200 dark:bg-amber-950/70 dark:text-amber-300',
                info: 'bg-blue-100 text-blue-800 hover:bg-blue-200 dark:bg-blue-950/70 dark:text-blue-300',
                purple: 'bg-purple-100 text-purple-800 hover:bg-purple-200 dark:bg-purple-950/70 dark:text-purple-300',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface BadgeProps
    extends React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
    return (
        <div className={cn(badgeVariants({ variant }), className)} {...props} />
    );
}

