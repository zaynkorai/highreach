import { redirect } from "next/navigation";
import { getUserProfile } from "../actions";
import { AccountClient } from "./account-client";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
    const user = await getUserProfile();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="space-y-6">
            <AccountClient initialUser={user} />
        </div>
    );
}
