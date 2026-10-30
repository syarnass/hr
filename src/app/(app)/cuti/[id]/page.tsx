import type { Metadata } from "next";
import { LeaveDetail } from "./leave-detail";

export const metadata: Metadata = { title: "Detail Cuti" };

export default function LeaveDetailPage() {
  return <LeaveDetail />;
}
