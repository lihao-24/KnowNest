"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { LOGOUT_FAILED_MESSAGE, signOutCurrentUser } from "@/lib/auth";

import type { SettingsViewModel } from "./settings-model";

type SettingsPanelProps = {
  settings: SettingsViewModel;
};

export function SettingsPanel({ settings }: SettingsPanelProps) {
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
    <div className="min-w-0 rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
      <div className="grid min-w-0 gap-6">
        <div className="min-w-0 border-b border-slate-200 pb-5">
          <p className="text-sm font-medium text-slate-700">当前账号</p>
          <p className="mt-2 break-words text-base font-semibold text-slate-950">
            {settings.accountEmail}
          </p>
        </div>

        <div className="min-w-0 border-b border-slate-200 pb-5">
          <p className="text-sm font-medium text-slate-700">产品版本</p>
          <p className="mt-2 text-base font-semibold text-slate-950">
            {settings.appVersion}
          </p>
        </div>

        <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h2 className="text-base font-semibold">退出登录</h2>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              退出当前账号后将返回登录页。
            </p>
          </div>

          <button
            className={`${settings.logoutButtonMinHeightClass} inline-flex w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400 sm:w-auto`}
            disabled={isLoggingOut}
            onClick={handleLogout}
            type="button"
          >
            {isLoggingOut
              ? settings.logoutPendingLabel
              : settings.logoutButtonLabel}
          </button>
        </div>
      </div>

      <p
        aria-live="polite"
        className="mt-4 min-h-6 text-sm leading-6 text-red-600"
        role="status"
      >
        {errorMessage}
      </p>
    </div>
  );
}
