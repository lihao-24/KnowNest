"use client";

import type { FormEvent } from "react";
import { useState } from "react";

const LOGIN_ERROR_MESSAGE = "登录失败，请检查邮箱和密码。";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setIsLoading(true);

    window.setTimeout(() => {
      setIsLoading(false);
      setErrorMessage(LOGIN_ERROR_MESSAGE);
    }, 400);
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-slate-50 px-4 py-10 text-slate-950 sm:px-6">
      <section className="w-full max-w-sm rounded-lg border border-slate-200 bg-white px-5 py-6 shadow-sm sm:px-6 sm:py-7">
        <div className="mb-7">
          <h1 className="text-3xl font-semibold tracking-normal text-slate-950">
            KnowNest
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            知巢：你的个人知识库
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="email"
            >
              邮箱
            </label>
            <input
              autoComplete="email"
              className="h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm"
              disabled={isLoading}
              id="email"
              name="email"
              placeholder="输入登录邮箱"
              type="email"
            />
          </div>

          <div>
            <label
              className="mb-1.5 block text-sm font-medium text-slate-700"
              htmlFor="password"
            >
              密码
            </label>
            <input
              autoComplete="current-password"
              className="h-11 w-full min-w-0 rounded-md border border-slate-300 bg-white px-3 text-base text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:cursor-not-allowed disabled:bg-slate-100 sm:text-sm"
              disabled={isLoading}
              id="password"
              name="password"
              placeholder="输入密码"
              type="password"
            />
          </div>

          <button
            className="flex h-11 w-full items-center justify-center rounded-md bg-slate-950 px-4 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            disabled={isLoading}
            type="submit"
          >
            {isLoading ? "登录中..." : "登录"}
          </button>

          <p
            aria-live="polite"
            className="min-h-6 text-sm leading-6 text-red-600"
            role="status"
          >
            {errorMessage}
          </p>
        </form>
      </section>
    </main>
  );
}
