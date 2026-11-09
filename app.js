// Deaf Culture - アプリケーションロジック

// ============================================================
// 【アフィリエイト一括設定エリア】
// Googleアドセンス審査完了後、Amazonアソシエイトを開始する際は
// 下記の amazonAssociateTag にトラッキングID（例: "miminova-22"）を
// 入力するだけで、全作品のAmazonリンクと免責表記が自動で有効になります。
// （空欄 "" の間はアフィリエイトなしの純粋なリンクとして動作します）
// ============================================================
const AFFILIATE_CONFIG = {
  amazonAssociateTag: "" // 例: "yourid-22" （初期状態は空欄＝OFF）
};

// リンクURLにアフィリエイトタグを自動付与するヘルパー関数
function buildLinkUrl(rawUrl) {
  const tag = AFFILIATE_CONFIG.amazonAssociateTag.trim();
  if (!tag) return rawUrl;

  if (rawUrl.includes("amazon.co.jp")) {
    const separator = rawUrl.includes("?") ? "&" : "?";
    return `${rawUrl}${separator}tag=${encodeURIComponent(tag)}`;
  }
  return rawUrl;
}

document.addEventListener("DOMContentLoaded", () => {
  const worksContainer = document.getElementById("worksContainer");
  const filterButtons = document.querySelectorAll(".filter-btn");
  const resultsCount = document.getElementById("resultsCount");
  const affiliateNotice = document.getElementById("affiliateNotice");

  // アフィリエイトIDが設定されている場合のみフッターのPR・免責表記を表示
  if (affiliateNotice && AFFILIATE_CONFIG.amazonAssociateTag.trim() !== "") {
    affiliateNotice.style.display = "block";
  }

  // 現在選択されているジャンルフィルター ('all', 'book', 'movie', 'drama')
  let currentFilter = "all";

  // 作品カードのHTMLを生成する関数
  function renderCard(work, activeMediaKey = null) {
    const card = document.createElement("article");
    card.className = "work-card";
    card.dataset.id = work.id;

    // 利用可能なメディアのリスト（['book', 'movie'] など）
    const mediaKeys = Object.keys(work.medias);

    // デフォルトで表示するメディアを決定
    let selectedMediaKey = activeMediaKey;
    if (!selectedMediaKey) {
      if (currentFilter !== "all" && mediaKeys.includes(currentFilter)) {
        selectedMediaKey = currentFilter;
      } else {
        selectedMediaKey = mediaKeys[0];
      }
    }

    const currentMedia = work.medias[selectedMediaKey];

    // カテゴリバッジのHTML
    const catBadgesHtml = work.categories.map(cat => {
      let label = "その他";
      if (cat === "novel" || cat === "book") label = "📕 小説・エッセイ";
      if (cat === "manga") label = "💬 漫画";
      if (cat === "movie") label = "🎬 映画";
      if (cat === "drama") label = "📺 ドラマ";
      return `<span class="cat-badge ${cat}">${label}</span>`;
    }).join("");

    // テーマタグのHTML
    const themeTagsHtml = work.themeTags.map(tag => 
      `<span class="theme-tag">#${tag}</span>`
    ).join("");

    // メディアタブのHTML（メディアが複数ある場合のみタブを表示）
    let mediaTabsHtml = "";
    if (mediaKeys.length > 1) {
      const tabsHtml = mediaKeys.map(key => {
        const media = work.medias[key];
        const isActive = key === selectedMediaKey ? "active" : "";
        return `
          <button class="media-tab-btn ${isActive}" data-media-key="${key}">
            ${media.badgeLabel}
          </button>
        `;
      }).join("");

      mediaTabsHtml = `
        <div class="media-tabs-wrapper">
          <div class="media-tabs">
            ${tabsHtml}
          </div>
          <div class="media-details-container">
            ${renderMediaDetails(currentMedia)}
          </div>
        </div>
      `;
    } else {
      // 単一メディアの場合
      mediaTabsHtml = `
        <div class="media-tabs-wrapper">
          <div class="media-details-container">
            ${renderMediaDetails(currentMedia)}
          </div>
        </div>
      `;
    }

    // カード全体のHTML
    card.innerHTML = `
      <div class="card-top-row">
        <!-- 小さめサムネイル -->
        <div class="card-thumb-wrapper">
          <img src="${currentMedia.thumbUrl}" alt="${work.title} - ${currentMedia.badgeLabel}" class="card-thumb-img">
          <span class="card-thumb-badge">${currentMedia.badgeLabel}</span>
        </div>

        <!-- タイトル・基本情報 -->
        <div class="card-main-info">
          <div class="card-category-tags">
            ${catBadgesHtml}
          </div>
          <h2 class="card-title">${work.title}</h2>
          <p class="card-subtitle">${work.subtitle}</p>
          <div class="theme-tags">
            ${themeTagsHtml}
          </div>
        </div>
      </div>

      <div class="recommend-box">
        <strong>💡 こんな人におすすめ</strong>
        ${work.recommendedFor}
      </div>

      <p class="lead-text">
        ${work.leadText}
      </p>

      ${mediaTabsHtml}
    `;

    // タブ切り替えイベントの設定（メディアが複数ある場合）
    if (mediaKeys.length > 1) {
      const tabBtns = card.querySelectorAll(".media-tab-btn");
      const detailsContainer = card.querySelector(".media-details-container");
      const thumbImg = card.querySelector(".card-thumb-img");
      const thumbBadge = card.querySelector(".card-thumb-badge");

      tabBtns.forEach(btn => {
        btn.addEventListener("click", () => {
          tabBtns.forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          const targetKey = btn.dataset.mediaKey;
          const targetMedia = work.medias[targetKey];

          // 詳細エリアの更新
          detailsContainer.innerHTML = renderMediaDetails(targetMedia);

          // サムネイル画像とバッジの連動切り替え
          thumbImg.src = targetMedia.thumbUrl;
          thumbImg.alt = `${work.title} - ${targetMedia.badgeLabel}`;
          thumbBadge.textContent = targetMedia.badgeLabel;
        });
      });
    }

    return card;
  }

  // メディア詳細部分（著者/監督、見どころ、横2列ボタン）のHTML生成
  function renderMediaDetails(media) {
    // リンクボタンの生成（横2列並列）
    const buttonsHtml = media.links.map(link => {
      let icon = "↗";
      let btnClass = link.type;
      if (link.type === "official") {
        icon = "🌐";
      } else if (link.type === "amazon") {
        icon = "🛒";
      } else if (link.type === "vod") {
        icon = "📺";
      }

      const finalUrl = buildLinkUrl(link.url);
      const isAffiliateActive =
        AFFILIATE_CONFIG.amazonAssociateTag.trim() !== "" &&
        link.url.includes("amazon.co.jp");
      const relAttr = isAffiliateActive
        ? "sponsored noopener noreferrer"
        : "noopener noreferrer";

      return `
        <a href="${finalUrl}" target="_blank" rel="${relAttr}" class="aff-btn ${btnClass}">
          <span>${icon}</span> ${link.name}
        </a>
      `;
    }).join("");

    return `
      <div class="media-content">
        <div class="media-creator">
          <span>${media.creatorLabel}:</span> ${media.creator}
        </div>
        <div class="media-release">
          ${media.release}
        </div>

        <div class="media-highlights-box">
          <span class="highlights-source-label">📖 ${media.highlightsSource}</span>
          <p class="media-highlights">${media.highlights}</p>
        </div>

        <!-- 横2列並列のコンパクトリンクボタン -->
        <div class="affiliate-actions">
          ${buttonsHtml}
        </div>
      </div>
    `;
  }

  // 作品一覧をフィルタリングして再描画する関数
  function renderWorks() {
    worksContainer.innerHTML = "";

    const filteredWorks = worksData.filter(work => {
      if (currentFilter === "all") return true;
      return work.categories.includes(currentFilter);
    });

    resultsCount.textContent = `表示中: ${filteredWorks.length} 作品`;

    if (filteredWorks.length === 0) {
      worksContainer.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: 36px; background: #fff; border-radius: 16px; border: 1px solid #eadfc9;">
          <p style="color: #8c7e72; font-size: 1rem;">該当する作品が見つかりませんでした。</p>
        </div>
      `;
      return;
    }

    filteredWorks.forEach(work => {
      const card = renderCard(work);
      worksContainer.appendChild(card);
    });
  }

  // フィルターボタンのクリックイベント
  filterButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      filterButtons.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentFilter = btn.dataset.filter;
      renderWorks();
    });
  });

  // 初回描画
  renderWorks();
});
