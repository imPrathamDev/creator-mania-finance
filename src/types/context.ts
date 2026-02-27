export type Settings = {
    is_millify_number?: boolean;
    model: "gpt-4o";
    field: {
        invoice_number?: boolean;
        reference_number?: boolean;
        receipt_url?: boolean;
    };
};

export interface GeneralContextType {
    setOpenSmartSearch: React.Dispatch<React.SetStateAction<boolean>>;
    openSmartSearch: boolean;
    setSettings: React.Dispatch<React.SetStateAction<Settings>>;
    settings: Settings;
}
