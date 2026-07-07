import Link from "next/link";
import { getInviteStatusBadge } from "@/lib/presentation";
import { Spinner } from "@/components/spinner";
import { ReceivedInvite, InviteAction } from "./types";

export function InviteItem({
  inv,
  processingAction,
  respond,
}: {
  inv: ReceivedInvite;
  processingAction: InviteAction | undefined;
  respond: (inviteId: string, action: InviteAction) => Promise<void>;
}) {
  const isProcessing = processingAction !== undefined;
  return (
    <li
      key={inv.id}
      className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm dark:border-gray-800 dark:bg-gray-950"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {(() => {
              const badge = getInviteStatusBadge(inv.status);
              return (
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
              );
            })()}
          </div>

          <Link
            href={`/papers/${inv.paperId}`}
            className="mt-3 block text-base font-semibold text-gray-950 transition-colors hover:text-gray-700 hover:underline dark:text-gray-50 dark:hover:text-gray-200"
          >
            {inv.paperTitle}
          </Link>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            {inv.inviterName} からの招待
          </p>
        </div>

        {inv.status === "pending" ? (
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => respond(inv.id, "accept")}
              disabled={isProcessing}
              aria-busy={processingAction === "accept"}
              className="inline-flex min-w-[72px] items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50 dark:bg-white dark:text-gray-900 dark:hover:bg-gray-200"
            >
              {processingAction === "accept" && <Spinner className="h-4 w-4" />}
              <span
                className={
                  processingAction === "accept" ? "sr-only" : undefined
                }
              >
                承認
              </span>
            </button>
            <button
              type="button"
              onClick={() => respond(inv.id, "decline")}
              disabled={isProcessing}
              aria-busy={processingAction === "decline"}
              className="inline-flex min-w-[72px] items-center justify-center gap-2 rounded-xl border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-900"
            >
              {processingAction === "decline" && (
                <Spinner className="h-4 w-4" />
              )}
              <span
                className={
                  processingAction === "decline" ? "sr-only" : undefined
                }
              >
                拒否
              </span>
            </button>
          </div>
        ) : (
          <div className="shrink-0 text-xs text-gray-400">対応済み</div>
        )}
      </div>
    </li>
  );
}
