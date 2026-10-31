/* LienQuanGuide: loads all game data directly from JSON before starting app. */
(() => {
  "use strict";
  const paths = ["heroes", "items", "insignias", "arcana", "spells", "extra"];
  const root = new URL("../game-data/", document.currentScript.src);
  const dataPromise = Promise.all(
    paths.map(async (kind) => {
      const response = await fetch(new URL(`${kind}.json`, root), {
        cache: "no-store",
      });
      if (!response.ok)
        throw new Error(`${kind}.json: HTTP ${response.status}`);
      return response.json();
    }),
  );
  const domPromise =
    document.readyState === "loading"
      ? new Promise((resolve) =>
          document.addEventListener("DOMContentLoaded", resolve, {
            once: true,
          }),
        )
      : Promise.resolve();

  Promise.all([dataPromise, domPromise])
    .then(([values]) => {
      const [heroes, items, insignias, arcana, spells, extra] = values;
      if (![heroes, items, insignias, arcana, spells].every(Array.isArray)) {
        throw new Error("Dữ liệu game không đúng định dạng danh sách.");
      }
      if (!extra || typeof extra !== "object" || Array.isArray(extra)) {
        throw new Error("extra.json không hợp lệ.");
      }
      const bitem = {},
        binfo = {},
        barc = {},
        bench = {},
        bspell = {};
      for (const x of items) {
        bitem[x.id] = [
          x.name,
          x.category,
          x.imageSlug || x.id,
          x.englishName || "",
        ];
        binfo[x.id] = {
          p: x.price,
          s: x.stats || [],
          n: (x.passives || []).map((p) => [p.name, p.description]),
        };
      }
      for (const x of arcana) barc[x.id] = [x.color, x.description];
      for (const x of insignias)
        bench[x.id] = [x.name, x.branch, x.tier, x.description];
      for (const x of spells) bspell[x.id] = [x.name, x.description];

      window.LQG_DATA = { heroes, items, insignias, arcana, spells, extra };
      // Legacy public names remain for compatibility, but no longer contain hard-coded data.
      Object.assign(window, {
        BITEM: bitem,
        BINFO: binfo,
        BARC: barc,
        BENCH: bench,
        BENCHB: extra.branchNames,
        BSPELL: bspell,
        BUILDS: extra.builds,
        BSRC: extra.buildSources,
      });
      if (typeof window.LQG_prepareHeroes === "function")
        window.LQG_prepareHeroes(heroes);
      if (typeof window.LQG_prepareItems === "function")
        window.LQG_prepareItems(items);
      if (typeof window.LQG_prepareSpells === "function")
        window.LQG_prepareSpells(spells);
      document.dispatchEvent(new Event("lqg:data-ready"));
    })
    .catch((error) => {
      console.error("[LienQuanGuide] Không tải được JSON:", error);
      const notice = document.createElement("div");
      notice.setAttribute("role", "alert");
      notice.style.cssText =
        "position:fixed;inset:12px 12px auto;z-index:999999;background:#581e25;color:white;border:1px solid #ff6574;border-radius:10px;padding:16px;font:15px/1.6 system-ui";
      notice.textContent =
        "Không tải được dữ liệu game JSON. Hãy mở website bằng Live Server (không mở file://), kiểm tra game-data/*.json và Console (F12). Chi tiết: " +
        error.message;
      document.body.appendChild(notice);
    });
})();
