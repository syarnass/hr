import type { Metadata } from "next";
import { EmployeeDetail } from "./employee-detail";

export const metadata: Metadata = { title: "Detail Karyawan" };

export default function EmployeeDetailPage() {
  return <EmployeeDetail />;
}
