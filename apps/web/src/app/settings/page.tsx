"use client";

import { useAuth } from "@/components/auth-provider";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ProfileForm } from "./profile-form";

export default function SettingsPage() {
  const { user, loading, refresh } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) router.push("/");
  }, [loading, user, router]);

  if (loading || !user) return null;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm text-blue-600 hover:underline dark:text-blue-400"
        >
          ← ダッシュボードに戻る
        </Link>
      </div>

      <div className="mb-8 rounded-3xl border border-gray-200 bg-white px-6 py-6 shadow-sm dark:border-gray-800 dark:bg-gray-950 sm:px-8 sm:py-8">
        <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
          Profile settings
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-gray-950 dark:text-gray-50">
          プロフィール設定
        </h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-gray-600 dark:text-gray-400">
          表示名を調整して、OpenShelf 上での見え方を整えます。GitHub
          のユーザー名はそのまま保持され、表示名を空欄にすると自動的にフォールバックされます。
        </p>
      </div>

      <ProfileForm user={user} refresh={refresh} />
    </div>
  );
}
