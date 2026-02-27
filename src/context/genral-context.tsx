"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  memo,
} from "react";
import { GeneralContextType } from "@/types/context";

const defaultValues: GeneralContextType = {
  openSmartSearch: false,
  setOpenSmartSearch: () => {},
  settings: {
    field: {},
    model: "gpt-4o",
    is_millify_number: false,
  },
  setSettings: (data) => {},
};

const GeneralContext = createContext<GeneralContextType>(defaultValues);

interface GeneralProviderProps {
  children: ReactNode;
}

export const GeneralProvider: React.FC<GeneralProviderProps> = memo(
  ({ children }) => {
    const [openSmartSearch, setOpenSmartSearch] = useState(false);
    const [settings, setSettings] = useState(
      typeof window !== "undefined"
        ? JSON.parse(localStorage.getItem("settings") ?? "{}")
        : defaultValues.settings,
    );

    React.useEffect(() => {
      if (settings) {
        localStorage.setItem("settings", JSON.stringify(settings));
      }
    }, [settings]);

    React.useEffect(() => {
      const down = (e: KeyboardEvent) => {
        if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
          e.preventDefault();
          setOpenSmartSearch((open) => !open);
        }
      };

      document.addEventListener("keydown", down);
      return () => document.removeEventListener("keydown", down);
    }, []);

    return (
      <GeneralContext.Provider
        value={{
          openSmartSearch,
          setOpenSmartSearch,
          setSettings,
          settings,
        }}
      >
        {children}
      </GeneralContext.Provider>
    );
  },
);

export const useGeneralStore = () => {
  const context = useContext(GeneralContext);
  if (context === undefined) {
    throw new Error("useGeneralStore must be used within a GeneralProvider");
  }
  return context;
};
