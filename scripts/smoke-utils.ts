import { createServer } from "node:net";
import { spawn, type ChildProcess } from "node:child_process";
import { chromium, type Browser, type Page } from "playwright";

export type SmokeServer = {
  baseUrl: string;
  stop: () => Promise<void>;
};

type SmokeEnv = Record<string, string | undefined>;

export async function startNextDevServer(env: SmokeEnv): Promise<SmokeServer> {
  await buildNextApp(env);
  const port = await getFreePort();
  const child = spawn("pnpm", ["exec", "next", "start", "-p", String(port), "-H", "127.0.0.1"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env,
      PORT: String(port)
    },
    stdio: ["ignore", "pipe", "pipe"]
  });

  const output: string[] = [];
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  const baseUrl = `http://127.0.0.1:${port}`;
  await waitForUrl(`${baseUrl}/login`, child, output);

  return {
    baseUrl,
    stop: () => stopProcess(child)
  };
}

export async function withBrowser<T>(run: (page: Page, browser: Browser) => Promise<T>): Promise<T> {
  const browser = await launchSmokeBrowser();
  const page = await browser.newPage({ viewport: { width: 1440, height: 960 } });

  try {
    return await run(page, browser);
  } finally {
    await browser.close();
  }
}

async function launchSmokeBrowser(): Promise<Browser> {
  try {
    return await chromium.launch({ channel: "chrome", headless: true });
  } catch {
    return chromium.launch({ headless: true });
  }
}

export function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

export function hasEnvVars(keys: string[]): boolean {
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

async function getFreePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.on("error", reject);
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") {
        server.close(() => reject(new Error("failed to allocate smoke port")));
        return;
      }

      const port = address.port;
      server.close(() => resolve(port));
    });
  });
}

async function waitForUrl(url: string, child: ChildProcess, output: string[]): Promise<void> {
  const startedAt = Date.now();
  const timeoutMs = 45_000;

  while (Date.now() - startedAt < timeoutMs) {
    if (child.exitCode !== null) {
      throw new Error(`Next dev server exited early.\n${output.join("")}`);
    }

    try {
      const response = await fetch(url);
      if (response.ok || response.status < 500) {
        return;
      }
    } catch {
      // Keep polling until Next finishes compiling the first route.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}.\n${output.join("")}`);
}

async function buildNextApp(env: SmokeEnv): Promise<void> {
  const child = spawn("pnpm", ["exec", "next", "build", "--webpack"], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      ...env
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  const output: string[] = [];
  child.stdout.on("data", (chunk) => output.push(String(chunk)));
  child.stderr.on("data", (chunk) => output.push(String(chunk)));

  await new Promise<void>((resolve, reject) => {
    child.once("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Next build failed before smoke.\n${output.join("")}`));
    });
  });
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null) {
    return;
  }

  child.kill("SIGTERM");

  await new Promise<void>((resolve) => {
    const timeout = setTimeout(() => {
      if (child.exitCode === null) {
        child.kill("SIGKILL");
      }
      resolve();
    }, 5_000);

    child.once("exit", () => {
      clearTimeout(timeout);
      resolve();
    });
  });
}
