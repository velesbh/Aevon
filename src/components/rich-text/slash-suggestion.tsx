"use client";

import type { SuggestionOptions } from "@tiptap/suggestion";
import tippy, { type Instance as TippyInstance } from "tippy.js";

export interface SlashCommandItem {
  title: string;
  description: string;
  icon: string;
  command: (props: { editor: any; range: any }) => void;
}

const SLASH_COMMANDS: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Big section heading",
    icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M4 12h16M4 18V6M20 18V6"></path></svg>`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 1 }).run();
    },
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M4 12h16M4 18V6M20 18V6"></path></svg>`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).setNode("heading", { level: 2 }).run();
    },
  },
  {
    title: "Bullet List",
    description: "Create a simple bulleted list",
    icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBulletList().run();
    },
  },
  {
    title: "Numbered List",
    description: "Create a list with numbering",
    icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><line x1="10" y1="6" x2="21" y2="6"></line><line x1="10" y1="12" x2="21" y2="12"></line><line x1="10" y1="18" x2="21" y2="18"></line><path d="M4 6h1v4"></path><path d="M4 10h2"></path><path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"></path></svg>`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleOrderedList().run();
    },
  },
  {
    title: "Blockquote",
    description: "Capture a quotation",
    icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).toggleBlockquote().run();
    },
  },
  {
    title: "Image",
    description: "Upload or insert an image",
    icon: `<svg viewBox="0 0 24 24" width="16" height="16" stroke="currentColor" stroke-width="2.5" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
    command: ({ editor, range }) => {
      editor.chain().focus().deleteRange(range).run();
      // Handle image upload logic externally or via custom event
      window.dispatchEvent(new CustomEvent("aevon:open-image-picker"));
    },
  },
];

function buildDropdown({
  items,
  selectedIndex,
  onSelect,
  onHover,
}: {
  items: SlashCommandItem[];
  selectedIndex: number;
  onSelect: (item: SlashCommandItem, index: number) => void;
  onHover: (index: number) => void;
}) {
  const container = document.createElement("div");
  container.className = "slash-dropdown p-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl max-h-[350px] overflow-y-auto flex flex-col min-w-[280px] outline-none";
  
  if (!items.length) {
    return { container, buttons: [] };
  }

  const header = document.createElement("div");
  header.className = "px-3 py-2 text-[10px] tracking-wider uppercase font-bold text-slate-400 dark:text-slate-500 border-b border-slate-50 dark:border-slate-800 mb-1";
  header.textContent = "Commands";
  container.appendChild(header);

  const buttons: HTMLButtonElement[] = [];
  items.forEach((item, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `slash-dropdown__item relative w-full text-left px-2.5 py-2 rounded-lg flex items-center gap-3 transition-all duration-200 outline-none border border-transparent ${
      index === selectedIndex ? "bg-slate-100 dark:bg-slate-800 ring-1 ring-slate-200 dark:ring-slate-700" : "hover:bg-slate-50 dark:hover:bg-slate-800/50"
    }`;
    
    button.innerHTML = `
      <div class="w-8 h-8 rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center shadow-sm">
        ${item.icon}
      </div>
      <div class="flex flex-col min-w-0 flex-1">
        <span class="font-semibold text-[13px] text-slate-900 dark:text-slate-100 truncate block">${item.title}</span>
        <p class="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">${item.description}</p>
      </div>
    `;
    
    button.addEventListener("mouseenter", () => onHover(index));
    button.addEventListener("click", () => onSelect(item, index));
    buttons.push(button);
    container.appendChild(button);
  });

  return { container, buttons };
}

export function createSlashSuggestion(): Omit<SuggestionOptions, "editor"> {
  let popup: TippyInstance | null = null;
  let activeIndex = 0;

  return {
    char: "/",
    items: ({ query }) => {
      return SLASH_COMMANDS.filter(item => 
        item.title.toLowerCase().startsWith(query.toLowerCase()) ||
        item.description.toLowerCase().includes(query.toLowerCase())
      );
    },
    render() {
      let buttons: HTMLButtonElement[] = [];
      let cachedItems: SlashCommandItem[] = [];

      return {
        onStart: (props) => {
          activeIndex = 0;
          cachedItems = props.items as SlashCommandItem[];
          const { container, buttons: builtButtons } = buildDropdown({
            items: cachedItems,
            selectedIndex: activeIndex,
            onSelect: (item) => props.command(item),
            onHover: (index) => {
              activeIndex = index;
              buttons.forEach((b, i) => {
                if (i === index) {
                  b.classList.add("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
                  b.scrollIntoView({ block: "nearest" });
                } else {
                  b.classList.remove("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
                }
              });
            },
          });
          buttons = builtButtons;

          popup = tippy("body", {
            getReferenceClientRect: props.clientRect as () => DOMRect,
            content: container,
            showOnCreate: true,
            interactive: true,
            trigger: "manual",
            placement: "bottom-start",
            theme: "light-border",
          })[0];
        },
        onUpdate(props) {
          cachedItems = props.items as SlashCommandItem[];
          if (!popup) return;
          
          popup.setProps({ getReferenceClientRect: props.clientRect as () => DOMRect });
          const { container, buttons: builtButtons } = buildDropdown({
            items: cachedItems,
            selectedIndex: activeIndex,
            onSelect: (item) => props.command(item),
            onHover: (index) => {
              activeIndex = index;
              buttons.forEach((b, i) => {
                if (i === index) {
                  b.classList.add("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
                  b.scrollIntoView({ block: "nearest" });
                } else {
                  b.classList.remove("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
                }
              });
            },
          });
          buttons = builtButtons;
          if (popup.popper.firstChild) popup.popper.firstChild.remove();
          popup.popper.appendChild(container);
        },
        onKeyDown(props: any) {
          if (props.event.key === "Escape") {
            popup?.hide();
            return true;
          }
          if (props.event.key === "ArrowDown") {
            activeIndex = (activeIndex + 1) % buttons.length;
            buttons.forEach((b, i) => {
              if (i === activeIndex) {
                b.classList.add("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
                b.scrollIntoView({ block: "nearest" });
              } else {
                b.classList.remove("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
              }
            });
            return true;
          }
          if (props.event.key === "ArrowUp") {
            activeIndex = (activeIndex - 1 + buttons.length) % buttons.length;
            buttons.forEach((b, i) => {
              if (i === activeIndex) {
                b.classList.add("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
                b.scrollIntoView({ block: "nearest" });
              } else {
                b.classList.remove("bg-slate-100", "dark:bg-slate-800", "ring-1", "ring-slate-200", "dark:ring-slate-700");
              }
            });
            return true;
          }
          if (props.event.key === "Enter") {
            props.command(cachedItems[activeIndex]);
            return true;
          }
          return false;
        },
        onExit() {
          popup?.destroy();
          popup = null;
        },
      };
    },
  };
}
