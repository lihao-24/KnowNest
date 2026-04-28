"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LOGOUT_FAILED_MESSAGE, signOutCurrentUser } from "@/lib/auth";

export default function SettingsPage() {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleLogout() {
    setErrorMessage("");
    setIsLoggingOut(true);

    try {
      await signOutCurrentUser();
      router.replace("/login");
    } catch {
      setErrorMessage(LOGOUT_FAILED_MESSAGE);
      setIsLoggingOut(false);
    }
  }

  return (
    <section className="min-w-0 w-full max-w-3xl">
      <div className="mb-8 min-w-0">
        <p className="text-sm font-medium text-teal-700">设置</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          KnowNest
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          管理当前会话。更多设置会在后续任务中补充。
        </p>
      </div>

      <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">退出登录</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              退出当前账号后将返回登录页。
            </p>
          </div>

          <button
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto"
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            {isLoggingOut ? "退出中..." : "退出登录"}
          </button>
        </div>

        <p
          aria-live="polite"
          className="mt-4 min-h-6 text-sm leading-6 text-red-600"
          role="status"
        >
          {errorMessage}
        </p>
      </div>
    </section>
  );
}
