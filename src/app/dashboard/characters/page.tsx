"use client";

import { Box } from "@mui/material";
import { CharacterWorkspacePanel } from "@/components/dashboard/character-workspace-rail";

export default function CharactersPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <CharacterWorkspacePanel />
    </Box>
  );
}
