import { describe, test, expect } from "vitest";

describe("Configuration des tests backend", () => {
  test("doit exécuter correctement un test Node.js", () => {
    expect(10 + 5).toBe(15);
  });

  test("doit pouvoir manipuler des objets JavaScript", () => {
    const compte = {
      id: 1,
      role: "administrateur",
      isArchived: false,
    };

    expect(compte.role).toBe("administrateur");
    expect(compte.isArchived).toBe(false);
  });
});
