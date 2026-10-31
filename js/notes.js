/*
 * notes.js
 * Ghi chú cách chơi cho từng tướng.
 * Lưu dữ liệu bằng localStorage.
 */

document.addEventListener("lqg:data-ready", () => {
  const params = new URLSearchParams(window.location.search);
  const heroId = params.get("id");
  const page = params.get("page") === "2" ? 2 : 1;
  const storageId = page === 2 ? `${heroId}__page2` : heroId;
  const hero = getHeroById(heroId);

  if (!hero) return;

  // Tìm khu vực ghi chú trong hero.html
  const section = [...document.querySelectorAll(".detail-section")].find(
    (el) => el.querySelector("h2")?.textContent === "Ghi chú cách chơi",
  );

  if (!section) return;

  const STORAGE_KEY = "lqg_notes_v1";

  // Đọc dữ liệu
  function loadData() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
    } catch {
      return {};
    }
  }

  // Lưu dữ liệu
  function saveData(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      alert("Không thể lưu ghi chú.");
      return false;
    }
  }

  // Tạo giao diện
  section.innerHTML = `
        <h2>Ghi chú cách chơi</h2>

        <p class="notes-description">
            Ghi lại combo, chiến thuật và kinh nghiệm
            sử dụng ${hero.name}.
        </p>

        <textarea
            id="hero-notes"
            class="notes-textarea"
            placeholder="Nhập ghi chú của m tại đây..."
            rows="10"
        ></textarea>

        <div class="notes-actions">
            <button id="save-notes" type="button">
                Lưu ghi chú
            </button>

            <button id="delete-notes" type="button">
                Xóa ghi chú
            </button>
        </div>

        <p id="notes-status"></p>
    `;

  const noteInput = section.querySelector("#hero-notes");
  const saveButton = section.querySelector("#save-notes");
  const deleteButton = section.querySelector("#delete-notes");
  const status = section.querySelector("#notes-status");

  // Hiển thị ghi chú đã lưu
  const data = loadData();
  noteInput.value = data[storageId] || "";

  // Lưu ghi chú
  saveButton.addEventListener("click", () => {
    const latest = loadData();

    latest[storageId] = noteInput.value;

    if (saveData(latest)) {
      status.textContent = "Đã lưu ghi chú thành công!";
    }
  });

  // Xóa ghi chú
  deleteButton.addEventListener("click", () => {
    if (!confirm("M có chắc muốn xóa ghi chú này?")) {
      return;
    }

    const latest = loadData();
    delete latest[storageId];

    if (saveData(latest)) {
      noteInput.value = "";
      status.textContent = "Đã xóa ghi chú.";
    }
  });

  // Thông báo khi có thay đổi chưa lưu
  noteInput.addEventListener("input", () => {
    status.textContent = "Có thay đổi chưa được lưu.";
  });
});
