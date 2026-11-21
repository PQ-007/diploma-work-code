import { notFound } from "next/navigation";
import { currentUserIsStaff } from "@/lib/api/competitions";

/** Organizers only; everyone else gets the normal 404 (the API also answers 403). */
export default async function NewCompetitionLayout({ children }: LayoutProps<"/competition/new">) {
  if (!(await currentUserIsStaff())) notFound();
  return children;
}
