import type { Metadata } from "next";
import { Approvals } from "./approvals";

export const metadata: Metadata = { title: "Persetujuan Cuti" };

export default function ApprovalsPage() {
  return <Approvals />;
}
