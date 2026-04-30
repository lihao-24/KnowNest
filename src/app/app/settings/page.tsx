import { requireUser } from "@/lib/auth/server";
import { getPublicAIModelOptions, readAIModelRegistry } from "@/lib/ai/config";

import { getSettingsViewModel } from "./settings-model";
import { SettingsPanel } from "./settings-panel";

export default async function SettingsPage() {
  const user = await requireUser();
  const registry = readAIModelRegistry();
  const settings = getSettingsViewModel(user, {
    defaultModelId: registry.defaultModelId,
    modelOptions: getPublicAIModelOptions(registry),
  });

  return (
    <section className="min-w-0 w-full max-w-3xl">
      <div className="mb-8 min-w-0">
        <p className="text-sm font-medium text-teal-700">设置</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          KnowNest
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          查看当前账号、版本信息与本机 AI 模型偏好，或退出当前会话。
        </p>
      </div>

      <SettingsPanel settings={settings} />
    </section>
  );
}
