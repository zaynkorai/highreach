import { getTeamData } from "./actions";
import { TeamClient } from "./team-client";

export default async function TeamPage() {
    const teamData = await getTeamData();

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/[0.08] rounded-2xl shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-zinc-100 dark:border-white/[0.08] bg-zinc-50/50 dark:bg-white/[0.02]">
                    <h2 className="text-lg font-bold text-foreground">Team Members</h2>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400">
                        Manage your team and control access to your workspace.
                    </p>
                </div>
                <div className="p-6">
                    <TeamClient
                        members={teamData.members}
                        invitations={teamData.invitations}
                        currentUserId={teamData.currentUserId}
                        currentRole={teamData.currentRole}
                    />
                </div>
            </div>
        </div>
    );
}
