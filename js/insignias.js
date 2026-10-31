/*
 * LIÊN QUÂN GUIDE - PHÙ HIỆU
 * Chọn phù hiệu trực tiếp trên sơ đồ.
 * Hỗ trợ 2 nhánh phụ độc lập.
 */

document.addEventListener("lqg:data-ready", () => {
  const heroId = new URLSearchParams(location.search).get("id");
  const page = new URLSearchParams(location.search).get("page") === "2" ? 2 : 1;

  const storageId = page === 2 ? `${heroId}__page2` : heroId;
  const hero = getHeroById(heroId);

  if (!hero) {
    document.querySelector(".insignias-page").textContent =
      "Không tìm thấy tướng.";
    return;
  }

  if (typeof BENCH === "undefined" || typeof BENCHB === "undefined") {
    alert("Không tải được dữ liệu phù hiệu.");
    return;
  }

  const KEY = "lqg_insignias_v1";
  const BRANCHES = Object.keys(BENCHB);

  const COLORS = {
    leagueofhumans: "#4DA6FF",
    veda: "#e2c66d",
    lokheim: "#e26a70",
    afata: "#75c78d",
  };

  const mainTabs = document.getElementById("main-branches");
  const subTabs = document.getElementById("secondary-branches");
  const mainPath = document.getElementById("main-path");
  const subPath = document.getElementById("secondary-path");
  const options = document.getElementById("insignias-options");
  const optionsTitle = document.getElementById("options-title");
  const description = document.getElementById("insignias-description");
  const status = document.getElementById("insignias-status");

  // =====================================
  // TẠO HỘP CHỌN NỔI
  // =====================================

  const board = document.querySelector(".insignias-board");

  const chooser = document.createElement("div");
  chooser.className = "insignias-choice-popover";
  chooser.id = "insignias-choice-popover";

  chooser.setAttribute("role", "dialog");
  chooser.setAttribute("aria-label", "Chọn phù hiệu cùng cấp");

  chooser.hidden = true;

  // Chuyển danh sách chọn cũ vào hộp nổi
  const separator = optionsTitle.previousElementSibling;

  if (separator?.classList.contains("insignias-separator")) {
    separator.remove();
  }

  chooser.append(optionsTitle, options);
  board.appendChild(chooser);

  // =====================================
  // ĐỌC DỮ LIỆU
  // =====================================

  function readAll() {
    try {
      const data = JSON.parse(localStorage.getItem(KEY) || "{}");

      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch {
      return {};
    }
  }

  const saved = readAll()[storageId];

  const validBranch = (branch) => BRANCHES.includes(branch);

  const firstOtherBranch = (branch) => BRANCHES.find((id) => id !== branch);

  // Hỗ trợ cấu trúc dữ liệu cũ và mới
  const mainBranch = validBranch(saved?.mainBranch)
    ? saved.mainBranch
    : "lokheim";

  const oldSubBranch = validBranch(saved?.subBranch)
    ? saved.subBranch
    : firstOtherBranch(mainBranch);

  const importedBranches = Array.isArray(saved?.subBranches)
    ? saved.subBranches
    : [oldSubBranch, oldSubBranch];

  const state = {
    mainBranch,

    main: Array.isArray(saved?.main)
      ? saved.main.slice(0, 3)
      : [null, null, null],

    subBranches: [0, 1].map((i) => {
      const branch = importedBranches[i];

      return validBranch(branch) && branch !== mainBranch
        ? branch
        : firstOtherBranch(mainBranch);
    }),

    sub: Array.isArray(saved?.sub) ? saved.sub.slice(0, 2) : [null, null],
  };

  // =====================================
  // LOGIC PHÙ HIỆU PHỤ
  // =====================================

  function subTier(index) {
    if (index === 0) return 1;

    return state.subBranches[0] === state.subBranches[1] ? 2 : 1;
  }

  function normalize() {
    state.main = [0, 1, 2].map((i) => {
      const id = state.main[i];

      return BENCH[id]?.[1] === state.mainBranch && BENCH[id]?.[2] === i + 1
        ? id
        : null;
    });

    state.sub = [0, 1].map((i) => {
      const id = state.sub[i];

      return BENCH[id]?.[1] === state.subBranches[i] &&
        BENCH[id]?.[2] === subTier(i)
        ? id
        : null;
    });
  }

  normalize();

  let selected = {
    type: "main",
    tier: 1,
  };

  let previewId = null;
  let chooserOpen = false;

  // =====================================
  // TẠO HÌNH ẢNH PHÙ HIỆU
  // =====================================

  function createImage(id) {
    const img = document.createElement("img");

    img.src = `images/insignias/e-${id}.webp`;
    img.alt = BENCH[id]?.[0] || id;
    img.loading = "lazy";

    img.onerror = () => {
      const fallback = document.createElement("span");

      fallback.className = "insignia-fallback";
      fallback.textContent = BENCH[id]?.[0] || "?";

      img.replaceWith(fallback);
    };

    return img;
  }

  // =====================================
  // THÔNG TIN TƯỚNG
  // =====================================

  function renderProfile() {
    const profile = document.getElementById("insignias-profile");
    profile.replaceChildren();

    const img = document.createElement("img");

    img.src = `images/heroes/${
      heroId === "flowborn" ? "flowborn-ad" : heroId
    }.webp`;

    img.alt = hero.name;

    const info = document.createElement("div");

    const name = document.createElement("h2");
    name.textContent = hero.name;

    const role = document.createElement("p");

    role.textContent =
      `${ROLES[hero.role] || hero.role} · ` +
      hero.lanes.map((id) => LANES[id]).join(", ");

    info.append(name, role);
    profile.append(img, info);

    document.getElementById("back-to-hero").href =
      `hero.html?id=${encodeURIComponent(heroId)}&page=${page}`;

    document.title = `Phù hiệu ${hero.name} - Liên Quân Guide`;
  }

  // =====================================
  // HIỂN THỊ CÁC NHÁNH
  // =====================================

  function renderBranches(container, type) {
    container.replaceChildren();

    const slot = selected.type === "sub" ? selected.tier - 1 : 0;

    const current =
      type === "main" ? state.mainBranch : state.subBranches[slot];

    if (type === "sub") {
      const hint = document.createElement("p");

      hint.textContent =
        `Đang chọn nhánh cho ô phụ ${slot + 1}. ` +
        "Nhấn ô tròn I / II bên dưới để đổi ô.";

      hint.style.flexBasis = "100%";
      hint.style.margin = "0 0 4px";
      hint.style.color = "var(--muted)";
      hint.style.fontSize = "13px";

      container.appendChild(hint);
    }

    BRANCHES.forEach((branch) => {
      if (type === "sub" && branch === state.mainBranch) {
        return;
      }

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = BENCHB[branch];

      button.classList.toggle("active", branch === current);

      button.style.setProperty("--branch-color", COLORS[branch]);

      button.addEventListener("click", () => {
        if (type === "main") {
          if (state.mainBranch === branch) return;

          state.mainBranch = branch;
          state.main = [null, null, null];

          // Nhánh phụ không trùng nhánh chính
          state.subBranches.forEach((subBranch, i) => {
            if (subBranch === branch) {
              state.subBranches[i] = firstOtherBranch(branch);

              state.sub[i] = null;
            }
          });
        } else {
          if (state.subBranches[slot] === branch) return;

          state.subBranches[slot] = branch;
          state.sub[slot] = null;
        }

        normalize();

        selected = {
          type,
          tier: type === "main" ? 1 : slot + 1,
        };

        previewId = null;
        chooserOpen = false;

        status.textContent = "Có thay đổi chưa lưu.";

        render();
      });

      container.appendChild(button);
    });
  }

  // =====================================
  // VẼ SƠ ĐỒ PHÙ HIỆU
  // =====================================

  function renderPath(container, type) {
    container.replaceChildren();

    const isMain = type === "main";
    const count = isMain ? 3 : 2;

    const values = isMain ? state.main : state.sub;

    const branchAt = (i) => (isMain ? state.mainBranch : state.subBranches[i]);

    const tierAt = (i) => (isMain ? i + 1 : subTier(i));

    container.style.setProperty("--path-color", COLORS[branchAt(0)]);

    for (let i = 0; i < count; i++) {
      if (i > 0) {
        const line = document.createElement("div");
        line.className = "path-line";

        // Đường nối đổi màu khi hai nhánh phụ khác nhau
        if (!isMain && branchAt(0) !== branchAt(1)) {
          line.style.background =
            `linear-gradient(90deg, ` +
            `${COLORS[branchAt(0)]}, ` +
            `${COLORS[branchAt(1)]})`;
        }

        container.appendChild(line);
      }

      const button = document.createElement("button");

      button.type = "button";
      button.className = "path-node insignia-node";

      button.dataset.slot = String(i);
      button.dataset.type = type;

      button.setAttribute("aria-haspopup", "dialog");

      button.setAttribute(
        "aria-expanded",
        String(
          chooserOpen && selected.type === type && selected.tier === i + 1,
        ),
      );

      button.style.setProperty("--path-color", COLORS[branchAt(i)]);

      button.classList.toggle(
        "active",
        selected.type === type && selected.tier === i + 1,
      );

      if (values[i]) {
        button.appendChild(createImage(values[i]));
        button.title = BENCH[values[i]][0];
      } else {
        const symbol = document.createElement("span");

        symbol.className = "insignia-empty";
        symbol.textContent = "+";

        button.appendChild(symbol);

        button.title = `Chọn phù hiệu bậc ${tierAt(i)}`;
      }

      const tier = document.createElement("small");

      tier.textContent = ["", "I", "II", "III"][tierAt(i)];

      button.appendChild(tier);

      // Nhấn trực tiếp vào viên để mở hộp chọn
      button.addEventListener("click", () => {
        const sameSlot = selected.type === type && selected.tier === i + 1;

        chooserOpen = sameSlot ? !chooserOpen : true;

        selected = {
          type,
          tier: i + 1,
        };

        previewId = values[i] || null;

        render();
      });

      container.appendChild(button);
    }
  }

  // =====================================
  // HIỂN THỊ THÔNG TIN PHÙ HIỆU
  // =====================================

  function showDescription(id) {
    description.replaceChildren();

    if (!id || !BENCH[id]) {
      const p = document.createElement("p");

      p.textContent = "Chọn biểu tượng phù hiệu để xem chi tiết.";

      description.appendChild(p);
      return;
    }

    const [name, branch, tier, effect] = BENCH[id];

    const img = createImage(id);

    const title = document.createElement("h3");
    title.textContent = name;

    const branchInfo = document.createElement("p");

    branchInfo.textContent =
      `${BENCHB[branch]} · Bậc ` + `${["", "I", "II", "III"][tier]}`;

    const effectInfo = document.createElement("p");
    effectInfo.textContent = effect;

    description.append(img, title, branchInfo, effectInfo);
  }

  // =====================================
  // DANH SÁCH PHÙ HIỆU THEO CẤP
  // =====================================

  function renderOptions() {
    options.replaceChildren();

    const isMain = selected.type === "main";
    const index = selected.tier - 1;

    const branch = isMain ? state.mainBranch : state.subBranches[index];

    const actualTier = isMain ? selected.tier : subTier(index);

    const values = isMain ? state.main : state.sub;

    const roman = ["", "I", "II", "III"][actualTier];

    optionsTitle.textContent = isMain
      ? `Nhánh chính — Bậc ${roman}`
      : `Ô phụ ${index + 1} — ` + `${BENCHB[branch]} — Bậc ${roman}`;

    // Chỉ lấy phù hiệu cùng nhánh và cùng cấp
    const choices = Object.entries(BENCH).filter(
      ([, data]) => data[1] === branch && data[2] === actualTier,
    );

    choices.forEach(([id, data]) => {
      const button = document.createElement("button");
      button.type = "button";

      button.classList.toggle("selected", values[index] === id);

      button.setAttribute("aria-pressed", String(values[index] === id));

      button.appendChild(createImage(id));

      const name = document.createElement("span");
      name.textContent = data[0];

      button.appendChild(name);

      // Rê chuột để xem mô tả
      button.addEventListener("mouseenter", () => showDescription(id));

      button.addEventListener("focus", () => showDescription(id));

      // Nhấn chọn phù hiệu và đóng hộp
      button.addEventListener("click", () => {
        values[index] = id;
        previewId = id;
        chooserOpen = false;

        status.textContent = "Có thay đổi chưa lưu.";

        render();
      });

      options.appendChild(button);
    });

    showDescription(previewId || values[index]);
  }

  // =====================================
  // ĐẶT VỊ TRÍ HỘP CHỌN
  // =====================================

  function updateChooserPosition() {
    chooser.hidden = !chooserOpen;

    if (!chooserOpen) return;

    const path = selected.type === "main" ? mainPath : subPath;

    const anchor = path.querySelector(
      `[data-type="${selected.type}"]` + `[data-slot="${selected.tier - 1}"]`,
    );

    if (!anchor) return;

    const frame = board.getBoundingClientRect();
    const rect = anchor.getBoundingClientRect();

    const width = Math.min(350, Math.max(190, board.clientWidth - 24));

    const left = Math.max(
      8,
      Math.min(
        board.clientWidth - width - 8,
        rect.left - frame.left + rect.width / 2 - width / 2,
      ),
    );

    chooser.style.width = `${width}px`;
    chooser.style.left = `${left}px`;

    chooser.style.top = `${rect.bottom - frame.top + 10}px`;
  }

  // =====================================
  // CẬP NHẬT GIAO DIỆN
  // =====================================

  function render() {
    renderBranches(mainTabs, "main");
    renderBranches(subTabs, "sub");

    renderPath(mainPath, "main");
    renderPath(subPath, "sub");

    renderOptions();
    updateChooserPosition();
  }

  // =====================================
  // ĐÓNG HỘP CHỌN KHI NHẤN BÊN NGOÀI
  // =====================================

  document.addEventListener("click", (event) => {
    if (!chooserOpen) return;

    if (chooser.contains(event.target)) return;
    if (event.target.closest(".insignia-node")) return;

    chooserOpen = false;
    chooser.hidden = true;
  });

  // Nhấn Escape để đóng
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && chooserOpen) {
      chooserOpen = false;
      chooser.hidden = true;
    }
  });

  window.addEventListener("resize", () => {
    if (chooserOpen) {
      updateChooserPosition();
    }
  });

  // =====================================
  // LƯU PHÙ HIỆU
  // =====================================

  document.getElementById("save-insignias").addEventListener("click", () => {
    normalize();

    if ([...state.main, ...state.sub].some((id) => !id)) {
      status.textContent =
        "Hãy chọn đủ 3 phù hiệu chính " + "và 2 phù hiệu phụ.";

      render();
      return;
    }

    const data = readAll();

    const old = data[storageId];

    const oldIds = [
      ...(Array.isArray(old?.main) ? old.main : []),
      ...(Array.isArray(old?.sub) ? old.sub : []),
    ];

    const markedIds = new Set(
      Array.isArray(old?.core)
        ? old.core.filter((id, i) => id && id === oldIds[i])
        : [],
    );

    data[storageId] = {
      mainBranch: state.mainBranch,

      subBranch: state.subBranches[0],

      subBranches: [...state.subBranches],

      main: [...state.main],
      sub: [...state.sub],

      core: [...state.main, ...state.sub].map((id) =>
        markedIds.has(id) ? id : null,
      ),
    };

    try {
      localStorage.setItem(KEY, JSON.stringify(data));

      status.textContent = "Đã lưu phù hiệu thành công!";
      window.location.href = `hero.html?id=${encodeURIComponent(heroId)}&page=${page}`;
    } catch {
      status.textContent = "Không thể lưu phù hiệu.";
    }
  });

  // =====================================
  // KHỞI TẠO
  // =====================================

  // =====================================
  // NÚT HỦY THAY ĐỔI PHÙ HIỆU
  // =====================================

  const saveButton = document.getElementById("save-insignias");

  const actionRow = document.createElement("div");
  actionRow.className = "insignias-save-actions";

  saveButton.before(actionRow);
  actionRow.appendChild(saveButton);

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.id = "cancel-insignias";
  cancelButton.textContent = "Hủy";

  actionRow.appendChild(cancelButton);

  cancelButton.addEventListener("click", () => {
    const savedData = readAll()[storageId];

    const originalMain = validBranch(savedData?.mainBranch)
      ? savedData.mainBranch
      : "lokheim";

    const originalSub = validBranch(savedData?.subBranch)
      ? savedData.subBranch
      : firstOtherBranch(originalMain);

    const branches = Array.isArray(savedData?.subBranches)
      ? savedData.subBranches
      : [originalSub, originalSub];

    // Khôi phục nhánh chính
    state.mainBranch = originalMain;

    state.main = Array.isArray(savedData?.main)
      ? savedData.main.slice(0, 3)
      : [null, null, null];

    // Khôi phục 2 nhánh phụ
    state.subBranches = [0, 1].map((i) => {
      const branch = branches[i];

      return validBranch(branch) && branch !== originalMain
        ? branch
        : firstOtherBranch(originalMain);
    });

    state.sub = Array.isArray(savedData?.sub)
      ? savedData.sub.slice(0, 2)
      : [null, null];

    normalize();

    // Đóng bảng chọn và làm mới giao diện
    selected = { type: "main", tier: 1 };
    previewId = null;
    chooserOpen = false;

    render();

    status.textContent = "Đã hủy thay đổi.";
    window.location.href = `hero.html?id=${encodeURIComponent(heroId)}&page=${page}`;
  });

  renderProfile();
  render();
});
