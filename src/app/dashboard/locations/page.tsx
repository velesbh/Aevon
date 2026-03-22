"use client";

import { MapPinned } from "lucide-react";
import { WorldElementPage } from "@/components/dashboard/world-element-page";

export default function LocationsPage() {
  return (
    <WorldElementPage
      type="location"
      title="Locations"
      icon={MapPinned}
      metaKey="region"
      metaLabel="Region"
    />
  );
}
