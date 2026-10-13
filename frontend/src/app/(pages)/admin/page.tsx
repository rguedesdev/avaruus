import type { Metadata } from "next";
import { AdminCatalog } from "@/features/admin/AdminCatalog";

export const metadata: Metadata = { title: "Administração do catálogo | Avaruus" };

export default function AdminPage() {
  return <AdminCatalog />;
}
