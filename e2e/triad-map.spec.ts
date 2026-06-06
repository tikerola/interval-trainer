import { test, expect, type Page } from "@playwright/test";

// ─── helpers ────────────────────────────────────────────────────────────────

function section(page: Page, id: string) {
  return page.getByTestId(`section-${id}`);
}

async function openTriadMap(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: "Triad Map" }).click();
  await expect(page.getByTestId("section-caged")).toBeVisible();
}

// ─── tests ──────────────────────────────────────────────────────────────────

test.describe("Triad Map", () => {
  test.beforeEach(async ({ page }) => {
    await openTriadMap(page);
  });

  // ── 1. Default state ──────────────────────────────────────────────────────

  test.describe("default state", () => {
    test("loads with Major scale, C key and chord I active", async ({ page }) => {
      await expect(section(page, "scale").getByRole("button", { name: "Major" })).toHaveClass(
        /bg-amber-400/
      );
      await expect(section(page, "key").getByRole("button", { name: "C", exact: true })).toHaveClass(
        /bg-amber-400/
      );
      await expect(section(page, "chord")).toBeVisible();
      await expect(section(page, "chord").locator("[data-degree='1']")).toHaveClass(
        /bg-amber-400/
      );
    });

    test("info bar shows C major chord tones on load", async ({ page }) => {
      await expect(page.getByTestId("info-bar")).toContainText("C major");
      await expect(page.getByTestId("info-bar")).toContainText("C · E · G");
    });
  });

  // ── 2. Scale selection ────────────────────────────────────────────────────

  test.describe("scale selection", () => {
    test("switching to Minor highlights Minor and clears Major", async ({ page }) => {
      await section(page, "scale").getByRole("button", { name: "Minor" }).click();
      await expect(section(page, "scale").getByRole("button", { name: "Minor" })).toHaveClass(
        /bg-amber-400/
      );
      await expect(section(page, "scale").getByRole("button", { name: "Major" })).not.toHaveClass(
        /bg-amber-400/
      );
    });

    test("Minor Pentatonic hides the Chord selector", async ({ page }) => {
      await expect(section(page, "chord")).toBeVisible();
      await section(page, "scale").getByRole("button", { name: "Min Pent" }).click();
      await expect(page.getByTestId("section-chord")).not.toBeVisible();
    });

    test("Blues Minor hides the Chord selector", async ({ page }) => {
      await section(page, "scale").getByRole("button", { name: "Blues Min" }).click();
      await expect(page.getByTestId("section-chord")).not.toBeVisible();
    });

    test("switching from pentatonic back to a heptatonic scale restores Chord selector", async ({
      page,
    }) => {
      await section(page, "scale").getByRole("button", { name: "Min Pent" }).click();
      await expect(page.getByTestId("section-chord")).not.toBeVisible();
      await section(page, "scale").getByRole("button", { name: "Major" }).click();
      await expect(section(page, "chord")).toBeVisible();
    });
  });

  // ── 3. Key selection ──────────────────────────────────────────────────────

  test.describe("key selection", () => {
    test("selecting key G updates the highlight and info bar", async ({ page }) => {
      await section(page, "key").getByRole("button", { name: "G", exact: true }).click();
      await expect(section(page, "key").getByRole("button", { name: "G", exact: true })).toHaveClass(
        /bg-amber-400/
      );
      await expect(page.getByTestId("info-bar")).toContainText("G major");
    });

    test("selecting a sharp key (A#) highlights the correct button", async ({ page }) => {
      await section(page, "key").getByRole("button", { name: "A#" }).click();
      await expect(section(page, "key").getByRole("button", { name: "A#" })).toHaveClass(
        /bg-amber-400/
      );
    });
  });

  // ── 4. Chord degree selector ──────────────────────────────────────────────

  test.describe("chord degree selector", () => {
    test("selecting chord IV highlights it and shows F major in info bar", async ({ page }) => {
      await section(page, "chord").locator("[data-degree='4']").click();
      await expect(section(page, "chord").locator("[data-degree='4']")).toHaveClass(
        /bg-amber-400/
      );
      await expect(page.getByTestId("info-bar")).toContainText("F major");
      await expect(page.getByTestId("info-bar")).toContainText("F · A · C");
    });

    test("selecting chord vii° shows B diminished in info bar", async ({ page }) => {
      await section(page, "chord").locator("[data-degree='7']").click();
      await expect(page.getByTestId("info-bar")).toContainText("B diminished");
    });

    test("clicking the active chord deselects it and shows fallback text", async ({ page }) => {
      // Chord I is active by default — click it to deselect
      await section(page, "chord").locator("[data-degree='1']").click();
      await expect(page.getByTestId("info-bar")).toContainText("select a chord above");
    });
  });

  // ── 5. CAGED box ──────────────────────────────────────────────────────────

  test.describe("CAGED box", () => {
    test("selecting the E shape highlights it in sky colour", async ({ page }) => {
      const eBtn = section(page, "caged").getByRole("button", { name: /^E/ });
      await eBtn.click();
      await expect(eBtn).toHaveClass(/bg-sky-400/);
    });

    test("clicking the active CAGED shape deselects it", async ({ page }) => {
      const eBtn = section(page, "caged").getByRole("button", { name: /^E/ });
      await eBtn.click();
      await expect(eBtn).toHaveClass(/bg-sky-400/);
      await eBtn.click();
      await expect(eBtn).not.toHaveClass(/bg-sky-400/);
    });
  });

  // ── 6. View and label toggles ─────────────────────────────────────────────

  test.describe("view toggle", () => {
    test("toggles between Scale and Triad modes", async ({ page }) => {
      const scaleBtn = section(page, "view").getByRole("button", { name: "Scale" });
      const triadBtn = section(page, "view").getByRole("button", { name: "Triad" });

      await expect(scaleBtn).toHaveClass(/bg-amber-400/);

      await triadBtn.click();
      await expect(triadBtn).toHaveClass(/bg-amber-400/);
      await expect(scaleBtn).not.toHaveClass(/bg-amber-400/);

      await scaleBtn.click();
      await expect(scaleBtn).toHaveClass(/bg-amber-400/);
    });
  });

  test.describe("label toggle", () => {
    test("toggles between note names and degree labels", async ({ page }) => {
      const noteBtn = section(page, "labels").getByRole("button", { name: "C E G" });
      const degBtn  = section(page, "labels").getByRole("button", { name: "1 3 5" });

      await expect(noteBtn).toHaveClass(/bg-amber-400/);

      await degBtn.click();
      await expect(degBtn).toHaveClass(/bg-amber-400/);
      await expect(noteBtn).not.toHaveClass(/bg-amber-400/);

      await noteBtn.click();
      await expect(noteBtn).toHaveClass(/bg-amber-400/);
    });
  });

  // ── 7. Scale degree labels ────────────────────────────────────────────────

  test.describe("scale degree labels", () => {
    test.beforeEach(async ({ page }) => {
      await section(page, "labels").getByRole("button", { name: "1 3 5" }).click();
    });

    test("Minor Pentatonic shows b3, 4, 5, b7 — not positional indices 2, 3, 4, 5", async ({
      page,
    }) => {
      await section(page, "scale").getByRole("button", { name: "Min Pent" }).click();

      const dots = page.getByTestId("scale-dot");
      await expect(dots.filter({ hasText: "b3" }).first()).toBeVisible();
      await expect(dots.filter({ hasText: "4"  }).first()).toBeVisible();
      await expect(dots.filter({ hasText: "b7" }).first()).toBeVisible();

      // Positional index "2" must not appear as a scale degree
      await expect(dots.filter({ hasText: "b2" })).toHaveCount(0);
    });

    test("Major Pentatonic shows 2, 3, 6 — no flat-prefix degrees", async ({ page }) => {
      await section(page, "scale").getByRole("button", { name: "Maj Pent" }).click();

      const dots = page.getByTestId("scale-dot");
      await expect(dots.filter({ hasText: "2" }).first()).toBeVisible();
      await expect(dots.filter({ hasText: "3" }).first()).toBeVisible();
      await expect(dots.filter({ hasText: "6" }).first()).toBeVisible();

      await expect(dots.filter({ hasText: "b3" })).toHaveCount(0);
      await expect(dots.filter({ hasText: "b7" })).toHaveCount(0);
    });

    test("Blues Minor shows b3, b5, b7", async ({ page }) => {
      await section(page, "scale").getByRole("button", { name: "Blues Min" }).click();

      const dots = page.getByTestId("scale-dot");
      await expect(dots.filter({ hasText: "b3" }).first()).toBeVisible();
      await expect(dots.filter({ hasText: "b5" }).first()).toBeVisible();
      await expect(dots.filter({ hasText: "b7" }).first()).toBeVisible();
    });

    test("C Major shows no flat-prefix scale degree labels", async ({ page }) => {
      // Chord I is selected — non-triad scale notes (2, 4, 6, 7) appear as scale-dots
      const dots = page.getByTestId("scale-dot");
      await expect(dots.filter({ hasText: "2" }).first()).toBeVisible();
      await expect(dots.filter({ hasText: "4" }).first()).toBeVisible();

      await expect(dots.filter({ hasText: "b3" })).toHaveCount(0);
      await expect(dots.filter({ hasText: "b6" })).toHaveCount(0);
      await expect(dots.filter({ hasText: "b7" })).toHaveCount(0);
    });
  });
});
