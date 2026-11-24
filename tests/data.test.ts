import { expect, test } from "vitest";
import { validateData } from "../scripts/validate-data";
test("dados válidos", () => { expect(validateData()).toEqual([]); });
