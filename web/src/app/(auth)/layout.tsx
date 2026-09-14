import { getSessionWithRole } from "@/lib/auth/session";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSessionWithRole();

    if (session) {
        redirect("/dashboard");
    }

    return <>{children}</>;
}
