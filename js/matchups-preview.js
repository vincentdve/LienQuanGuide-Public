/* ========================================
   KHẮC CHẾ - HIỂN THỊ THEO 5 ĐƯỜNG
======================================== */

document.addEventListener("lqg:data-ready", () => {
  const params = new URLSearchParams(location.search);
  const heroId = params.get("id");
  const page = params.get("page") === "2" ? 2 : 1;
  const storageId = page === 2 ? `${heroId}__page2` : heroId;

  const hero = getHeroById(heroId);
  if (!hero) return;

  const section = [...document.querySelectorAll(".detail-section")].find(
    (el) => el.querySelector("h2")?.textContent.trim() === "Bảng khắc chế",
  );

  if (!section) return;

  // Đọc dữ liệu cũ, không thay đổi cấu trúc lưu
  let records = {};

  try {
    const data = JSON.parse(localStorage.getItem("lqg_matchups_v1") || "{}");

    const own = data?.[storageId];

    if (own && typeof own === "object" && !Array.isArray(own)) {
      records = own;
    }
  } catch (error) {
    console.warn("Lỗi đọc bảng khắc chế:", error);
  }

  section.replaceChildren();
  section.classList.add("matchup-preview-section");

  // Tiêu đề và mũi tên
  const heading = document.createElement("div");
  heading.className = "matchup-preview-heading";

  const title = document.createElement("h2");
  title.textContent = "Bảng khắc chế";

  const arrow = document.createElement("a");
  arrow.className = "matchup-preview-arrow";
  arrow.href = `matchups.html?id=${encodeURIComponent(hero.id)}&page=${page}`;
  arrow.textContent = "❯";
  arrow.title = "Thêm, sửa hoặc xóa tướng khắc chế";
  arrow.setAttribute("aria-label", "Mở trang quản lý bảng khắc chế");

  heading.append(title, arrow);
  section.appendChild(heading);

  // Tạo bảng 5 cột
  const board = document.createElement("div");
  board.className = "matchup-preview-board";

  const laneIds = ["top", "jg", "mid", "ad", "sp"];

  const severity = {
    "Cực khó": 0,
    "Rất khó": 0,
    Khó: 1,
    "Ngang kèo": 2,
    Dễ: 3,
  };

  for (const laneId of laneIds) {
    const column = document.createElement("div");
    column.className = "matchup-preview-column";
    column.dataset.lane = laneId;

    const laneTitle = document.createElement("h3");
    laneTitle.textContent = LANES[laneId];

    column.appendChild(laneTitle);

    // Xếp mỗi tướng theo đường chính
    const entries = Object.entries(records)
      .map(([enemyId, record]) => ({
        enemy: getHeroById(enemyId),
        record,
      }))
      .filter(
        ({ enemy, record }) =>
          enemy &&
          enemy.lanes[0] === laneId &&
          record &&
          typeof record === "object",
      )
      .sort(
        (a, b) =>
          (severity[a.record.difficulty] ?? 4) -
            (severity[b.record.difficulty] ?? 4) ||
          a.enemy.name.localeCompare(b.enemy.name, "vi"),
      );

    const count = document.createElement("p");
    count.className = "matchup-preview-count";
    count.textContent = `${entries.length} kèo đã lưu`;

    column.appendChild(count);

    if (entries.length === 0) {
      const empty = document.createElement("p");
      empty.className = "matchup-preview-empty";
      empty.textContent = "Chưa có tướng";
      column.appendChild(empty);
    }

    // Tướng xếp dọc trong mỗi cột
    for (const { enemy, record } of entries) {
      const card = document.createElement("article");
      card.className = "matchup-preview-card";

      const image = document.createElement("img");

      const imageId = enemy.id === "flowborn" ? "flowborn-ad" : enemy.id;

      image.src = `images/heroes/${imageId}.webp`;

      image.alt = enemy.name;
      image.loading = "lazy";

      image.onerror = () => {
        const fallback = document.createElement("span");

        fallback.className = "matchup-preview-fallback";

        fallback.textContent = enemy.name.charAt(0);

        image.replaceWith(fallback);
      };

      const details = document.createElement("div");
      details.className = "matchup-preview-details";

      const name = document.createElement("strong");
      name.textContent = enemy.name;

      const difficulty = document.createElement("span");

      difficulty.className = "matchup-preview-level";

      const level =
        record.difficulty === "Rất khó" ? "Cực khó" : record.difficulty;

      difficulty.textContent = level || "Chưa phân loại";

      difficulty.dataset.level = level || "unknown";

      details.append(name, difficulty);

      // Ghi chú ngắn
      if (typeof record.note === "string" && record.note.trim()) {
        const note = document.createElement("p");
        note.textContent = record.note.trim();
        note.title = record.note.trim();

        details.appendChild(note);
      }

      card.append(image, details);
      column.appendChild(card);
    }

    board.appendChild(column);
  }

  section.appendChild(board);
});
