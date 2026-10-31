/*
 * app.js
 * Danh sách tướng, tìm kiếm, lọc và ghim tướng.
 */

document.addEventListener("lqg:data-ready", () => {
  const heroList = document.getElementById("hero-list");
  const heroSearch = document.getElementById("hero-search");
  const heroCount = document.getElementById("hero-count");
  const filters = document.querySelector(".lane-filters");

  const STORAGE_KEY = "lqg_favorites_v1";

  let currentLane = "all";
  let searchKeyword = "";
  let favoritesOnly = false;

  function loadFavorites() {
    try {
      const data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");

      return Array.isArray(data)
        ? data.filter((id) => typeof id === "string")
        : [];
    } catch {
      return [];
    }
  }

  let favorites = loadFavorites();

  // Tạo nút lọc tướng đã ghim
  const favoriteFilter = document.createElement("button");
  favoriteFilter.type = "button";
  favoriteFilter.className = "filter-btn";
  favoriteFilter.textContent = "★ Đã ghim";
  filters.appendChild(favoriteFilter);

  function toggleFavorite(heroId) {
    if (favorites.includes(heroId)) {
      favorites = favorites.filter((id) => id !== heroId);
    } else {
      favorites.push(heroId);
    }

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(favorites));
      renderHeroes();
    } catch {
      favorites = loadFavorites();
      alert("Không thể lưu tướng đã ghim.");
    }
  }

  function renderHeroes() {
    const query = createHeroId(searchKeyword);

    const filtered = HEROES.filter((hero) => {
      const matchLane =
        currentLane === "all" || hero.lanes.includes(currentLane);

      const matchSearch = hero.id.includes(query);

      const matchFavorite = !favoritesOnly || favorites.includes(hero.id);

      return matchLane && matchSearch && matchFavorite;
    });

    // Đưa tướng đã ghim lên đầu
    filtered.sort((a, b) => {
      const pinA = favorites.includes(a.id) ? 1 : 0;
      const pinB = favorites.includes(b.id) ? 1 : 0;

      return pinB - pinA || a.name.localeCompare(b.name, "vi");
    });

    heroList.replaceChildren();

    heroCount.textContent = `Hiển thị ${filtered.length} / ${HEROES.length} tướng`;

    if (filtered.length === 0) {
      const empty = document.createElement("p");
      empty.className = "empty-message";
      empty.textContent = "Không tìm thấy tướng phù hợp.";
      heroList.appendChild(empty);
      return;
    }

    filtered.forEach((hero) => {
      const wrapper = document.createElement("div");
      wrapper.className = "hero-card-wrapper";

      const card = document.createElement("a");
      card.className = "hero-card";
      card.href = `hero.html?id=${encodeURIComponent(hero.id)}`;

      const avatar = document.createElement("div");
      avatar.className = "hero-avatar";

      const img = document.createElement("img");
      const imageName = hero.id === "flowborn" ? "flowborn-ad" : hero.id;

      img.src = `images/heroes/${imageName}.webp`;
      img.alt = hero.name;
      img.loading = "lazy";

      img.onerror = () => {
        img.remove();
        avatar.textContent = hero.name.charAt(0);
      };

      avatar.appendChild(img);

      const name = document.createElement("h3");
      name.textContent = hero.name;

      const role = document.createElement("p");
      role.className = "hero-role";
      role.textContent = ROLES[hero.role] || hero.role;

      const lanes = document.createElement("p");
      lanes.className = "hero-lanes";
      lanes.textContent = hero.lanes.map((lane) => LANES[lane]).join(" · ");

      card.append(avatar, name, role, lanes);

      const pinned = favorites.includes(hero.id);

      const pinButton = document.createElement("button");
      pinButton.type = "button";
      pinButton.className = `hero-pin ${pinned ? "pinned" : ""}`;
      pinButton.textContent = pinned ? "★" : "☆";
      pinButton.title = pinned ? "Bỏ ghim" : "Ghim tướng";
      pinButton.setAttribute(
        "aria-label",
        `${pinned ? "Bỏ ghim" : "Ghim"} ${hero.name}`,
      );
      pinButton.setAttribute("aria-pressed", String(pinned));

      pinButton.addEventListener("click", () => {
        toggleFavorite(hero.id);
      });

      wrapper.append(card, pinButton);
      heroList.appendChild(wrapper);
    });
  }

  // Tìm kiếm
  heroSearch.addEventListener("input", (event) => {
    searchKeyword = event.target.value.trim();
    renderHeroes();
  });

  // Lọc vị trí
  document.querySelectorAll(".filter-btn[data-lane]").forEach((button) => {
    button.addEventListener("click", () => {
      currentLane = button.dataset.lane;
      favoritesOnly = false;

      document
        .querySelectorAll(".filter-btn")
        .forEach((btn) => btn.classList.remove("active"));

      button.classList.add("active");
      renderHeroes();
    });
  });

  // Lọc tướng đã ghim
  favoriteFilter.addEventListener("click", () => {
    favoritesOnly = !favoritesOnly;
    currentLane = "all";

    document
      .querySelectorAll(".filter-btn")
      .forEach((btn) => btn.classList.remove("active"));

    if (favoritesOnly) {
      favoriteFilter.classList.add("active");
    } else {
      document.querySelector('[data-lane="all"]')?.classList.add("active");
    }

    renderHeroes();
  });

  renderHeroes();
});
