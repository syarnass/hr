import type { Metadata } from "next";
import { NewEmployeeForm } from "./new-employee-form";

export const metadata: Metadata = { title: "Tambah Karyawan" };

export default function NewEmployeePage() {
  return <NewEmployeeForm />;
}
