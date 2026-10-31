/*
 * backup.js
 * Xuất và nhập cấu hình LienQuanGuide (không gồm JSON dữ liệu game).
 */

document.addEventListener("DOMContentLoaded", () => {
  const exportButton = document.getElementById("export-data");
  const importButton = document.getElementById("import-data");
  const fileInput = document.getElementById("import-file");

  if (!exportButton || !importButton || !fileInput) {
    return;
  }

  // ==============================
  // XUẤT DỮ LIỆU
  // ==============================

  exportButton.addEventListener("click", (event) => {
    event.preventDefault();

    try {
      const backup = LQGStorage.createBackup();

      const json = JSON.stringify(backup, null, 2);

      const blob = new Blob([json], {
        type: "application/json;charset=utf-8",
      });

      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");

      const date = new Date().toLocaleDateString("en-CA");

      link.href = url;
      link.download = `LienQuanGuide-${date}.json`;

      document.body.appendChild(link);
      link.click();
      link.remove();

      setTimeout(() => {
        URL.revokeObjectURL(url);
      }, 1000);
    } catch (error) {
      alert("Xuất dữ liệu thất bại:\n" + error.message);
    }
  });

  // ==============================
  // MỞ FILE SAO LƯU
  // ==============================

  importButton.addEventListener("click", (event) => {
    event.preventDefault();
    fileInput.click();
  });

  // ==============================
  // NHẬP VÀ KHÔI PHỤC
  // ==============================

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files?.[0];

    if (!file) return;

    try {
      if (file.size > 5 * 1024 * 1024) {
        throw new Error("File quá lớn. Giới hạn là 5 MB.");
      }

      const content = await file.text();
      const backup = JSON.parse(content);

      LQGStorage.validateBackup(backup);

      const labels = {
        favorites: "Tướng đã ghim",
        matchups: "Bảng khắc chế",
        builds: "Bộ trang bị",
        arcana: "Bảng ngọc",
        insignias: "Phù hiệu",
        spells: "Phép bổ trợ",
        notes: "Ghi chú",
      };

      const v1Types = ["matchups", "builds", "notes"];

      const v2Types = [
        "favorites",
        "matchups",
        "builds",
        "arcana",
        "insignias",
        "notes",
      ];

      const types =
        backup.version === 1
          ? v1Types
          : backup.version === 2
            ? v2Types
            : Object.keys(labels);

      const untouched = Object.keys(labels).filter(
        (type) => !types.includes(type),
      );

      let message =
        `File sao lưu phiên bản ${backup.version}.\n\n` +
        "Dữ liệu sẽ được khôi phục và thay thế:\n" +
        types.map((type) => `- ${labels[type]}`).join("\n");

      if (untouched.length > 0) {
        message +=
          "\n\nDữ liệu hiện tại được giữ nguyên:\n" +
          untouched.map((type) => `- ${labels[type]}`).join("\n");
      }

      message +=
        "\n\nDữ liệu game trong game-data/*.json sẽ không bị thay đổi." +
        "\n\nBạn có muốn tiếp tục không?";

      if (!confirm(message)) return;

      LQGStorage.restoreBackup(backup);

      alert("Đã khôi phục dữ liệu thành công!");

      window.location.reload();
    } catch (error) {
      alert("Nhập dữ liệu thất bại:\n" + error.message);
    } finally {
      fileInput.value = "";
    }
  });
});
