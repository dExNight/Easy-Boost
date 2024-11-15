interface BoostJettonMapping {
  [boostAddress: string]: string; // Maps boost address to jetton address
}

const STORAGE_KEY = "boost_jetton_mappings";

export const boostStorageService = {
  saveBoostJettonMapping(boostAddress: string, jettonAddress: string): void {
    const existingData = this.getAllMappings();
    const updatedData = {
      ...existingData,
      [boostAddress]: jettonAddress,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedData));
  },

  getJettonAddress(boostAddress: string): string | null {
    const mappings = this.getAllMappings();
    return mappings[boostAddress] || null;
  },

  getAllMappings(): BoostJettonMapping {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  },

  removeMapping(boostAddress: string): void {
    const existingData = this.getAllMappings();
    delete existingData[boostAddress];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(existingData));
  },

  clearAllMappings(): void {
    localStorage.removeItem(STORAGE_KEY);
  },
};
