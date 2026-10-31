/*
 * storage.js
 * Quản lý sao lưu và khôi phục cấu hình người dùng (localStorage).
 */

const LQGStorage = (() => {
  const KEYS = {
    favorites: "lqg_favorites_v1",
    matchups: "lqg_matchups_v1",
    builds: "lqg_builds_v1",
    arcana: "lqg_arcana_v1",
    insignias: "lqg_insignias_v1",
    spells: "lqg_spells_v1",
    notes: "lqg_notes_v1",
  };

  const VERSION = 3;

  const OLD_TYPES = ["matchups", "builds", "notes"];

  const V2_TYPES = [
    "favorites",
    "matchups",
    "builds",
    "arcana",
    "insignias",
    "notes",
  ];

  const ALL_TYPES = Object.keys(KEYS);

  const isObject = (value) =>
    value !== null && typeof value === "object" && !Array.isArray(value);

  // ==============================
  // 1. ĐỌC DỮ LIỆU
  // ==============================

  function getAllData() {
    const data = {};

    for (const [type, key] of Object.entries(KEYS)) {
      const raw = localStorage.getItem(key);

      if (raw === null) {
        data[type] = type === "favorites" ? [] : {};
        continue;
      }

      try {
        data[type] = JSON.parse(raw);
      } catch {
        throw new Error(`Dữ liệu ${type} trong trình duyệt bị lỗi.`);
      }
    }

    return data;
  }

  // ==============================
  // 2. KIỂM TRA DỮ LIỆU
  // ==============================

  function validateData(data, version) {
    const requiredTypes =
      version === 1 ? OLD_TYPES : version === 2 ? V2_TYPES : ALL_TYPES;
    for (const type of requiredTypes) {
      if (!Object.prototype.hasOwnProperty.call(data, type)) {
        throw new Error(`Thiếu dữ liệu ${type}.`);
      }
    }

    const { matchups, builds, notes } = data;

    if (!isObject(matchups) || !isObject(builds) || !isObject(notes)) {
      throw new Error("Dữ liệu khắc chế, trang bị hoặc ghi chú không hợp lệ.");
    }

    // Bảng khắc chế
    for (const enemies of Object.values(matchups)) {
      if (!isObject(enemies)) {
        throw new Error("Bảng khắc chế không hợp lệ.");
      }

      for (const entry of Object.values(enemies)) {
        if (
          !isObject(entry) ||
          typeof entry.difficulty !== "string" ||
          typeof entry.note !== "string"
        ) {
          throw new Error("Đánh giá khắc chế không hợp lệ.");
        }
      }
    }

    // Bộ trang bị: tối đa 12 ô
    for (const build of Object.values(builds)) {
      if (
        !Array.isArray(build) ||
        build.length > 12 ||
        !build.every((id) => id === null || typeof id === "string")
      ) {
        throw new Error("Bộ trang bị không hợp lệ.");
      }
    }

    // Ghi chú
    for (const note of Object.values(notes)) {
      if (typeof note !== "string") {
        throw new Error("Ghi chú không hợp lệ.");
      }
    }

    // Backup phiên bản 1 chỉ có 3 phần.
    if (version === 1) {
      return true;
    }

    const { favorites, arcana, insignias } = data;

    // Tướng ghim có thể lưu theo mảng hoặc object.
    if (!Array.isArray(favorites) && !isObject(favorites)) {
      throw new Error("Danh sách tướng ghim không hợp lệ.");
    }

    // Bảng ngọc
    if (!isObject(arcana)) {
      throw new Error("Dữ liệu bảng ngọc không hợp lệ.");
    }

    for (const build of Object.values(arcana)) {
      if (
        !isObject(build) ||
        !["red", "purple", "teal"].every(
          (color) =>
            Array.isArray(build[color]) &&
            build[color].length === 10 &&
            build[color].every((id) => typeof id === "string"),
        )
      ) {
        throw new Error("Bảng ngọc phải có đủ 10 viên mỗi màu.");
      }
    }

    // Phù hiệu: giữ nguyên cấu trúc đang sử dụng.
    if (!isObject(insignias)) {
      throw new Error("Dữ liệu phù hiệu không hợp lệ.");
    }

    for (const build of Object.values(insignias)) {
      if (!isObject(build)) {
        throw new Error("Bộ phù hiệu không hợp lệ.");
      }

      // Hỗ trợ dữ liệu cũ không có Core, nhưng kiểm tra cấu trúc
      // những trường đã tồn tại để tránh nhập file bị hỏng.
      for (const [field, maximum] of [
        ["main", 3],
        ["sub", 2],
        ["core", 5],
      ]) {
        if (Object.prototype.hasOwnProperty.call(build, field)) {
          const ids = build[field];
          if (
            !Array.isArray(ids) ||
            ids.length > maximum ||
            !ids.every((id) => id === null || typeof id === "string")
          ) {
            throw new Error(`Danh sách ${field} của phù hiệu không hợp lệ.`);
          }
        }
      }

      if (
        Object.prototype.hasOwnProperty.call(build, "subBranches") &&
        (!Array.isArray(build.subBranches) ||
          build.subBranches.length > 2 ||
          !build.subBranches.every((branch) => typeof branch === "string"))
      ) {
        throw new Error("Nhánh phù hiệu phụ không hợp lệ.");
      }
    }

    // Kiểm tra dữ liệu Phép bổ trợ từ phiên bản 3
    if (version === 3) {
      const { spells } = data;

      if (
        !isObject(spells) ||
        !Object.values(spells).every(
          (id) => typeof id === "string" && id.trim() !== "",
        )
      ) {
        throw new Error("Dữ liệu phép bổ trợ không hợp lệ.");
      }
    }

    return true;
  }

  // ==============================
  // 3. XUẤT FILE SAO LƯU
  // ==============================

  function createBackup() {
    const backup = {
      app: "LienQuanGuide",
      version: VERSION,
      exportedAt: new Date().toISOString(),
      data: getAllData(),
    };

    validateBackup(backup);

    return backup;
  }

  // ==============================
  // 4. KIỂM TRA FILE SAO LƯU
  // ==============================

  function validateBackup(backup) {
    if (
      !isObject(backup) ||
      backup.app !== "LienQuanGuide" ||
      ![1, 2, 3].includes(backup.version) ||
      !isObject(backup.data)
    ) {
      throw new Error("File không đúng định dạng sao lưu LienQuanGuide.");
    }

    return validateData(backup.data, backup.version);
  }

  // ==============================
  // 5. KHÔI PHỤC DỮ LIỆU
  // ==============================

  function restoreBackup(backup) {
    validateBackup(backup);

    // V1 chỉ thay thế 3 phần cũ.
    // V2 thay thế đủ 6 phần.
    const types =
      backup.version === 1
        ? OLD_TYPES
        : backup.version === 2
          ? V2_TYPES
          : ALL_TYPES;

    const previousValues = {};

    for (const type of types) {
      previousValues[type] = localStorage.getItem(KEYS[type]);
    }

    try {
      for (const type of types) {
        localStorage.setItem(KEYS[type], JSON.stringify(backup.data[type]));
      }
    } catch (error) {
      // Hoàn tác những thay đổi nếu ghi thất bại.
      for (const type of types) {
        const previous = previousValues[type];

        try {
          if (previous === null) {
            localStorage.removeItem(KEYS[type]);
          } else {
            localStorage.setItem(KEYS[type], previous);
          }
        } catch (rollbackError) {
          console.error("Không thể hoàn tác:", type, rollbackError);
        }
      }

      throw new Error("Khôi phục thất bại. Hãy kiểm tra dữ liệu trình duyệt.");
    }

    return true;
  }

  return {
    createBackup,
    validateBackup,
    restoreBackup,
    getAllData,
  };
})();
