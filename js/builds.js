/*
 * builds.js
 * 12 ô trang bị + cửa hàng 3 cột.
 * Phụ trợ: Thổ hệ / Hỏa hệ.
 * Tạm ẩn cây ghép, giữ nguyên dữ liệu cũ.
 */

document.addEventListener("lqg:data-ready", () => {
  const heroId = new URLSearchParams(location.search).get("id");
  const hero = getHeroById(heroId);
  if (!hero) return;
  const page = new URLSearchParams(location.search).get("page") === "2" ? 2 : 1;

  const storageId = page === 2 ? `${hero.id}__page2` : hero.id;

  const section = [...document.querySelectorAll(".detail-section")].find(
    (el) => el.querySelector("h2")?.textContent.trim() === "Bộ trang bị",
  );

  if (!section) return;

  if (typeof ITEMS === "undefined") {
    section.textContent = "Không tải được dữ liệu trang bị.";
    return;
  }

  const STORAGE_KEY = "lqg_builds_v1";
  const SLOT_COUNT = 12;

  const CATEGORIES = {
    atk: "Công",
    mag: "Phép",
    def: "Thủ",
    boot: "Tốc chạy",
    jg: "Đi rừng",
    sup: "Phụ trợ",
  };

  let recipes = null;
  let recipeError = false;
  let activeSlot = null;
  let selectedItemId = null;
  let selectedCategory = "atk";
  let supportBranch = "earth";
  let currentGraph = null;

  // =====================================
  // LƯU VÀ ĐỌC BỘ TRANG BỊ
  // =====================================

  function loadData() {
    try {
      const value = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");

      return value && typeof value === "object" && !Array.isArray(value)
        ? value
        : {};
    } catch {
      return {};
    }
  }

  function getSavedBuild() {
    const saved = loadData()[storageId];

    return Array.from({ length: SLOT_COUNT }, (_, i) =>
      Array.isArray(saved) && typeof saved[i] === "string" ? saved[i] : null,
    );
  }

  // Bản nháp, chưa lưu vào localStorage
  let draftBuild = getSavedBuild();

  const coreStorageId = `${storageId}__core`;

  function getSavedCores() {
    const data = loadData();
    const cores = data[coreStorageId];
    const build = getSavedBuild();

    return Array.from({ length: SLOT_COUNT }, (_, i) =>
      Array.isArray(cores) &&
      typeof build[i] === "string" &&
      cores[i] === build[i]
        ? cores[i]
        : null,
    );
  }

  let draftCores = getSavedCores();
  let swapFrom = null;

  function swapSlots(first, second) {
    if (first !== second) {
      [draftBuild[first], draftBuild[second]] = [
        draftBuild[second],
        draftBuild[first],
      ];

      [draftCores[first], draftCores[second]] = [
        draftCores[second],
        draftCores[first],
      ];
    }

    swapFrom = null;
    renderSlots();
  }

  function getBuild() {
    return draftBuild;
  }

  function updateSlot(index, itemId) {
    if (draftBuild[index] !== itemId) {
      draftCores[index] = null;
    }

    draftBuild[index] = itemId;
    swapFrom = null;
    renderSlots();
    return true;
  }

  function createImage(item) {
    const img = document.createElement("img");

    img.src = item.image;
    img.alt = item.name;
    img.loading = "lazy";

    img.onerror = () => {
      img.style.visibility = "hidden";
    };

    return img;
  }

  function createText(content, className = "") {
    const element = document.createElement("p");
    element.className = className;
    element.textContent = content;
    return element;
  }

  function formatPrice(price) {
    return price == null
      ? "Giá chưa xác minh"
      : `${price.toLocaleString("vi-VN")} vàng`;
  }

  // =====================================
  // TẠO GIAO DIỆN
  // =====================================

  section.innerHTML = `
        <h2>Bộ trang bị</h2>

        <p class="build-description">
            Chọn tối đa 12 trang bị cho tướng.
        </p>


        <div id="build-slots" class="build-slots"></div>

        <div class="build-actions">
            <button id="save-build" type="button" disabled>
                Lưu thay đổi
            </button>

            <button id="cancel-build" type="button" disabled>
                Hủy
            </button>
        </div>

        <p id="build-status"></p>


        <div id="item-picker" class="item-picker" hidden>
            <div class="item-picker-header">
                <h3 id="picker-title">Cửa hàng trang bị</h3>
                <button id="close-item-picker" type="button">
                    Đóng
                </button>
            </div>

            <div class="shop-layout">
                <nav
                    id="shop-categories"
                    class="shop-categories"
                    aria-label="Nhóm trang bị">
                </nav>

                <div class="shop-main">
                    <input
                        id="item-search"
                        type="search"
                        placeholder="Tìm trang bị..."
                        aria-label="Tìm trang bị"
                    >

                    <div id="item-list" class="item-list"></div>

                    <div class="shop-recipe-area">
                        <h4>Cây ghép trang bị</h4>
                        <p id="recipe-message"
                           class="shop-recipe-message">
                            Chọn một trang bị để xem công thức.
                        </p>
                        <div id="recipe-tree"></div>
                    </div>
                </div>

                <aside class="shop-info">
                    <div id="shop-item-info">
                        Chọn một trang bị để xem chi tiết.
                    </div>

                    <button
                        id="shop-confirm"
                        type="button"
                        disabled>
                        Thêm vào ô đã chọn
                    </button>
                </aside>
            </div>
        </div>
    `;

  const slotsContainer = section.querySelector("#build-slots");
  const buildStatus = section.querySelector("#build-status");
  const saveBuildButton = section.querySelector("#save-build");
  const cancelBuildButton = section.querySelector("#cancel-build");
  const picker = section.querySelector("#item-picker");
  const itemList = section.querySelector("#item-list");
  const search = section.querySelector("#item-search");
  const info = section.querySelector("#shop-item-info");
  const confirmButton = section.querySelector("#shop-confirm");
  const recipeTree = section.querySelector("#recipe-tree");
  const recipeMessage = section.querySelector("#recipe-message");
  const categories = section.querySelector("#shop-categories");

  // Tạm ẩn cây ghép và nút xác nhận.
  section.querySelector(".shop-recipe-area").style.display = "none";
  confirmButton.style.display = "none";

  // =====================================
  // HIỂN THỊ 12 Ô TRANG BỊ
  // =====================================

  function renderSlots() {
    slotsContainer.replaceChildren();

    const build = getBuild();

    build.forEach((itemId, index) => {
      const item = itemId ? getItemById(itemId) : null;

      const slot = document.createElement("div");
      slot.className = "build-slot";
      slot.classList.toggle("swap-source", swapFrom === index);

      const button = document.createElement("button");
      button.type = "button";
      button.className = "build-slot-button";

      if (item) {
        button.appendChild(createImage(item));

        const name = document.createElement("span");
        name.textContent = item.name;
        button.appendChild(name);
      } else {
        const plus = document.createElement("span");
        plus.className = "build-slot-plus";
        plus.textContent = "+";

        const label = document.createElement("span");
        label.textContent = `Ô ${index + 1}`;

        button.append(plus, label);
      }

      button.addEventListener("click", () => {
        if (swapFrom !== null) {
          swapSlots(swapFrom, index);
        } else {
          openPicker(index);
        }
      });

      slot.appendChild(button);

      if (itemId) {
        const swap = document.createElement("button");
        swap.type = "button";
        swap.className = "build-swap";
        swap.textContent = "↔";
        swap.title = swapFrom === index ? "Hủy hoán đổi" : "Hoán đổi vị trí";

        swap.addEventListener("click", () => {
          if (swapFrom === null) {
            swapFrom = index;
            closePicker();
            renderSlots();
          } else {
            swapSlots(swapFrom, index);
          }
        });

        slot.appendChild(swap);

        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "build-remove";
        remove.textContent = "Xóa";

        remove.addEventListener("click", () => {
          updateSlot(index, null);
        });

        slot.appendChild(remove);
      }

      slotsContainer.appendChild(slot);
    });

    const filled = build.filter(Boolean).length;

    const hasChanges =
      JSON.stringify(draftBuild) !== JSON.stringify(getSavedBuild()) ||
      JSON.stringify(draftCores) !== JSON.stringify(getSavedCores());

    buildStatus.textContent =
      `Đã chọn ${filled}/${SLOT_COUNT} ô trang bị` +
      (hasChanges ? " · Chưa lưu" : "");

    saveBuildButton.disabled = false;
    cancelBuildButton.disabled = false;
  }

  // =====================================
  // DANH MỤC TRANG BỊ
  // =====================================

  Object.entries(CATEGORIES).forEach(([id, title]) => {
    const button = document.createElement("button");

    button.type = "button";
    button.className = "shop-category";
    button.dataset.category = id;
    button.textContent = title;

    button.addEventListener("click", () => {
      selectedCategory = id;

      // Vào Phụ trợ mặc định Thổ hệ.
      if (id === "sup") {
        supportBranch = "earth";
      }

      itemList.scrollTop = 0;
      renderCategories();
      renderItems();
    });

    categories.appendChild(button);
  });

  function renderCategories() {
    categories.querySelectorAll("button").forEach((button) => {
      button.classList.toggle(
        "active",
        button.dataset.category === selectedCategory,
      );
    });
  }

  // =====================================
  // MỞ VÀ ĐÓNG CỬA HÀNG
  // =====================================

  function openPicker(index) {
    activeSlot = index;
    selectedCategory = "atk";
    supportBranch = "earth";
    selectedItemId = getBuild()[index];

    search.value = "";
    picker.hidden = false;

    section.querySelector("#picker-title").textContent =
      `Chọn trang bị — Ô ${index + 1}`;

    renderCategories();
    renderItems();
    renderDetails();

    picker.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }

  function closePicker() {
    picker.hidden = true;
    activeSlot = null;
    currentGraph = null;
  }

  section
    .querySelector("#close-item-picker")
    .addEventListener("click", closePicker);

  // Lưu toàn bộ 12 ô trang bị
  saveBuildButton.addEventListener("click", () => {
    const data = loadData();
    data[storageId] = [...draftBuild];
    data[coreStorageId] = [...draftCores];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));

      closePicker();
      renderSlots();

      buildStatus.textContent = "Đã lưu bộ trang bị thành công!";
      window.location.href = `hero.html?id=${encodeURIComponent(hero.id)}&page=${page}`;
    } catch {
      alert("Không thể lưu bộ trang bị.");
    }
  });

  // Hủy mọi thay đổi chưa lưu
  cancelBuildButton.addEventListener("click", () => {
    draftBuild = getSavedBuild();
    draftCores = getSavedCores();
    swapFrom = null;

    closePicker();
    renderSlots();

    buildStatus.textContent = "Đã hủy thay đổi.";
    window.location.href = `hero.html?id=${encodeURIComponent(hero.id)}&page=${page}`;
  });

  // =====================================
  // DANH SÁCH TRANG BỊ THEO 3 CỘT
  // =====================================

  function renderItems() {
    const keyword = search.value.trim().toLocaleLowerCase("vi");

    const scrollTop = itemList.scrollTop;
    itemList.replaceChildren();

    // Lấy thứ tự từ shop-order.js.
    // Riêng Phụ trợ chỉ hiển thị 5 món ở cột 3.
    const columns = (SHOP_ORDER[selectedCategory] || []).map(
      (idsText, columnIndex) => {
        if (selectedCategory !== "sup" || columnIndex !== 2) {
          return idsText;
        }

        const prefix =
          supportBranch === "earth" ? "mother-earth-" : "wildfire-";

        return idsText
          .split(/\s+/)
          .filter((id) => id.startsWith(prefix))
          .join(" ");
      },
    );

    let visibleCount = 0;

    columns.forEach((idsText) => {
      const column = document.createElement("div");
      column.className = "shop-item-column";

      const ids = idsText.split(/\s+/).filter(Boolean);

      ids.forEach((id) => {
        const item = getItemById(id);
        if (!item) return;

        const matchesSearch = item.name
          .toLocaleLowerCase("vi")
          .includes(keyword);

        if (!matchesSearch) return;

        visibleCount++;

        const button = document.createElement("button");
        button.type = "button";
        button.className = "item-option";

        button.classList.toggle("active", item.id === selectedItemId);

        // Đánh dấu nhánh Thổ hệ / Hỏa hệ.
        const currentBranchItem =
          supportBranch === "earth" ? "earth-gem" : "fire-gem";

        button.classList.toggle(
          "support-branch-active",
          selectedCategory === "sup" && id === currentBranchItem,
        );

        const itemInfo = document.createElement("span");
        itemInfo.className = "item-option-info";

        const name = document.createElement("strong");
        name.textContent = item.name;

        const price = document.createElement("span");
        price.textContent = formatPrice(item.price);

        itemInfo.append(name, price);
        button.append(createImage(item), itemInfo);

        // Nhấn món đồ sẽ tự động lưu.
        button.addEventListener("click", () => {
          if (activeSlot === null) return;

          // Đổi nhánh Phụ trợ.
          if (selectedCategory === "sup") {
            if (id === "earth-gem") {
              supportBranch = "earth";
              itemList.scrollTop = 0;
            } else if (id === "fire-gem") {
              supportBranch = "fire";
              itemList.scrollTop = 0;
            }
          }

          // Lưu trang bị vào ô đang chọn.
          if (!updateSlot(activeSlot, item.id)) {
            return;
          }

          selectedItemId = item.id;

          renderItems();
          renderDetails();

          buildStatus.textContent = `Đã chọn ${item.name} vào ô ${activeSlot + 1} (chưa lưu).`;
        });

        column.appendChild(button);
      });

      itemList.appendChild(column);
    });

    if (visibleCount === 0) {
      itemList.replaceChildren(createText("Không tìm thấy trang bị."));
    }

    itemList.scrollTop = scrollTop;
  }

  search.addEventListener("input", () => {
    itemList.scrollTop = 0;
    renderItems();
  });

  // =====================================
  // THÔNG TIN CHI TIẾT
  // =====================================

  function renderDetails() {
    info.replaceChildren();

    confirmButton.disabled = !selectedItemId || activeSlot === null;

    if (!selectedItemId) {
      info.appendChild(createText("Chọn một trang bị trong danh sách."));

      recipeMessage.textContent = "Chọn một trang bị để xem công thức.";

      recipeTree.replaceChildren();
      return;
    }

    const item = getItemById(selectedItemId);
    if (!item) return;

    const heading = document.createElement("div");
    heading.className = "shop-detail-heading";

    heading.appendChild(createImage(item));

    const headingInfo = document.createElement("div");

    const name = document.createElement("h4");
    name.textContent = item.name;

    headingInfo.append(name, createText(formatPrice(item.price)));

    heading.appendChild(headingInfo);
    info.appendChild(heading);

    if (item.stats?.length) {
      const list = document.createElement("ul");

      item.stats.forEach((value) => {
        const li = document.createElement("li");
        li.textContent = value;
        list.appendChild(li);
      });

      info.appendChild(list);
    }

    if (item.passives?.length) {
      item.passives.forEach((passive) => {
        const title = document.createElement("strong");
        title.textContent = passive.name;

        info.append(title, createText(passive.description));
      });
    }

    // Tạm ẩn chức năng ghép đồ.
    // renderRecipeTree(selectedItemId);
  }

  confirmButton.addEventListener("click", () => {
    if (
      activeSlot !== null &&
      selectedItemId &&
      updateSlot(activeSlot, selectedItemId)
    ) {
      closePicker();
    }
  });

  // =====================================
  // TẠO CÂY GHÉP TRANG BỊ
  // Giữ nguyên để sử dụng về sau.
  // =====================================

  function renderRecipeTree(itemId) {
    recipeTree.replaceChildren();
    currentGraph = null;

    if (recipeError) {
      recipeMessage.textContent =
        "Không tải được item-recipes.json. " +
        "Kiểm tra đường dẫn và Live Server.";
      return;
    }

    if (!recipes) {
      recipeMessage.textContent = "Đang đọc dữ liệu công thức...";
      return;
    }

    const directRecipe = recipes[itemId];

    if (directRecipe === null || directRecipe === undefined) {
      recipeMessage.textContent =
        "Chưa xác minh công thức ghép " + "của trang bị này.";
      return;
    }

    if (directRecipe.length === 0) {
      recipeMessage.textContent =
        "Trang bị cơ bản — không cần nguyên liệu ghép.";
      return;
    }

    recipeMessage.textContent =
      "Đường nối thể hiện nguyên liệu ghép trực tiếp. " +
      "Dấu ? nghĩa là chưa xác minh công thức " +
      "của trang bị trung gian.";

    const nodes = [];
    const edges = [];
    let sequence = 0;

    function addNode(id, depth, ancestors = new Set()) {
      const uid = `recipe-${sequence++}`;
      const formula = recipes[id];

      nodes.push({
        uid,
        id,
        depth,
        formula,
      });

      if (
        Array.isArray(formula) &&
        formula.length > 0 &&
        depth < 5 &&
        !ancestors.has(id)
      ) {
        const path = new Set(ancestors);
        path.add(id);

        formula.forEach((childId) => {
          const childUid = addNode(childId, depth + 1, path);

          edges.push([childUid, uid]);
        });
      }

      return uid;
    }

    addNode(itemId, 0);

    const maxDepth = Math.max(...nodes.map((node) => node.depth));

    const visual = document.createElement("div");
    visual.className = "shop-recipe-visual";

    visual.style.setProperty("--recipe-columns", String(maxDepth + 1));

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");

    svg.classList.add("shop-recipe-lines");
    visual.appendChild(svg);

    for (let depth = maxDepth; depth >= 0; depth--) {
      const column = document.createElement("div");
      column.className = "shop-recipe-column";

      nodes
        .filter((node) => node.depth === depth)
        .forEach((node) => {
          const item = getItemById(node.id);
          if (!item) return;

          const button = document.createElement("button");
          button.type = "button";
          button.className = "shop-recipe-node";
          button.dataset.node = node.uid;

          button.appendChild(createImage(item));

          const label = document.createElement("span");
          label.textContent = item.name;
          button.appendChild(label);

          if (node.formula === null || node.formula === undefined) {
            const mark = document.createElement("b");
            mark.className = "recipe-unverified";
            mark.textContent = "?";
            mark.title = "Chưa xác minh công thức";
            button.appendChild(mark);
          }

          button.addEventListener("click", () => {
            selectedItemId = node.id;
            renderItems();
            renderDetails();
          });

          column.appendChild(button);
        });

      visual.appendChild(column);
    }

    recipeTree.appendChild(visual);

    currentGraph = {
      visual,
      svg,
      edges,
    };

    requestAnimationFrame(drawRecipeLines);
  }

  // =====================================
  // VẼ ĐƯỜNG NỐI BẰNG SVG
  // =====================================

  function drawRecipeLines() {
    if (!currentGraph || picker.hidden) return;

    const { visual, svg, edges } = currentGraph;
    const root = visual.getBoundingClientRect();

    if (!root.width) return;

    svg.setAttribute(
      "viewBox",
      `0 0 ${visual.scrollWidth} ${visual.scrollHeight}`,
    );

    svg.setAttribute("width", visual.scrollWidth);
    svg.setAttribute("height", visual.scrollHeight);

    svg.replaceChildren();

    edges.forEach(([from, to]) => {
      const first = visual
        .querySelector(`[data-node="${from}"]`)
        ?.getBoundingClientRect();

      const second = visual
        .querySelector(`[data-node="${to}"]`)
        ?.getBoundingClientRect();

      if (!first || !second) return;

      const x1 = first.right - root.left;
      const y1 = first.top + first.height / 2 - root.top;

      const x2 = second.left - root.left;
      const y2 = second.top + second.height / 2 - root.top;

      const middle = (x1 + x2) / 2;

      const path = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "path",
      );

      path.setAttribute("d", `M ${x1} ${y1} H ${middle} V ${y2} H ${x2}`);

      svg.appendChild(path);
    });
  }

  window.addEventListener("resize", () => {
    requestAnimationFrame(drawRecipeLines);
  });

  // =====================================
  // ĐỌC FILE CÔNG THỨC JSON
  // =====================================

  async function loadRecipes() {
    try {
      const response = await fetch("item-recipes.json", { cache: "no-store" });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (!data || typeof data !== "object" || Array.isArray(data)) {
        throw new Error("Dữ liệu JSON không hợp lệ.");
      }

      recipes = data;
    } catch (error) {
      recipeError = true;

      console.warn("Không tải được công thức ghép:", error);
    }

    if (!picker.hidden) {
      renderDetails();
    }
  }

  // =====================================
  // KHỞI TẠO
  // =====================================

  renderSlots();

  // Tạm thời không đọc công thức ghép.
  // loadRecipes();
});
