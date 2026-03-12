import { useMunicipalityStore, type MunicipalityState } from '@/stores/municipality-store';

const mockFindById = jest.fn();
jest.mock('@/lib/repositories/municipality-repository', () => ({
  MunicipalityRepository: jest.fn().mockImplementation(() => ({
    findById: mockFindById,
  })),
}));

const initialState: MunicipalityState = {
  selectedMunicipalityId: null,
  selectedMunicipalityName: null,
  datasetVersion: null,
};

function resetStore(): void {
  useMunicipalityStore.setState(initialState);
}

describe('municipalityStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetStore();
  });

  describe('初期状態', () => {
    it('selectedMunicipalityId, selectedMunicipalityName, datasetVersion が null であること', () => {
      const state = useMunicipalityStore.getState();
      expect(state.selectedMunicipalityId).toBeNull();
      expect(state.selectedMunicipalityName).toBeNull();
      expect(state.datasetVersion).toBeNull();
    });
  });

  describe('setMunicipality', () => {
    it('渡した id, displayName, version が状態に反映されること', () => {
      const { setMunicipality } = useMunicipalityStore.getState();
      setMunicipality({
        id: 'akita-yokote',
        displayName: '秋田県横手市',
        version: '2026-03-01',
      });

      const state = useMunicipalityStore.getState();
      expect(state.selectedMunicipalityId).toBe('akita-yokote');
      expect(state.selectedMunicipalityName).toBe('秋田県横手市');
      expect(state.datasetVersion).toBe('2026-03-01');
    });
  });

  describe('clearMunicipality', () => {
    it('状態が初期化されること', () => {
      const { setMunicipality, clearMunicipality } = useMunicipalityStore.getState();
      setMunicipality({
        id: 'akita-yokote',
        displayName: '秋田県横手市',
        version: '2026-03-01',
      });

      clearMunicipality();

      const state = useMunicipalityStore.getState();
      expect(state.selectedMunicipalityId).toBeNull();
      expect(state.selectedMunicipalityName).toBeNull();
      expect(state.datasetVersion).toBeNull();
    });
  });

  describe('loadMunicipality', () => {
    it('municipalityId に対応する自治体情報がストアに復元されること', async () => {
      mockFindById.mockResolvedValue({
        id: 'akita-yokote',
        displayName: '秋田県横手市',
        version: '2026-03-01',
      });

      const { loadMunicipality } = useMunicipalityStore.getState();
      await loadMunicipality('akita-yokote');

      const state = useMunicipalityStore.getState();
      expect(state.selectedMunicipalityId).toBe('akita-yokote');
      expect(state.selectedMunicipalityName).toBe('秋田県横手市');
      expect(state.datasetVersion).toBe('2026-03-01');
    });

    it('該当する自治体が見つからない場合、選択状態がクリアされること', async () => {
      const { setMunicipality } = useMunicipalityStore.getState();
      setMunicipality({
        id: 'previous-city',
        displayName: '前の市',
        version: '2026-01-01',
      });

      mockFindById.mockResolvedValue(null);

      const { loadMunicipality } = useMunicipalityStore.getState();
      await loadMunicipality('not-found-city');

      const state = useMunicipalityStore.getState();
      expect(state.selectedMunicipalityId).toBeNull();
      expect(state.selectedMunicipalityName).toBeNull();
      expect(state.datasetVersion).toBeNull();
    });
  });
});
