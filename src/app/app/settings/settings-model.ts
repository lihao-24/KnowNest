import type { PublicAIModelOption } from "@/lib/ai/config";

export const SETTINGS_APP_VERSION = "V0.1";
export const SETTINGS_FALLBACK_EMAIL = "邮箱未提供";
export const SETTINGS_LOGOUT_BUTTON_LABEL = "退出登录";
export const SETTINGS_LOGOUT_PENDING_LABEL = "退出中...";
export const SETTINGS_LOGOUT_BUTTON_MIN_HEIGHT_CLASS = "h-11";

type SettingsUser = {
  email: string | null;
};

export type SettingsAIViewModel = {
  defaultModelId: string;
  modelOptions: PublicAIModelOption[];
};

export type SettingsViewModel = {
  accountEmail: string;
  appVersion: string;
  logoutButtonLabel: string;
  logoutPendingLabel: string;
  logoutButtonMinHeightClass: string;
  ai: SettingsAIViewModel;
};

const EMPTY_AI_SETTINGS: SettingsAIViewModel = {
  defaultModelId: "",
  modelOptions: [],
};

export function getSettingsViewModel(
  user: SettingsUser,
  ai: SettingsAIViewModel = EMPTY_AI_SETTINGS,
): SettingsViewModel {
  const email = user.email?.trim();

  return {
    accountEmail: email || SETTINGS_FALLBACK_EMAIL,
    appVersion: SETTINGS_APP_VERSION,
    logoutButtonLabel: SETTINGS_LOGOUT_BUTTON_LABEL,
    logoutPendingLabel: SETTINGS_LOGOUT_PENDING_LABEL,
    logoutButtonMinHeightClass: SETTINGS_LOGOUT_BUTTON_MIN_HEIGHT_CLASS,
    ai: {
      defaultModelId: ai.defaultModelId.trim(),
      modelOptions: ai.modelOptions.map(({ id, label, provider, model }) => ({
        id,
        label,
        provider,
        model,
      })),
    },
  };
}
