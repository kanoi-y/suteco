import { create } from "zustand";
import { getDb } from "@/lib/db/client";
import { MunicipalityRepository } from "@/lib/repositories/municipality-repository";

export type MunicipalityState = {
  selectedMunicipalityId: string | null;
  selectedMunicipalityName: string | null;
  datasetVersion: string | null;
};

export type MunicipalityActions = {
  setMunicipality: (params: {
    id: string;
    displayName: string;
    version: string;
  }) => void;
  loadMunicipality: (municipalityId: string) => Promise<void>;
  clearMunicipality: () => void;
};

const initialState: MunicipalityState = {
  selectedMunicipalityId: null,
  selectedMunicipalityName: null,
  datasetVersion: null,
};

export const useMunicipalityStore = create<MunicipalityState & MunicipalityActions>(
  (set) => ({
    ...initialState,
    setMunicipality: ({ id, displayName, version }) => {
      set({
        selectedMunicipalityId: id,
        selectedMunicipalityName: displayName,
        datasetVersion: version,
      });
    },
    loadMunicipality: async (municipalityId) => {
      const db = getDb();
      const repository = new MunicipalityRepository(db);
      const municipality = await repository.findById(municipalityId);
      if (municipality) {
        set({
          selectedMunicipalityId: municipality.id,
          selectedMunicipalityName: municipality.displayName,
          datasetVersion: municipality.version,
        });
      }
    },
    clearMunicipality: () => {
      set(initialState);
    },
  })
);
