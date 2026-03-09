import type * as SQLite from "expo-sqlite";
import { MunicipalityRepository } from "@/lib/repositories/municipality-repository";
import type { Municipality } from "@/schema/municipality-dataset-schema";
import { openTestDb } from "../../helpers/db";

function createMunicipality(overrides?: Partial<Municipality>): Municipality {
  return {
    id: "test-city",
    displayName: "テスト市",
    version: "2025-01-01",
    ...overrides,
  };
}

describe("MunicipalityRepository", () => {
  let expoDb: SQLite.SQLiteDatabase;
  let repository: MunicipalityRepository;

  beforeEach(async () => {
    const { expoDb: db, db: drizzleDb } = await openTestDb("municipality_repo");
    expoDb = db;
    repository = new MunicipalityRepository(drizzleDb);
  });

  afterEach(async () => {
    await expoDb.closeAsync();
  });

  describe("save", () => {
    it("自治体を保存できる", async () => {
      const municipality = createMunicipality();
      await repository.save(municipality);

      const found = await repository.findById(municipality.id);
      expect(found).toEqual(municipality);
    });

    it("同じIDで上書き保存できる", async () => {
      await repository.save(createMunicipality({ version: "2025-01-01" }));
      await repository.save(
        createMunicipality({ version: "2025-06-01", displayName: "テスト市（更新）" })
      );

      const found = await repository.findById("test-city");
      expect(found?.version).toBe("2025-06-01");
      expect(found?.displayName).toBe("テスト市（更新）");
    });
  });

  describe("findById", () => {
    it("存在するIDで取得できる", async () => {
      const municipality = createMunicipality({ id: "city-a" });
      await repository.save(municipality);

      const found = await repository.findById("city-a");
      expect(found).toEqual(municipality);
    });

    it("存在しないIDでは null を返す", async () => {
      const found = await repository.findById("not-exists");
      expect(found).toBeNull();
    });
  });

  describe("findAll", () => {
    it("全件取得できる", async () => {
      await repository.save(createMunicipality({ id: "city-a" }));
      await repository.save(
        createMunicipality({ id: "city-b", displayName: "テスト町" })
      );

      const all = await repository.findAll();
      expect(all).toHaveLength(2);
      expect(all.map((m) => m.id)).toEqual(
        expect.arrayContaining(["city-a", "city-b"])
      );
    });

    it("0件の場合は空配列を返す", async () => {
      const all = await repository.findAll();
      expect(all).toEqual([]);
    });
  });
});
