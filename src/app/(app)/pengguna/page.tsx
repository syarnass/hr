import type { Metadata } from "next";
import { Users } from "./users";

export const metadata: Metadata = { title: "Pengguna" };

export default function UsersPage() {
  return <Users />;
}
