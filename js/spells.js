/* =========================================
   LIÊN QUÂN GUIDE - PHÉP BỔ TRỢ
   11 phép bổ trợ
========================================= */

const LQG_SPELLS_KEY = "lqg_spells_v1";

// Danh sách toàn bộ phép bổ trợ
const SPELLS = {};
window.LQG_prepareSpells = function (rows) {
  for (const id of Object.keys(SPELLS)) delete SPELLS[id];
  for (const x of rows) SPELLS[x.id] = [x.name, x.description];
};

/* =========================================
   HIỂN THỊ PHÉP BỔ TRỢ
========================================= */

// =======================================
// ĐỌC DỮ LIỆU PHÉP BỔ TRỢ
// =======================================

function readSpellSelections() {
  try {
    const data = JSON.parse(localStorage.getItem(LQG_SPELLS_KEY) || "{}");

    if (data && typeof data === "object" && !Array.isArray(data)) {
      return data;
    }
  } catch (error) {
    console.warn("Lỗi đọc phép bổ trợ:", error);
  }

  return {};
}

// =======================================
// XEM TRƯỚC TẠI TRANG TƯỚNG
// =======================================

function renderSpellSelector(hero, container, page = 1) {
  if (!hero || !container) return;

  const storageId = page === 2 ? `${hero.id}__page2` : hero.id;

  const saved = readSpellSelections();
  const id = saved[storageId];

  const selectedId = Object.hasOwn(SPELLS, id) ? id : null;

  const preview = document.createElement("a");
  preview.className = "spell-preview";
  preview.href = `spells.html?id=${encodeURIComponent(hero.id)}&page=${page}`;

  const content = document.createElement("div");
  content.className = "spell-preview-content";

  const title = document.createElement("h3");
  title.textContent = "Phép bổ trợ";

  const selected = document.createElement("div");
  selected.className = "spell-preview-selected";

  if (selectedId) {
    const img = document.createElement("img");
    img.src = `images/spells/t-${selectedId}.webp`;
    img.alt = SPELLS[selectedId][0];

    img.onerror = () => {
      img.style.display = "none";
    };

    const name = document.createElement("span");
    name.textContent = SPELLS[selectedId][0];

    selected.append(img, name);
  } else {
    selected.textContent = "Chưa chọn phép bổ trợ";
  }

  const arrow = document.createElement("span");
  arrow.className = "spell-preview-arrow";
  arrow.textContent = "❯";

  content.append(title, selected);
  preview.append(content, arrow);
  container.appendChild(preview);
}

// =======================================
// TRANG CHỌN PHÉP BỔ TRỢ
// =======================================

document.addEventListener("lqg:data-ready", () => {
  const list = document.getElementById("spell-list");

  // Không chạy phần này tại hero.html
  if (!list) return;

  const params = new URLSearchParams(location.search);
  const heroId = params.get("id");
  const page = params.get("page") === "2" ? 2 : 1;

  const storageId = page === 2 ? `${heroId}__page2` : heroId;

  const backUrl = `hero.html?id=${encodeURIComponent(heroId)}&page=${page}`;

  const hero = getHeroById(heroId);

  const info = document.getElementById("spell-info");
  const useButton = document.getElementById("spell-use");
  const status = document.getElementById("spell-status");
  const profile = document.getElementById("spell-hero");
  const back = document.getElementById("spell-back");

  if (!hero) {
    profile.textContent = "Không tìm thấy tướng.";
    useButton.disabled = true;
    return;
  }

  back.href = backUrl;

  document.title = `Phép bổ trợ - ${hero.name}`;

  // Tạo hai nút Lưu / Hủy
  const actionRow = document.createElement("div");
  actionRow.className = "spell-save-actions";

  useButton.before(actionRow);
  actionRow.appendChild(useButton);

  const cancelButton = document.createElement("button");
  cancelButton.type = "button";
  cancelButton.id = "spell-cancel";
  cancelButton.textContent = "Hủy";

  actionRow.appendChild(cancelButton);

  cancelButton.addEventListener("click", () => {
    window.location.href = backUrl;
  });

  // Thông tin tướng
  const avatar = document.createElement("img");
  avatar.src = `images/heroes/${
    hero.id === "flowborn" ? "flowborn-ad" : hero.id
  }.webp`;
  avatar.alt = hero.name;

  const heroName = document.createElement("h2");
  heroName.textContent = hero.name;

  profile.append(avatar, heroName);

  // Phép đang lưu
  const saved = readSpellSelections();

  let savedId = Object.hasOwn(SPELLS, saved[storageId])
    ? saved[storageId]
    : null;

  // Phép đang xem, chưa chắc đã lưu
  let viewingId = savedId || Object.keys(SPELLS)[0];

  const buttons = new Map();

  // Tạo danh sách 11 phép
  for (const [id, spell] of Object.entries(SPELLS)) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "spell-choice";

    const image = document.createElement("img");
    image.src = `images/spells/t-${id}.webp`;
    image.alt = spell[0];

    image.onerror = () => {
      image.style.display = "none";
    };

    const name = document.createElement("span");
    name.textContent = spell[0];

    const check = document.createElement("span");
    check.className = "spell-check";
    check.textContent = "✓";

    button.append(image, name, check);

    button.addEventListener("click", () => {
      viewingId = id;
      status.textContent = "";
      update();
    });

    list.appendChild(button);
    buttons.set(id, button);
  }

  // Cập nhật giao diện
  function update() {
    for (const [id, button] of buttons) {
      button.classList.toggle("active", id === viewingId);

      button.classList.toggle("equipped", id === savedId);

      button.setAttribute("aria-pressed", String(id === viewingId));
    }

    const [name, description] = SPELLS[viewingId];

    info.replaceChildren();

    const image = document.createElement("img");
    image.className = "spell-info-image";
    image.src = `images/spells/t-${viewingId}.webp`;
    image.alt = name;

    const heading = document.createElement("h2");
    heading.textContent = name;

    const text = document.createElement("p");
    text.className = "spell-info-description";
    text.textContent = description || "Chưa có mô tả cho phép bổ trợ này.";

    info.append(image, heading, text);

    const using = viewingId === savedId;

    useButton.disabled = using;
    useButton.textContent = using ? "Đã lưu" : "Lưu";
  }

  // Lưu phép bổ trợ
  useButton.addEventListener("click", () => {
    const data = readSpellSelections();
    data[storageId] = viewingId;

    try {
      localStorage.setItem(LQG_SPELLS_KEY, JSON.stringify(data));

      savedId = viewingId;
      update();

      status.textContent = "Đã lưu phép bổ trợ cho " + hero.name;
      window.location.href = backUrl;
    } catch (error) {
      console.error(error);
      status.textContent = "Không thể lưu phép bổ trợ.";
    }
  });

  update();
});
