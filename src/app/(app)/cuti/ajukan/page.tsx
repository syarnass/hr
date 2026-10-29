import type { Metadata } from "next";
import { LeaveRequestForm } from "./leave-request-form";

export const metadata: Metadata = { title: "Ajukan Cuti" };

export default function NewLeavePage() {
  return <LeaveRequestForm />;
}
