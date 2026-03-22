"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { useDashboardWorkspace } from "@/components/dashboard/workspace-provider";
import { Check, ChevronsUpDown, BookOpen, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoreAttachmentPickerProps {
  attachedLoreIds: string[];
  onChange: (ids: string[]) => void;
}

export function LoreAttachmentPicker({ attachedLoreIds, onChange }: LoreAttachmentPickerProps) {
  const { t } = useTranslation();
  const { worldElements } = useDashboardWorkspace();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const loreElements = useMemo(() => {
    return worldElements.filter((el) => el.type === "lore");
  }, [worldElements]);

  const filteredLore = useMemo(() => {
    if (!search.trim()) return loreElements;
    return loreElements.filter(l => l.name.toLowerCase().includes(search.toLowerCase()));
  }, [loreElements, search]);

  const toggleLore = (id: string) => {
    if (attachedLoreIds.includes(id)) {
      onChange(attachedLoreIds.filter(i => i !== id));
    } else {
      onChange([...attachedLoreIds, id]);
    }
  };

  const removeLore = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(attachedLoreIds.filter(i => i !== id));
  };

  const attachedLore = loreElements.filter(l => attachedLoreIds.includes(l.id));

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2 mb-1">
        {attachedLore.map(lore => (
          <div key={lore.id} className="flex items-center gap-1 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md text-xs font-medium border border-emerald-500/20">
            <BookOpen className="w-3 h-3" />
            <span>{lore.name || t("common.untitled")}</span>
            <button onClick={(e) => removeLore(lore.id, e)} className="hover:text-emerald-900 dark:hover:text-emerald-200 ml-1">
              <X className="w-3 h-3" />
            </button>
          </div>
        ))}
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between rounded-xl border border-[var(--border-ui)] bg-[var(--background-app)] px-3 py-2 text-sm text-[var(--text-primary)] shadow-sm hover:border-emerald-500/50 transition-colors"
        >
          <span className="text-[var(--text-tertiary)]">Attach Lore...</span>
          <ChevronsUpDown className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>

        {open && (
          <div className="absolute z-50 w-full mt-1 bg-[var(--background-app)] border border-[var(--border-ui)] rounded-xl shadow-lg flex flex-col max-h-[250px] overflow-hidden">
            <input
              type="text"
              placeholder="Search lore..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full px-3 py-2 border-b border-[var(--border-ui)] bg-transparent text-sm outline-none"
            />
            <div className="overflow-y-auto p-1 custom-scrollbar">
              {filteredLore.length === 0 ? (
                <div className="p-3 text-center text-sm text-[var(--text-tertiary)]">No lore found.</div>
              ) : (
                filteredLore.map((lore) => {
                  const isSelected = attachedLoreIds.includes(lore.id);
                  return (
                    <button
                      key={lore.id}
                      onClick={() => toggleLore(lore.id)}
                      className={cn(
                        "w-full flex items-center justify-between px-3 py-2 text-sm rounded-lg hover:bg-[var(--background-surface)] transition-colors text-left",
                        isSelected && "text-emerald-600 dark:text-emerald-400 font-medium"
                      )}
                    >
                      <span>{lore.name || t("common.untitled")}</span>
                      {isSelected && <Check className="w-4 h-4" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}
      </div>

      {open && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setOpen(false)} 
        />
      )}
    </div>
  );
}
