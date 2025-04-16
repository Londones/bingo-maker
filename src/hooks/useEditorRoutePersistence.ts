import { Bingo } from "@/types/types";
import { usePathname } from "next/navigation";

const safeStorage = {
  get: (key: string) => {
    if (typeof window === "undefined") return null;
    try {
      const item = localStorage.getItem(key);
      return item ? (JSON.parse(item) as Bingo) : null;
    } catch (e) {
      console.error("Error reading from localStorage", e);
      return null;
    }
  },
  set: (key: string, value: Bingo) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error("Error writing to localStorage", e);
    }
  },
};

export const useEditorRoutePersistence = () => {
  const pathname = usePathname();
  const isMainEditorPage = pathname === "/editor";

  return {
    isMainEditorPage,
    saveEditorState: (state: Bingo) => {
      if (!state) return;
      safeStorage.set("editor_main_state", state);
    },
    loadEditorState: () => {
      return safeStorage.get("editor_main_state");
    },
  };
};
