export type MobileNavAction = "open" | "close" | "toggle";

export function getNextMobileNavOpenState(
  isOpen: boolean,
  action: MobileNavAction,
) {
  if (action === "open") {
    return true;
  }

  if (action === "close") {
    return false;
  }

  return !isOpen;
}

export function getMobileNavButtonLabel(isOpen: boolean) {
  return isOpen ? "关闭导航" : "打开导航";
}
