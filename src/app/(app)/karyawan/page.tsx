import type { Metadata } from "next";
import { EmployeeList } from "./employee-list";

export const metadata: Metadata = { title: "Karyawan" };

export default function EmployeesPage() {
  return <EmployeeList />;
}
