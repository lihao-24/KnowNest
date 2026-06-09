import type { StatusKind } from "@/lib/chat/types";

const statusClassName: Record<StatusKind, string> = {
  数据未导入: "statusPill statusPill--missing-data",
  资料未全: "statusPill statusPill--incomplete",
  待确认: "statusPill statusPill--confirm",
  待核验: "statusPill statusPill--verify",
  可用: "statusPill statusPill--ready"
};

export function StatusPill({ status }: { status: StatusKind }) {
  return <span className={statusClassName[status]}>{status}</span>;
}
