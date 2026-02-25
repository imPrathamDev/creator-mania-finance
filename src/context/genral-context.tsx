"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  memo,
} from "react";
import { GeneralContextType } from "@/types/context";

const GeneralContext = createContext<GeneralContextType>({
  openSmartSearch: false,
  setOpenSmartSearch: () => {},
});

interface GeneralProviderProps {
  children: ReactNode;
}

export const GeneralProvider: React.FC<GeneralProviderProps> = memo(
  ({ children }) => {
    const [openSmartSearch, setOpenSmartSearch] = useState(false);

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
