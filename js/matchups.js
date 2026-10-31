/*
 * matchups.js
 * Bảng khắc chế cá nhân
 * Chọn tướng bằng lưới ảnh, lọc lane và vai trò.
 * Danh sách đã lưu nhóm theo lane.
 */

document.addEventListener("lqg:data-ready", () => {
  const params = new URLSearchParams(location.search);
  const heroId = params.get("id");
  const page = params.get("page") === "2" ? 2 : 1;

  const storageId = page === 2 ? `${heroId}__page2` : heroId;
  const hero = getHeroById(heroId);

  if (!hero) return;

  const section = [...document.querySelectorAll(".detail-section")].find(
    (el) => el.querySelector("h2")?.textContent === "Bảng khắc chế",
  );

  if (!section) return;

  const KEY = "lqg_matchups_v1";
  const LANE_ORDER = ["top", "jg", "mid", "ad", "sp"];

  const LEVELS = ["Ngang kèo", "Khó", "Cực khó"];

  const LEVEL_COLORS = {
    "Ngang kèo": "difficulty-even",
    Khó: "difficulty-hard",
    "Cực khó": "difficulty-very-hard",
    "Rất khó": "difficulty-very-hard",
    Dễ: "difficulty-old",
  };

  const allEnemies = HEROES.filter((h) => h.id !== heroId);

  let currentEnemyId = null;
  let activeLane = "all";
  let activeSavedLane = "all";

  // ==============================
  // 1. LƯU VÀ ĐỌC DỮ LIỆU
  // ==============================

  function loadData() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");

      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch {
      return {};
    }
  }

  function saveData(data) {
    try {
      localStorage.setItem(KEY, JSON.stringify(data));
      return true;
    } catch {
      alert("Không lưu được dữ liệu.");
      return false;
    }
  }

  // ==============================
  // 2. HÌNH ẢNH TƯỚNG
  // ==============================

  function heroImage(id) {
    const imageName = id === "flowborn" ? "flowborn-ad" : id;

    return `images/heroes/${imageName}.webp`;
  }

  function makeImage(enemy) {
    const img = document.createElement("img");

    img.src = heroImage(enemy.id);
    img.alt = enemy.name;
    img.loading = "lazy";

    img.onerror = () => {
      const fallback = document.createElement("span");

      fallback.className = "enemy-fallback";
      fallback.textContent = enemy.name.charAt(0);

      img.replaceWith(fallback);
    };

    return img;
  }

  // ==============================
  // 3. BỘ LỌC THEO LANE
  // ==============================

  function makeLaneButtons(container, callback) {
    const lanes = [
      { id: "all", text: "Tất cả" },
      ...LANE_ORDER.map((id) => ({
        id,
        text: LANES[id],
      })),
    ];

    lanes.forEach(({ id, text }) => {
      const button = document.createElement("button");

      button.type = "button";
      button.textContent = text;
      button.dataset.lane = id;

      if (id === "all") {
        button.classList.add("active");
      }

      button.addEventListener("click", () => {
        container
          .querySelectorAll("button")
          .forEach((btn) => btn.classList.remove("active"));

        button.classList.add("active");
        callback(id);
      });

      container.appendChild(button);
    });
  }

  // ==============================
  // 4. TẠO GIAO DIỆN
  // ==============================

  section.innerHTML = `
        <h2>Bảng khắc chế</h2>

        <div class="matchup-form">

            <label>Chọn tướng đối đầu</label>

            <div id="enemy-lanes" class="enemy-tabs"></div>

            <div class="enemy-toolbar">
                <input
                    id="enemy-search"
                    type="search"
                    placeholder="Tìm tên tướng..."
                    autocomplete="off"
                >

                <select id="enemy-role">
                    <option value="all">Tất cả vai trò</option>
                </select>
            </div>

            <div id="enemy-grid" class="enemy-grid"></div>

            <p id="selected-enemy" class="selected-enemy">
                Chưa chọn tướng đối đầu
            </p>

            <label for="difficulty-select">
                Đánh giá kèo đấu
            </label>

            <select id="difficulty-select">
                <option value="Ngang kèo">Ngang kèo</option>
                <option value="Khó">Khó</option>
                <option value="Cực khó">Cực khó</option>
            </select>

            <label for="matchup-note">
                Ghi chú cách đối đầu
            </label>

            <textarea
                id="matchup-note"
                rows="4"
                placeholder="Ghi chú chiến thuật..."
            ></textarea>

            <button id="save-matchup" type="button">
                Lưu đánh giá
            </button>

            <p id="matchup-status" role="status"></p>
        </div>

        <h3>Danh sách kèo đã đánh giá</h3>

        <div id="saved-lanes" class="enemy-tabs"></div>

        <div id="matchup-list"></div>
    `;

  const tabs = section.querySelector("#enemy-lanes");
  const grid = section.querySelector("#enemy-grid");
  const search = section.querySelector("#enemy-search");
  const role = section.querySelector("#enemy-role");

  const selectedLabel = section.querySelector("#selected-enemy");

  const difficulty = section.querySelector("#difficulty-select");

  const note = section.querySelector("#matchup-note");
  const status = section.querySelector("#matchup-status");

  const savedTabs = section.querySelector("#saved-lanes");
  const list = section.querySelector("#matchup-list");

  // Tạo danh sách vai trò
  for (const [key, label] of Object.entries(ROLES)) {
    const option = document.createElement("option");

    option.value = key;
    option.textContent = label;

    role.appendChild(option);
  }

  makeLaneButtons(tabs, (lane) => {
    activeLane = lane;
    renderEnemyGrid();
  });

  makeLaneButtons(savedTabs, (lane) => {
    activeSavedLane = lane;
    renderSaved();
  });

  // ==============================
  // 5. CHỌN TƯỚNG ĐỐI ĐẦU
  // ==============================

  function chooseEnemy(enemyId) {
    const enemy = getHeroById(enemyId);

    if (!enemy || enemyId === heroId) return;

    currentEnemyId = enemyId;

    selectedLabel.textContent = `Đang chọn: ${enemy.name} (${enemy.lanes
      .map((lane) => LANES[lane])
      .join(", ")})`;

    const old = loadData()[storageId]?.[enemyId];

    if (LEVELS.includes(old?.difficulty)) {
      difficulty.value = old.difficulty;
    } else if (old?.difficulty === "Rất khó") {
      difficulty.value = "Cực khó";
    } else {
      difficulty.value = "Ngang kèo";
    }

    note.value = old?.note || "";

    status.textContent =
      old?.difficulty === "Dễ"
        ? "Kèo này có đánh giá Dễ từ bản cũ. Hãy đánh giá lại."
        : "";

    grid.querySelectorAll(".enemy-choice").forEach((button) => {
      const chosen = button.dataset.id === currentEnemyId;

      button.classList.toggle("selected", chosen);

      button.setAttribute("aria-pressed", String(chosen));
    });
  }

  // ==============================
  // 6. HIỂN THỊ LƯỚI TƯỚNG
  // ==============================

  function renderEnemyGrid() {
    const query = createHeroId(search.value.trim());

    grid.replaceChildren();

    const filtered = allEnemies.filter((enemy) => {
      const matchLane =
        activeLane === "all" || enemy.lanes.includes(activeLane);

      const matchRole = role.value === "all" || enemy.role === role.value;

      const matchSearch = enemy.id.includes(query);

      return matchLane && matchRole && matchSearch;
    });

    if (filtered.length === 0) {
      grid.textContent = "Không tìm thấy tướng phù hợp.";
      return;
    }

    const fragment = document.createDocumentFragment();

    filtered.forEach((enemy) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = "enemy-choice";
      button.dataset.id = enemy.id;

      button.title = `${enemy.name} - ${ROLES[enemy.role] || enemy.role}`;

      const selected = enemy.id === currentEnemyId;

      button.classList.toggle("selected", selected);
      button.setAttribute("aria-pressed", String(selected));

      const name = document.createElement("span");
      name.textContent = enemy.name;

      button.append(makeImage(enemy), name);

      button.addEventListener("click", () => {
        chooseEnemy(enemy.id);
      });

      fragment.appendChild(button);
    });

    grid.appendChild(fragment);
  }

  // ==============================
  // 7. DANH SÁCH KÈO ĐÃ LƯU
  // ==============================

  function renderSaved() {
    list.replaceChildren();

    const records = loadData()[storageId] || {};

    const entries = Object.entries(records)
      .map(([enemyId, record]) => ({
        enemy: getHeroById(enemyId),
        record,
      }))
      .filter(
        ({ enemy }) =>
          enemy &&
          (activeSavedLane === "all" || enemy.lanes.includes(activeSavedLane)),
      )
      .sort((a, b) => a.enemy.name.localeCompare(b.enemy.name, "vi"));

    if (entries.length === 0) {
      list.textContent = "Chưa có đánh giá trong nhóm này.";
      return;
    }

    // Mỗi tướng được xếp vào lane chính khi xem tất cả
    const groups =
      activeSavedLane === "all"
        ? LANE_ORDER.map((lane) => ({
            lane,
            entries: entries.filter((entry) => entry.enemy.lanes[0] === lane),
          }))
        : [
            {
              lane: activeSavedLane,
              entries,
            },
          ];

    groups.forEach(({ lane, entries: rows }) => {
      if (rows.length === 0) return;

      const heading = document.createElement("h4");
      heading.className = "matchup-lane-heading";
      heading.textContent = `${LANES[lane]} (${rows.length})`;

      list.appendChild(heading);

      const wrapper = document.createElement("div");
      wrapper.className = "matchup-table-wrapper";

      const table = document.createElement("table");
      table.className = "matchup-table";

      const thead = document.createElement("thead");

      thead.innerHTML = `
                <tr>
                    <th>Tướng</th>
                    <th>Vai trò</th>
                    <th>Độ khó</th>
                    <th>Ghi chú</th>
                    <th>Thao tác</th>
                </tr>
            `;

      const tbody = document.createElement("tbody");

      rows.forEach(({ enemy, record }) => {
        const tr = document.createElement("tr");

        // Cột tướng
        const enemyTd = document.createElement("td");

        const info = document.createElement("div");
        info.className = "matchup-hero";

        const name = document.createElement("strong");
        name.textContent = enemy.name;

        info.append(makeImage(enemy), name);
        enemyTd.appendChild(info);

        // Cột vai trò
        const roleTd = document.createElement("td");

        roleTd.textContent = ROLES[enemy.role] || enemy.role;

        // Cột độ khó
        const levelTd = document.createElement("td");

        const badge = document.createElement("span");

        badge.className =
          "matchup-difficulty " +
          (LEVEL_COLORS[record.difficulty] || "difficulty-old");

        if (record.difficulty === "Rất khó") {
          badge.textContent = "Cực khó";
        } else if (record.difficulty === "Dễ") {
          badge.textContent = "Chưa phân loại (cũ)";
        } else {
          badge.textContent = record.difficulty;
        }

        levelTd.appendChild(badge);

        // Cột ghi chú
        const noteTd = document.createElement("td");
        noteTd.className = "matchup-note-cell";
        noteTd.textContent = record.note || "—";

        // Cột thao tác
        const actionTd = document.createElement("td");
        actionTd.className = "matchup-actions";

        const edit = document.createElement("button");
        edit.type = "button";
        edit.textContent = "Sửa";

        edit.addEventListener("click", () => {
          chooseEnemy(enemy.id);

          section.querySelector(".matchup-form").scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        });

        const remove = document.createElement("button");
        remove.type = "button";
        remove.textContent = "Xóa";
        remove.className = "delete-matchup";

        remove.addEventListener("click", () => {
          if (!confirm(`Xóa kèo ${enemy.name}?`)) {
            return;
          }

          const data = loadData();

          if (!data[storageId]) return;

          delete data[storageId][enemy.id];

          if (Object.keys(data[storageId]).length === 0) {
            delete data[storageId];
          }

          if (saveData(data)) {
            renderSaved();
          }
        });

        actionTd.append(edit, remove);

        tr.append(enemyTd, roleTd, levelTd, noteTd, actionTd);

        tbody.appendChild(tr);
      });

      table.append(thead, tbody);
      wrapper.appendChild(table);
      list.appendChild(wrapper);
    });
  }

  // ==============================
  // 8. SỰ KIỆN
  // ==============================

  search.addEventListener("input", renderEnemyGrid);
  role.addEventListener("change", renderEnemyGrid);

  section.querySelector("#save-matchup").addEventListener("click", () => {
    if (!currentEnemyId) {
      status.textContent = "Hãy chọn một tướng đối đầu trước.";
      return;
    }

    const data = loadData();

    if (!data[storageId]) {
      data[storageId] = {};
    }

    data[storageId][currentEnemyId] = {
      difficulty: difficulty.value,
      note: note.value.trim(),
    };

    if (saveData(data)) {
      status.textContent = "Đã lưu đánh giá.";
      renderSaved();
    }
  });

  // ==============================
  // 9. KHỞI TẠO
  // ==============================

  renderEnemyGrid();
  renderSaved();
});
