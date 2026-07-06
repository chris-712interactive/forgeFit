import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  SPORTS_CATALOG,
  SPORTS_CATALOG_VERSION,
  getSportById,
  getSportsByCategory,
  isValidSportId,
  isValidSportPositionId,
} from "./sports-catalog";

const PHASE_9H_SPORTS = [
  "wrestling",
  "swimming",
  "competitive_cheer",
  "lacrosse_boys",
  "lacrosse_girls",
  "track_field",
  "flag_football",
  "water_polo",
  "rowing",
] as const;

describe("sports catalog", () => {
  it("is version 1.2.0 with at least 20 US sports", () => {
    assert.equal(SPORTS_CATALOG_VERSION, "1.2.0");
    assert.ok(SPORTS_CATALOG.sports.length >= 20);
  });

  it("includes Phase 9H target sports and track sub-events", () => {
    for (const sportId of PHASE_9H_SPORTS) {
      assert.ok(isValidSportId(sportId), `missing sport: ${sportId}`);
    }

    const track = getSportById("track_field");
    assert.ok(track?.positionAffectsProgram);
    assert.ok(track!.positions.length >= 4);
    assert.ok(
      track!.positions.some((position) => position.id === "sprints"),
      "track sprints sub-event"
    );
    assert.ok(
      track!.positions.some((position) => position.id === "throws"),
      "track throws sub-event"
    );
  });

  it("maps every sport to a known category", () => {
    const categoryIds = new Set(SPORTS_CATALOG.categories.map((c) => c.id));
    for (const sport of SPORTS_CATALOG.sports) {
      assert.ok(categoryIds.has(sport.categoryId), sport.id);
    }
  });

  it("validates position ids for sports that require them", () => {
    for (const sport of SPORTS_CATALOG.sports) {
      if (!sport.positionAffectsProgram || sport.positions.length === 0) continue;
      for (const position of sport.positions) {
        assert.ok(
          isValidSportPositionId(sport.id, position.id),
          `${sport.id}/${position.id}`
        );
      }
    }
  });

  it("lists aquatic sports in the aquatic category", () => {
    const aquatic = getSportsByCategory("aquatic").map((sport) => sport.id);
    assert.ok(aquatic.includes("swimming"));
    assert.ok(aquatic.includes("water_polo"));
    assert.ok(aquatic.includes("rowing"));
  });
});
