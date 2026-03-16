import { useEffect, useState } from "react";
import { loadWorkspaceMembers } from "../utils/workspace";

function useWorkspaceMembers() {
  const [members, setMembers] = useState(() => loadWorkspaceMembers());

  useEffect(() => {
    const syncMembers = () => setMembers(loadWorkspaceMembers());
    window.addEventListener("storage", syncMembers);
    window.addEventListener("workspace-members-updated", syncMembers);
    return () => {
      window.removeEventListener("storage", syncMembers);
      window.removeEventListener("workspace-members-updated", syncMembers);
    };
  }, []);

  return members;
}

export default useWorkspaceMembers;
