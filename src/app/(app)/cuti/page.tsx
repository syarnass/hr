import type { Metadata } from "next";
import { MyLeaves } from "./my-leaves";

export const metadata: Metadata = { title: "Cuti Saya" };

export default function MyLeavesPage() {
  return <MyLeaves />;
}
