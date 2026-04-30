"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  clearStoredAIModelId,
  getStoredAIModelId,
  resolveSelectedAIModelId,
  setStoredAIModelId,
} from "@/lib/ai/client-model-selection";
import { LOGOUT_FAILED_MESSAGE, signOutCurrentUser } from "@/lib/auth";

import type { SettingsViewModel } from "./settings-model";

type SettingsPanelProps = {
  settings: SettingsViewModel;
};

export function SettingsPanel({ settings }: SettingsPanelProps) {
  const router = useRouter();
  const aiModelOptions = settings.ai.modelOptions;
  const [selectedAIModelId, setSelectedAIModelId] = useState(() =>
    resolveSelectedAIModelId(
      aiModelOptions,
      settings.ai.defaultModelId,
      null,
    ),
  );
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setSelectedAIModelId(
      resolveSelectedAIModelId(
        aiModelOptions,
        settings.ai.defaultModelId,
        getStoredAIModelId(),
      ),
    );
  }, [aiModelOptions, settings.ai.defaultModelId]);

  function handleAIModelChange(modelId: string) {
    const resolvedModelId = resolveSelectedAIModelId(
      aiModelOptions,
      settings.ai.defaultModelId,
      modelId,
    );

    setSelectedAIModelId(resolvedModelId);

    if (resolvedModelId) {
      setStoredAIModelId(resolvedModelId);
    }
  }

  function handleResetAIModel() {
    clearStoredAIModelId();
    setSelectedAIModelId(
      resolveSelectedAIModelId(aiModelOptions, settings.ai.defaultModelId, null),
    );
  }

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

        <div className="min-w-0 border-b border-slate-200 pb-5">
          <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <h2 className="text-base font-semibold">AI 模型</h2>
              <p className="mt-1 text-sm leading-6 text-slate-600">
                选择只保存在当前浏览器。服务端 API Key 不会暴露到浏览器。
              </p>
            </div>

            {aiModelOptions.length > 0 ? (
              <button
                className="inline-flex h-10 w-full items-center justify-center rounded-md border border-slate-300 bg-white px-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 sm:w-auto"
                onClick={handleResetAIModel}
                type="button"
              >
                恢复默认
              </button>
            ) : null}
          </div>

          {aiModelOptions.length > 0 ? (
            <label className="mt-4 block min-w-0">
              <span className="text-sm font-medium text-slate-700">
                默认 AI 模型
              </span>
              <select
                className="mt-2 h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                onChange={(event) => handleAIModelChange(event.target.value)}
                value={selectedAIModelId}
              >
                {aiModelOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <p className="mt-4 rounded-md border border-dashed border-slate-300 px-3 py-2 text-sm leading-6 text-slate-600">
              暂无可用 AI 模型，请检查服务端配置。
            </p>
          )}
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
