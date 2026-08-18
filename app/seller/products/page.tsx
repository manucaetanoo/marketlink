import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import SellerProductsPage from "./SellerProductsPage";

export default async function Page() {
  const session = await getServerSession(authOptions);
  const role = String(session?.user?.role ?? "").toUpperCase();

  if (!session?.user?.id || (role !== "SELLER" && role !== "ADMIN")) {
    redirect("/login");
  }

  if (role === "SELLER" && !session.user.storeSlug) {
    redirect("/onboarding/seller");
  }

  return <SellerProductsPage />;
}
