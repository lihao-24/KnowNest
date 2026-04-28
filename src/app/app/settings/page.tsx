import { requireUser } from "@/lib/auth/server";

import { getSettingsViewModel } from "./settings-model";
import { SettingsPanel } from "./settings-panel";

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = getSettingsViewModel(user);

  return (
    <section className="min-w-0 w-full max-w-3xl">
      <div className="mb-8 min-w-0">
        <p className="text-sm font-medium text-teal-700">设置</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-normal sm:text-3xl">
          KnowNest
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          查看当前账号与版本信息，或退出当前会话。
        </p>
      </div>

      <SettingsPanel settings={settings} />
    </section>
  );
}
