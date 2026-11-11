<?php

namespace App\Http\Controllers;

use App\Enums\WorkspaceRole;
use App\Http\Requests\Workspace\UpdateMemberRoleRequest;
use App\Models\User;
use App\Models\Workspace;
use App\Models\WorkspaceMember;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;

class WorkspaceMemberController extends Controller
{
    /**
     * Update the role of a workspace member (admin <-> member).
     */
    public function update(UpdateMemberRoleRequest $request, Workspace $workspace, WorkspaceMember $member): RedirectResponse
    {
        Gate::authorize('manageMemberRole', [$workspace, $member]);

        /** @var array{role: string} $validated */
        $validated = $request->validated();

        $member->update([
            'role' => WorkspaceRole::from($validated['role']),
        ]);

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Member role updated successfully.');
    }

    /**
     * Remove a member from the group workspace.
     */
    public function destroy(Workspace $workspace, WorkspaceMember $member): RedirectResponse
    {
        Gate::authorize('removeMember', [$workspace, $member]);

        $member->delete();

        return redirect()
            ->route('workspaces.show', $workspace)
            ->with('success', 'Member removed from workspace.');
    }

    /**
     * Leave the specified group workspace.
     */
    public function leave(Request $request, Workspace $workspace): RedirectResponse
    {
        Gate::authorize('leave', $workspace);

        /** @var User $user */
        $user = $request->user();

        /** @var WorkspaceMember|null $userMember */
        $userMember = $workspace->memberships()
            ->where('user_id', $user->id)
            ->first();

        if ($userMember instanceof WorkspaceMember) {
            $userMember->delete();
        }

        return redirect()
            ->route('workspaces.index')
            ->with('success', sprintf('You have left %s.', $workspace->name));
    }
}
