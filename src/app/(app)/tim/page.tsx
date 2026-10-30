import type { Metadata } from "next";
import { Team } from "./team";

export const metadata: Metadata = { title: "Tim Saya" };

export default function TeamPage() {
  return <Team />;
}
