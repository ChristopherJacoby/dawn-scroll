import { describe, expect, it } from "vitest";
import { describeDistance, describeTravel, estimateTravel } from "./travel";

describe("estimateTravel", () => {
    it("estimates days on foot with roads longer than the straight line", () => {
        // Nazareth to Bethlehem: 111 km straight, about 139 km by road.
        const e = estimateTravel([{ km: 111, by: "foot" }]);
        expect(e).toMatchObject({ unit: "days", min: 4, max: 6 });
        expect(describeTravel(e)).toBe("About 4–6 days on foot");
    });

    it("gives hours for a walk shorter than a day", () => {
        const e = estimateTravel([
            { km: 7, by: "foot" },
            { km: 7, by: "foot" },
        ]);
        expect(e.unit).toBe("hours");
        expect(describeTravel(e)).toBe("About 4 hours on foot");
    });

    it("mixes land and sea, and doesn't lengthen sea legs", () => {
        const e = estimateTravel([
            { km: 90, by: "ship" },
            { km: 100, by: "foot" },
        ]);
        expect(e.modes).toEqual(["ship", "foot"]);
        expect(describeTravel(e)).toBe("About 4–6 days by ship and on foot");
    });

    it("moves slowly with flocks", () => {
        expect(estimateTravel([{ km: 100, by: "flocks" }])).toMatchObject({
            min: 8,
            max: 13,
        });
    });
});

describe("describeDistance", () => {
    it("rounds long distances and gives miles", () => {
        expect(describeDistance(111)).toBe("110 km (69 miles)");
        expect(describeDistance(14)).toBe("14 km (9 miles)");
    });
});
