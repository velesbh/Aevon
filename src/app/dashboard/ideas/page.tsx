"use client";

import { Box } from "@mui/material";
import { IdeasWorkspace } from "@/components/dashboard/ideas-workspace";

export default function IdeasPage() {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", flexGrow: 1, minHeight: 0 }}>
      <IdeasWorkspace />
    </Box>
  );
}
