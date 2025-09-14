// 調味料データを保存する配列
let seasonings = [];
let editingSeasoningId = null;

// DOM要素を取得
const addSeasoningBtn = document.getElementById('addSeasoningBtn');
const seasoningModal = document.getElementById('seasoningModal');
const seasoningForm = document.getElementById('seasoningForm');
const seasoningList = document.getElementById('seasoningList');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');

// 統計要素
const expiredCount = document.getElementById('expiredCount');
const warningCount = document.getElementById('warningCount');
const safeCount = document.getElementById('safeCount');
const totalCount = document.getElementById('totalCount');

// フィルターボタン
const filterButtons = document.querySelectorAll('.filter-btn');

// 現在のフィルター状態
let currentFilter = 'all';

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    loadSeasonings();
    displaySeasonings();
    updateStatistics();
    setupEventListeners();

    // 期限チェックと通知
    checkExpiredSeasonings();
});

// イベントリスナーの設定
function setupEventListeners() {
    // モーダル開閉
    addSeasoningBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);

    // モーダル外クリックで閉じる
    window.addEventListener('click', function(e) {
        if (e.target === seasoningModal) {
            closeModal();
        }
    });

    // フォーム送信
    seasoningForm.addEventListener('submit', handleFormSubmit);

    // フィルターボタン
    filterButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            displaySeasonings();
        });
    });
}

// ローカルストレージから調味料を読み込み
function loadSeasonings() {
    const savedSeasonings = localStorage.getItem('seasonings');
    if (savedSeasonings) {
        seasonings = JSON.parse(savedSeasonings);
    }
}

// ローカルストレージに調味料を保存
function saveSeasonings() {
    localStorage.setItem('seasonings', JSON.stringify(seasonings));
}

