/*
 * arcana.js
 * Bảng ngọc 30 viên cố định.
 * Dữ liệu lấy từ BARC trong item-data.js.
 */

document.addEventListener("lqg:data-ready", () => {
  const params = new URLSearchParams(location.search);
  const heroId = params.get("id");
  const page = params.get("page") === "2" ? 2 : 1;

  const storageId = page === 2 ? `${heroId}__page2` : heroId;

  const backUrl = `hero.html?id=${encodeURIComponent(heroId)}&page=${page}`;
  const hero = getHeroById(heroId);

  if (!hero) return;

  if (typeof BARC === "undefined") {
    alert("Không tìm thấy dữ liệu ngọc BARC.");
    return;
  }

  const STORAGE_KEY = "lqg_arcana_v1";

  const COLORS = {
    red: "Đỏ",
    purple: "Tím",
    teal: "Xanh",
  };

  const COLOR_ORDER = ["red", "purple", "teal"];

  // Ngọc mặc định, có thể thay toàn bộ.
  const DEFAULT_GEMS = {
    red: "red_samurai",
    purple: "purple_assassin",
    teal: "teal_dragoon",
  };

  const circle = document.getElementById("arcana-circle");
  const options = document.getElementById("arcana-options");
  const statsBox = document.getElementById("arcana-stats");
  const detailsBox = document.getElementById("arcana-details");
  const status = document.getElementById("arcana-status");

  // ==============================
  // 1. ĐỌC VÀ LƯU DỮ LIỆU
  // ==============================

  function loadData() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

      return data && typeof data === "object" && !Array.isArray(data)
        ? data
        : {};
    } catch {
      return {};
    }
  }

  // Tạo 10 viên cố định cho mỗi màu.
  function createDefaultBuild() {
    return {
      red: Array(10).fill(DEFAULT_GEMS.red),
      purple: Array(10).fill(DEFAULT_GEMS.purple),
      teal: Array(10).fill(DEFAULT_GEMS.teal),
    };
  }

  const saved = loadData()[storageId];
  const defaults = createDefaultBuild();

  const build = {};

  COLOR_ORDER.forEach((color) => {
    const values = saved?.[color];

    build[color] = Array.from({ length: 10 }, (_, index) => {
      const id = values?.[index];

      return typeof id === "string" && BARC[id]?.[0] === color
        ? id
        : defaults[color][index];
    });
  });

  // Ô đang được chọn.
  let selected = {
    color: "red",
    index: 0,
  };

  // ==============================
  // 2. HÌNH ẢNH NGỌC
  // ==============================

  function gemImagePath(id) {
    return `images/arcana/a-${id}.webp`;
  }

  function createGemImage(id) {
    const img = document.createElement("img");

    img.src = gemImagePath(id);
    img.alt = BARC[id]?.[1] || id;
    img.loading = "lazy";

    img.onerror = () => {
      img.style.display = "none";
    };

    return img;
  }

  function getGemName(id) {
    const gem = BARC[id];

    if (!gem) return id;

    return `Ngọc ${COLORS[gem[0]]} — ${gem[1]}`;
  }

  // ==============================
  // 3. THÔNG TIN TƯỚNG
  // ==============================

  function renderProfile() {
    const profile = document.getElementById("arcana-profile");
    profile.replaceChildren();

    const wrapper = document.createElement("div");
    wrapper.className = "arcana-hero-profile";

    const img = document.createElement("img");
    const imageName = heroId === "flowborn" ? "flowborn-ad" : heroId;

    img.src = `images/heroes/${imageName}.webp`;
    img.alt = hero.name;

    const info = document.createElement("div");

    const name = document.createElement("h2");
    name.textContent = hero.name;

    const role = document.createElement("p");
    role.textContent =
      ROLES[hero.role] + " · " + hero.lanes.map((id) => LANES[id]).join(", ");

    info.append(name, role);
    wrapper.append(img, info);
    profile.appendChild(wrapper);

    document.getElementById("arcana-back").href = backUrl;

    document.title = `Ngọc ${hero.name} - Liên Quân Guide`;
  }

  // ==============================
  // 4. VÒNG TRÒN 30 VIÊN
  // ==============================

  function renderCircle() {
    circle
      .querySelectorAll(".arcana-slot")
      .forEach((element) => element.remove());

    // Mỗi màu vẫn có 10 viên:
    // 6 viên vòng ngoài + 4 viên vòng trong.
    const rings = [
      { name: "outer", count: 6, startIndex: 0, radius: 42 },
      { name: "inner", count: 4, startIndex: 6, radius: 26 },
    ];

    rings.forEach((ring) => {
      COLOR_ORDER.forEach((color, colorIndex) => {
        for (let i = 0; i < ring.count; i++) {
          const index = ring.startIndex + i;
          const id = build[color][index];

          // Mỗi màu chiếm 120 độ trên cả hai vòng
          const angleDeg =
            -150 + colorIndex * 120 + (i + 0.5) * (120 / ring.count);

          const angle = (angleDeg * Math.PI) / 180;

          const x = 50 + ring.radius * Math.cos(angle);
          const y = 50 + ring.radius * Math.sin(angle);

          const button = document.createElement("button");
          button.type = "button";

          button.className = `arcana-slot arcana-${color} arcana-slot-${ring.name}`;

          button.style.left = `${x}%`;
          button.style.top = `${y}%`;

          const isSelected =
            selected.color === color && selected.index === index;

          button.classList.toggle("selected", isSelected);

          button.setAttribute(
            "aria-label",
            `Ngọc ${COLORS[color]} số ${index + 1}: ${getGemName(id)}`,
          );

          button.setAttribute("aria-pressed", String(isSelected));

          button.title = getGemName(id);
          button.appendChild(createGemImage(id));

          button.addEventListener("click", () => {
            selected = { color, index };

            renderCircle();
            renderOptions();
            renderDetails();
          });

          circle.appendChild(button);
        }
      });
    });
  }

  // ==============================
  // 5. DANH SÁCH NGỌC ĐỂ THAY
  // ==============================

  function renderOptions() {
    options.replaceChildren();

    const color = selected.color;

    const choices = Object.entries(BARC).filter(
      ([, data]) => data[0] === color,
    );

    const heading = document.querySelector("#arcana-picker h3");

    heading.textContent = `Thay ngọc ${COLORS[color]} số ${selected.index + 1}`;

    choices.forEach(([id, data]) => {
      const button = document.createElement("button");

      button.type = "button";
      button.className = `arcana-option arcana-${color}`;

      if (build[color][selected.index] === id) {
        button.classList.add("selected");
      }

      const img = createGemImage(id);

      const description = document.createElement("span");
      description.textContent = data[1];

      button.append(img, description);

      button.addEventListener("click", () => {
        build[color][selected.index] = id;

        status.textContent = "Có thay đổi chưa được lưu.";

        renderCircle();
        renderOptions();
        renderStats();
        renderDetails();
      });

      options.appendChild(button);
    });
  }

  // ==============================
  // 6. TÍNH TỔNG CHỈ SỐ NGỌC
  // ==============================

  function calculateStats() {
    const totals = {};

    COLOR_ORDER.forEach((color) => {
      build[color].forEach((id) => {
        const description = BARC[id]?.[1] || "";

        const effects = description.split("·");

        effects.forEach((effect) => {
          const text = effect.trim();

          // Ví dụ:
          // Công vật lý +3.2
          // Tốc chạy +1%
          const match = text.match(/^(.+?)\s+([+-])\s*(\d+(?:[.,]\d+)?)(%)?$/);

          if (!match) return;

          const name = match[1].trim();
          const sign = match[2] === "-" ? -1 : 1;

          const value = parseFloat(match[3].replace(",", ".")) * sign;

          const unit = match[4] || "";

          const key = `${name}|${unit}`;

          if (!totals[key]) {
            totals[key] = {
              name,
              value: 0,
              unit,
            };
          }

          totals[key].value += value;
        });
      });
    });

    return Object.values(totals);
  }

  function formatNumber(number) {
    return Number(number.toFixed(3)).toLocaleString("vi-VN", {
      maximumFractionDigits: 3,
    });
  }

  function renderStats() {
    statsBox.replaceChildren();

    const stats = calculateStats().sort((a, b) =>
      a.name.localeCompare(b.name, "vi"),
    );

    stats.forEach((stat) => {
      const row = document.createElement("div");
      row.className = "arcana-stat-row";

      const name = document.createElement("span");
      name.textContent = stat.name;

      const value = document.createElement("strong");

      value.textContent =
        `${stat.value >= 0 ? "+" : ""}` +
        `${formatNumber(stat.value)}${stat.unit}`;

      row.append(name, value);
      statsBox.appendChild(row);
    });

    if (stats.length === 0) {
      statsBox.textContent = "Chưa có thuộc tính.";
    }
  }

  // ==============================
  // 7. CHI TIẾT VIÊN ĐANG CHỌN
  // ==============================

  function renderDetails() {
    detailsBox.replaceChildren();

    const color = selected.color;
    const id = build[color][selected.index];

    const img = createGemImage(id);
    img.className = "arcana-detail-image";

    const title = document.createElement("h4");
    title.textContent = `Ngọc ${COLORS[color]} ${selected.index + 1}/10`;

    const description = document.createElement("p");
    description.textContent = BARC[id]?.[1] || "";

    detailsBox.append(img, title, description);
  }

  // ==============================
  // 8. LƯU BẢNG NGỌC
  // ==============================

  document.getElementById("save-arcana").addEventListener("click", () => {
    const valid = COLOR_ORDER.every(
      (color) =>
        build[color].length === 10 &&
        build[color].every((id) => BARC[id]?.[0] === color),
    );

    if (!valid) {
      status.textContent = "Bảng ngọc phải đủ 10 viên mỗi màu.";
      return;
    }

    const data = loadData();

    data[storageId] = {
      red: [...build.red],
      purple: [...build.purple],
      teal: [...build.teal],
    };

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      status.textContent = "Đã lưu bảng ngọc thành công!";
      window.location.href = backUrl;
    } catch {
      status.textContent = "Không thể lưu bảng ngọc.";
    }
  });

  // Nút Lưu / Hủy bảng ngọc
  const saveButton = document.getElementById("save-arcana");

  const actionRow = document.createElement("div");
  actionRow.className = "arcana-save-actions";

  saveButton.before(actionRow);
  actionRow.appendChild(saveButton);

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.id = "cancel-arcana";
  cancelButton.textContent = "Hủy";

  actionRow.appendChild(cancelButton);

  cancelButton.addEventListener("click", () => {
    window.location.href = backUrl;
  });

  // ==============================
  // 9. KHỞI TẠO
  // ==============================

  renderProfile();
  renderCircle();
  renderOptions();
  renderStats();
  renderDetails();
});
