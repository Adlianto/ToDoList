import { type FlashMessages } from '@/types';

type FlashAlertsProps = {
    flash?: FlashMessages;
};

export function FlashAlerts({ flash }: FlashAlertsProps) {
    if (!flash?.success && !flash?.error && !flash?.invitation_code) {
        return null;
    }

    return (
        <div className="space-y-3">
            {flash.success && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/50 dark:text-emerald-300">
                    {flash.success}
                </div>
            )}

            {flash.invitation_code && (
                <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-200">
                    <p className="font-semibold">
                        One-Time Invitation Code (Copy now — shown only once):
                    </p>
                    <p className="mt-1 font-mono text-base font-bold tracking-widest select-all">
                        {flash.invitation_code}
                    </p>
                </div>
            )}

            {flash.error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 dark:border-red-900/50 dark:bg-red-950/50 dark:text-red-300">
                    {flash.error}
                </div>
            )}
        </div>
    );
}