// 新規追加モーダルを開く
function openAddModal() {
    editingSeasoningId = null;
    modalTitle.textContent = '調味料を追加';
    seasoningForm.reset();

    // デフォルト値を設定
    document.getElementById('quantity').value = '100';

    seasoningModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 編集モーダルを開く
function openEditModal(seasoningId) {
    editingSeasoningId = seasoningId;
    modalTitle.textContent = '調味料を編集';

    const seasoning = seasonings.find(s => s.id === seasoningId);
    if (seasoning) {
        document.getElementById('seasoningName').value = seasoning.name;
        document.getElementById('seasoningCategory').value = seasoning.category;
        document.getElementById('expiryDate').value = seasoning.expiryDate;
        document.getElementById('openedDate').value = seasoning.openedDate || '';
        document.getElementById('quantity').value = seasoning.quantity || '100';
        document.getElementById('location').value = seasoning.location || '';
        document.getElementById('notes').value = seasoning.notes || '';
    }

    seasoningModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// モーダルを閉じる
function closeModal() {
    seasoningModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    editingSeasoningId = null;
    seasoningForm.reset();
}

// フォーム送信処理
function handleFormSubmit(e) {
    e.preventDefault();

    const formData = {
        name: document.getElementById('seasoningName').value.trim(),
        category: document.getElementById('seasoningCategory').value,
        expiryDate: document.getElementById('expiryDate').value,
        openedDate: document.getElementById('openedDate').value || null,
        quantity: parseInt(document.getElementById('quantity').value) || 100,
        location: document.getElementById('location').value.trim(),
        notes: document.getElementById('notes').value.trim()
    };

    if (editingSeasoningId) {
        // 編集の場合
        updateSeasoning(editingSeasoningId, formData);
    } else {
        // 新規追加の場合
        addSeasoning(formData);
    }

    closeModal();
}

// 調味料を追加
function addSeasoning(seasoningData) {
    const seasoning = {
        id: Date.now().toString(),
        ...seasoningData,
        createdAt: new Date().toISOString()
    };

    seasonings.unshift(seasoning);
    saveSeasonings();
    displaySeasonings();
    updateStatistics();
    showNotification('調味料が追加されました！', 'success');

    // 期限チェック
    checkExpiredSeasonings();
}

// 調味料を更新
function updateSeasoning(seasoningId, seasoningData) {
    const index = seasonings.findIndex(s => s.id === seasoningId);
    if (index !== -1) {
        seasonings[index] = {
            ...seasonings[index],
            ...seasoningData,
            updatedAt: new Date().toISOString()
        };
        saveSeasonings();
        displaySeasonings();
        updateStatistics();
        showNotification('調味料が更新されました！', 'success');

        // 期限チェック
        checkExpiredSeasonings();
    }
}

// 調味料を削除
function deleteSeasoning(seasoningId) {
    if (confirm('この調味料を削除しますか？この操作は元に戻せません。')) {
        seasonings = seasonings.filter(s => s.id !== seasoningId);
        saveSeasonings();
        displaySeasonings();
        updateStatistics();
        showNotification('調味料が削除されました。', 'info');
    }
}

// 期限までの日数を計算
function getDaysUntilExpiry(expiryDate) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const expiry = new Date(expiryDate);
    expiry.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 期限の状態を取得
function getExpiryStatus(expiryDate) {
    const days = getDaysUntilExpiry(expiryDate);
    if (days < 0) return 'expired';
    if (days <= 30) return 'warning';
    return 'safe';
}

// 調味料を表示
function displaySeasonings(seasoningsToShow = seasonings) {
    // フィルタリング
    let filteredSeasonings = seasoningsToShow;
    if (currentFilter !== 'all') {
        filteredSeasonings = seasoningsToShow.filter(s =>
            getExpiryStatus(s.expiryDate) === currentFilter
        );
    }

    // 期限順にソート（期限切れ・期限間近を優先）
    filteredSeasonings.sort((a, b) => {
        const daysA = getDaysUntilExpiry(a.expiryDate);
        const daysB = getDaysUntilExpiry(b.expiryDate);
        return daysA - daysB;
    });

    if (filteredSeasonings.length === 0) {
        seasoningList.innerHTML = `
            <div class="empty-state">
                <h3>🧂 調味料がありません</h3>
                <p>${currentFilter === 'all' ? '「調味料を追加」ボタンから調味料を登録してください' : 'このカテゴリに該当する調味料はありません'}</p>
            </div>
        `;
        return;
    }

    seasoningList.innerHTML = filteredSeasonings.map(seasoning => {
        const days = getDaysUntilExpiry(seasoning.expiryDate);
        const status = getExpiryStatus(seasoning.expiryDate);
        let daysText = '';
        let statusClass = status;

        if (days < 0) {
            daysText = `${Math.abs(days)}日前に期限切れ`;
        } else if (days === 0) {
            daysText = '本日期限';
        } else if (days === 1) {
            daysText = '明日期限';
        } else if (days <= 7) {
            daysText = `あと${days}日`;
        } else if (days <= 30) {
            daysText = `あと${days}日`;
        } else {
            daysText = `あと${days}日`;
        }

        const quantityClass = seasoning.quantity <= 25 ? 'low' : seasoning.quantity <= 50 ? 'medium' : '';

        return `
            <div class="seasoning-card ${statusClass}" data-id="${seasoning.id}">
                <div class="seasoning-header">
                    <div class="seasoning-name">${escapeHtml(seasoning.name)}</div>
                    <span class="seasoning-category">${escapeHtml(seasoning.category)}</span>
                </div>

                <div class="seasoning-details">
                    <div class="detail-row">
                        <span class="detail-label">賞味期限</span>
                        <span class="detail-value expiry-date">
                            ${new Date(seasoning.expiryDate).toLocaleDateString('ja-JP')}
                            <span class="days-remaining ${statusClass}">${daysText}</span>
                        </span>
                    </div>

                    ${seasoning.openedDate ? `
                        <div class="detail-row">
                            <span class="detail-label">開封日</span>
                            <span class="detail-value">${new Date(seasoning.openedDate).toLocaleDateString('ja-JP')}</span>
                        </div>
                    ` : ''}

                    <div class="detail-row">
                        <span class="detail-label">残量</span>
                        <span class="detail-value">${seasoning.quantity}%</span>
                    </div>

                    <div class="quantity-indicator">
                        <div class="quantity-fill ${quantityClass}" style="width: ${seasoning.quantity}%"></div>
                    </div>

                    ${seasoning.location ? `
                        <div class="detail-row">
                            <span class="detail-label">保管場所</span>
                            <span class="detail-value">${escapeHtml(seasoning.location)}</span>
                        </div>
                    ` : ''}

                    ${seasoning.notes ? `
                        <div class="detail-row">
                            <span class="detail-label">メモ</span>
                            <span class="detail-value" style="font-size: 0.85rem; font-weight: 400;">${escapeHtml(seasoning.notes)}</span>
                        </div>
                    ` : ''}
                </div>

                <div class="seasoning-actions">
                    <button class="btn-edit-seasoning" onclick="openEditModal('${seasoning.id}')">
                        編集
                    </button>
                    <button class="btn-delete-seasoning" onclick="deleteSeasoning('${seasoning.id}')">
                        削除
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// 統計情報を更新
function updateStatistics() {
    let expired = 0;
    let warning = 0;
    let safe = 0;

    seasonings.forEach(seasoning => {
        const status = getExpiryStatus(seasoning.expiryDate);
        if (status === 'expired') expired++;
        else if (status === 'warning') warning++;
        else if (status === 'safe') safe++;
    });

    expiredCount.textContent = expired;
    warningCount.textContent = warning;
    safeCount.textContent = safe;
    totalCount.textContent = seasonings.length;
}

// 期限切れの調味料をチェックして通知
function checkExpiredSeasonings() {
    const expiredItems = seasonings.filter(s => getExpiryStatus(s.expiryDate) === 'expired');
    const warningItems = seasonings.filter(s => getExpiryStatus(s.expiryDate) === 'warning');

    if (expiredItems.length > 0) {
        showNotification(`⚠️ ${expiredItems.length}個の調味料が期限切れです！`, 'warning');
    } else if (warningItems.length > 0) {
        showNotification(`📢 ${warningItems.length}個の調味料の期限が近づいています`, 'info');
    }
}

// 通知表示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 12px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        max-width: 350px;
        box-shadow: 0 6px 20px rgba(0,0,0,0.15);
    `;

    const colors = {
        success: 'linear-gradient(135deg, #26de81 0%, #4ecca3 100%)',
        info: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        warning: 'linear-gradient(135deg, #ffa502 0%, #ffcc29 100%)',
        error: 'linear-gradient(135deg, #ff4757 0%, #ff6b7a 100%)'
    };

    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 4000);
}

// HTMLエスケープ関数
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// アニメーション用CSS（動的に追加）
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from {
            opacity: 0;
            transform: translateX(100%);
        }
        to {
            opacity: 1;
            transform: translateX(0);
        }
    }

    @keyframes slideOutRight {
        from {
            opacity: 1;
            transform: translateX(0);
        }
        to {
            opacity: 0;
            transform: translateX(100%);
        }
    }
`;
document.head.appendChild(style);