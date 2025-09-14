// レシピデータを保存する配列
let recipes = [];
let editingRecipeId = null;
let currentImageData = null;

// DOM要素を取得
const addRecipeBtn = document.getElementById('addRecipeBtn');
const recipeModal = document.getElementById('recipeModal');
const recipeForm = document.getElementById('recipeForm');
const recipeList = document.getElementById('recipeList');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const closeBtn = document.querySelector('.close');
const cancelBtn = document.getElementById('cancelBtn');
const modalTitle = document.getElementById('modalTitle');
const recipeImageInput = document.getElementById('recipeImage');
const imagePreview = document.getElementById('imagePreview');

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', function() {
    loadRecipes();
    displayRecipes();
    setupEventListeners();
});

// イベントリスナーの設定
function setupEventListeners() {
    // モーダル開閉
    addRecipeBtn.addEventListener('click', openAddModal);
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // モーダル外クリックで閉じる
    window.addEventListener('click', function(e) {
        if (e.target === recipeModal) {
            closeModal();
        }
    });
    
    // フォーム送信
    recipeForm.addEventListener('submit', handleFormSubmit);
    
    // 検索・フィルター
    searchInput.addEventListener('input', filterRecipes);
    categoryFilter.addEventListener('change', filterRecipes);
    
    // 画像アップロード
    if (recipeImageInput) {
        recipeImageInput.addEventListener('change', handleImageUpload);
    }
}

// ローカルストレージからレシピを読み込み
function loadRecipes() {
    const savedRecipes = localStorage.getItem('recipes');
    if (savedRecipes) {
        recipes = JSON.parse(savedRecipes);
    }
}

// ローカルストレージにレシピを保存
function saveRecipes() {
    localStorage.setItem('recipes', JSON.stringify(recipes));
}

// 新規追加モーダルを開く
function openAddModal() {
    editingRecipeId = null;
    modalTitle.textContent = '新しいレシピを追加';
    recipeForm.reset();
    currentImageData = null;
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
    recipeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// 編集モーダルを開く
function openEditModal(recipeId) {
    editingRecipeId = recipeId;
    modalTitle.textContent = 'レシピを編集';
    
    const recipe = recipes.find(r => r.id === recipeId);
    if (recipe) {
        document.getElementById('recipeName').value = recipe.name;
        document.getElementById('recipeCategory').value = recipe.category;
        document.getElementById('cookingTime').value = recipe.cookingTime;
        document.getElementById('servings').value = recipe.servings;
        document.getElementById('ingredients').value = recipe.ingredients.join('\n');
        document.getElementById('instructions').value = recipe.instructions.join('\n');
        document.getElementById('notes').value = recipe.notes || '';
        
        // 既存の画像を表示
        if (recipe.image && imagePreview) {
            imagePreview.innerHTML = `<img src="${recipe.image}" alt="レシピ画像" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
            currentImageData = recipe.image;
        } else {
            imagePreview.innerHTML = '';
            currentImageData = null;
        }
    }
    
    recipeModal.style.display = 'block';
    document.body.style.overflow = 'hidden';
}

// モーダルを閉じる
function closeModal() {
    recipeModal.style.display = 'none';
    document.body.style.overflow = 'auto';
    editingRecipeId = null;
    currentImageData = null;
    recipeForm.reset();
    if (imagePreview) {
        imagePreview.innerHTML = '';
    }
}

// 画像アップロード処理
function handleImageUpload(e) {
    const file = e.target.files[0];
    if (file) {
        if (file.size > 5 * 1024 * 1024) { // 5MB制限
            showNotification('画像サイズは5MB以下にしてください', 'warning');
            return;
        }
        
        const reader = new FileReader();
        reader.onload = function(event) {
            currentImageData = event.target.result;
            if (imagePreview) {
                imagePreview.innerHTML = `<img src="${currentImageData}" alt="プレビュー" style="max-width: 100%; max-height: 200px; border-radius: 8px;">`;
            }
        };
        reader.readAsDataURL(file);
    }
}

// フォーム送信処理
function handleFormSubmit(e) {
    e.preventDefault();
    
    const formData = {
        name: document.getElementById('recipeName').value.trim(),
        category: document.getElementById('recipeCategory').value,
        cookingTime: parseInt(document.getElementById('cookingTime').value) || 0,
        servings: parseInt(document.getElementById('servings').value) || 1,
        ingredients: document.getElementById('ingredients').value.split('\n').filter(item => item.trim()),
        instructions: document.getElementById('instructions').value.split('\n').filter(item => item.trim()),
        notes: document.getElementById('notes').value.trim(),
        image: currentImageData || (editingRecipeId ? recipes.find(r => r.id === editingRecipeId)?.image : null)
    };
    
    if (editingRecipeId) {
        // 編集の場合
        updateRecipe(editingRecipeId, formData);
    } else {
        // 新規追加の場合
        addRecipe(formData);
    }
    
    currentImageData = null;
    closeModal();
}

// レシピを追加
function addRecipe(recipeData) {
    const recipe = {
        id: Date.now().toString(),
        ...recipeData,
        createdAt: new Date().toLocaleDateString('ja-JP')
    };
    
    recipes.unshift(recipe);
    saveRecipes();
    displayRecipes();
    showNotification('レシピが追加されました！', 'success');
}

// レシピを更新
function updateRecipe(recipeId, recipeData) {
    const index = recipes.findIndex(r => r.id === recipeId);
    if (index !== -1) {
        recipes[index] = {
            ...recipes[index],
            ...recipeData,
            updatedAt: new Date().toLocaleDateString('ja-JP')
        };
        saveRecipes();
        displayRecipes();
        showNotification('レシピが更新されました！', 'success');
    }
}

// レシピを削除
function deleteRecipe(recipeId) {
    if (confirm('このレシピを削除しますか？この操作は元に戻せません。')) {
        recipes = recipes.filter(r => r.id !== recipeId);
        saveRecipes();
        displayRecipes();
        showNotification('レシピが削除されました。', 'info');
    }
}

// レシピを表示
function displayRecipes(recipesToShow = recipes) {
    if (recipesToShow.length === 0) {
        recipeList.innerHTML = `
            <div class="empty-state">
                <h3>📖 レシピがありません</h3>
                <p>「新しいレシピを追加」ボタンから最初のレシピを追加してみましょう！</p>
            </div>
        `;
        return;
    }
    
    recipeList.innerHTML = recipesToShow.map(recipe => `
        <div class="recipe-card ${recipe.image ? 'recipe-card-with-image' : ''}" data-id="${recipe.id}">
            ${recipe.image ? `<img src="${recipe.image}" alt="${escapeHtml(recipe.name)}" class="recipe-image">` : ''}
            <div class="recipe-card-header">
                <h3>${escapeHtml(recipe.name)}</h3>
                <div class="recipe-meta">
                    <span>⏰ ${recipe.cookingTime || '未設定'}分</span>
                    <span>👥 ${recipe.servings || 1}人分</span>
                </div>
            </div>
            <div class="recipe-card-body">
                <span class="recipe-category">${escapeHtml(recipe.category)}</span>
                
                <div class="recipe-ingredients">
                    <h4>🥬 材料</h4>
                    <ul>
                        ${recipe.ingredients.slice(0, 4).map(ingredient => 
                            `<li>${escapeHtml(ingredient)}</li>`
                        ).join('')}
                        ${recipe.ingredients.length > 4 ? '<li>...他' + (recipe.ingredients.length - 4) + '個</li>' : ''}
                    </ul>
                </div>
                
                ${recipe.notes ? `
                    <div style="margin-top: 1rem; font-size: 0.85rem; color: #666; font-style: italic;">
                        💡 ${escapeHtml(recipe.notes.slice(0, 50))}${recipe.notes.length > 50 ? '...' : ''}
                    </div>
                ` : ''}
                
                <div class="recipe-actions">
                    <button class="btn-small btn-edit" onclick="openEditModal('${recipe.id}')">
                        ✏️ 編集
                    </button>
                    <button class="btn-small btn-delete" onclick="deleteRecipe('${recipe.id}')">
                        🗑️ 削除
                    </button>
                    <button class="btn-small" onclick="viewRecipeDetails('${recipe.id}')" style="background: #17a2b8; color: white;">
                        📄 詳細
                    </button>
                    <button class="btn-small" onclick="generateRecipePDF('${recipe.id}')" style="background: #fd7e14; color: white;">
                        🖨️ PDF保存
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// レシピ詳細表示
function viewRecipeDetails(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    const detailsWindow = window.open('', '_blank', 'width=800,height=600,scrollbars=yes');
    detailsWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${recipe.name} - レシピ詳細</title>
            <style>
                body { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    line-height: 1.6; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 2rem;
                    background: #f8f9fa;
                }
                .header { 
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 2rem; 
                    border-radius: 12px; 
                    margin-bottom: 2rem;
                    text-align: center;
                }
                .meta { 
                    display: flex; 
                    justify-content: center; 
                    gap: 2rem; 
                    margin-top: 1rem;
                    flex-wrap: wrap;
                }
                .section { 
                    background: white; 
                    padding: 1.5rem; 
                    border-radius: 12px; 
                    margin-bottom: 1.5rem;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
                }
                .section h3 { 
                    color: #333; 
                    border-bottom: 2px solid #ff6b6b; 
                    padding-bottom: 0.5rem; 
                    margin-bottom: 1rem;
                }
                ul, ol { 
                    padding-left: 1.5rem; 
                }
                li { 
                    margin-bottom: 0.5rem; 
                }
                .category {
                    display: inline-block;
                    background: #e3f2fd;
                    color: #1565c0;
                    padding: 0.5rem 1rem;
                    border-radius: 20px;
                    font-weight: 500;
                    margin-bottom: 1rem;
                }
                @media print {
                    body { background: white; }
                    .header { background: #333 !important; }
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${escapeHtml(recipe.name)}</h1>
                <div class="meta">
                    <div>⏰ ${recipe.cookingTime || '未設定'}分</div>
                    <div>👥 ${recipe.servings || 1}人分</div>
                    <div>📅 作成: ${recipe.createdAt}</div>
                </div>
            </div>
            
            ${recipe.image ? `
                <div class="section">
                    <img src="${recipe.image}" alt="${escapeHtml(recipe.name)}" style="width: 100%; max-height: 300px; object-fit: cover; border-radius: 12px;">
                </div>
            ` : ''}
            
            <div class="section">
                <span class="category">${escapeHtml(recipe.category)}</span>
            </div>
            
            <div class="section">
                <h3>🥬 材料</h3>
                <ul>
                    ${recipe.ingredients.map(ingredient => 
                        `<li>${escapeHtml(ingredient)}</li>`
                    ).join('')}
                </ul>
            </div>
            
            <div class="section">
                <h3>👩‍🍳 作り方</h3>
                <ol>
                    ${recipe.instructions.map(instruction => 
                        `<li>${escapeHtml(instruction)}</li>`
                    ).join('')}
                </ol>
            </div>
            
            ${recipe.notes ? `
                <div class="section">
                    <h3>💡 メモ・コツ</h3>
                    <p>${escapeHtml(recipe.notes)}</p>
                </div>
            ` : ''}
            
            <div style="text-align: center; margin-top: 2rem;">
                <button onclick="window.print()" style="
                    background: #28a745; 
                    color: white; 
                    border: none; 
                    padding: 1rem 2rem; 
                    border-radius: 8px; 
                    cursor: pointer;
                    font-size: 1rem;
                ">🖨️ 印刷する</button>
                <button onclick="window.close()" style="
                    background: #6c757d; 
                    color: white; 
                    border: none; 
                    padding: 1rem 2rem; 
                    border-radius: 8px; 
                    cursor: pointer;
                    font-size: 1rem;
                    margin-left: 1rem;
                ">閉じる</button>
            </div>
        </body>
        </html>
    `);
    detailsWindow.document.close();
}

// 簡易PDF生成機能（HTMLを使用）
function generateRecipePDF(recipeId) {
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return;
    
    // 新しいウィンドウでHTMLレシピを開いて印刷
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="ja">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>${escapeHtml(recipe.name)} - レシピ</title>
            <style>
                @media print {
                    body { 
                        font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
                        line-height: 1.6; 
                        margin: 0;
                        padding: 20px;
                        background: white;
                        color: black;
                    }
                    .no-print { display: none !important; }
                    .page-break { page-break-before: always; }
                }
                
                body { 
                    font-family: 'Noto Sans JP', 'Yu Gothic', 'Meiryo', sans-serif;
                    line-height: 1.6; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 2rem;
                    background: white;
                }
                .header { 
                    text-align: center;
                    margin-bottom: 2rem;
                    padding: 1.5rem;
                    border: 2px solid #333;
                    border-radius: 8px;
                }
                .header h1 { 
                    font-size: 2rem; 
                    margin-bottom: 1rem;
                    color: #333;
                }
                .meta { 
                    display: flex; 
                    justify-content: center; 
                    gap: 2rem; 
                    flex-wrap: wrap;
                    margin-top: 1rem;
                }
                .section { 
                    margin-bottom: 2rem;
                    padding: 1rem;
                    border-left: 4px solid #ff6b6b;
                    padding-left: 1.5rem;
                }
                .section h3 { 
                    color: #333; 
                    font-size: 1.3rem;
                    margin-bottom: 1rem;
                    border-bottom: 1px solid #ddd;
                    padding-bottom: 0.5rem;
                }
                ul, ol { 
                    padding-left: 1.5rem; 
                }
                li { 
                    margin-bottom: 0.5rem; 
                    line-height: 1.5;
                }
                .recipe-image {
                    width: 100%;
                    max-width: 400px;
                    height: auto;
                    border-radius: 8px;
                    margin: 1rem 0;
                    display: block;
                    margin-left: auto;
                    margin-right: auto;
                }
                .category {
                    display: inline-block;
                    background: #f0f0f0;
                    color: #333;
                    padding: 0.5rem 1rem;
                    border-radius: 15px;
                    font-weight: 500;
                    margin-bottom: 1rem;
                    border: 1px solid #ddd;
                }
                .print-buttons {
                    text-align: center;
                    margin: 2rem 0;
                    padding: 1rem;
                }
                .print-btn {
                    background: #28a745;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin: 0 0.5rem;
                }
                .close-btn {
                    background: #6c757d;
                    color: white;
                    border: none;
                    padding: 1rem 2rem;
                    border-radius: 8px;
                    cursor: pointer;
                    font-size: 1rem;
                    margin: 0 0.5rem;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1>${escapeHtml(recipe.name)}</h1>
                <span class="category">${escapeHtml(recipe.category)}</span>
                <div class="meta">
                    <div><strong>調理時間:</strong> ${recipe.cookingTime || '未設定'}分</div>
                    <div><strong>人数:</strong> ${recipe.servings || 1}人分</div>
                    <div><strong>作成日:</strong> ${recipe.createdAt}</div>
                </div>
            </div>
            
            ${recipe.image ? `
                <div class="section">
                    <img src="${recipe.image}" alt="${escapeHtml(recipe.name)}" class="recipe-image">
                </div>
            ` : ''}
            
            <div class="section">
                <h3>🥬 材料</h3>
                <ul>
                    ${recipe.ingredients.map(ingredient => 
                        `<li>${escapeHtml(ingredient)}</li>`
                    ).join('')}
                </ul>
            </div>
            
            <div class="section">
                <h3>👩‍🍳 作り方</h3>
                <ol>
                    ${recipe.instructions.map(instruction => 
                        `<li>${escapeHtml(instruction)}</li>`
                    ).join('')}
                </ol>
            </div>
            
            ${recipe.notes ? `
                <div class="section">
                    <h3>💡 メモ・コツ</h3>
                    <p>${escapeHtml(recipe.notes)}</p>
                </div>
            ` : ''}
            
            <div class="print-buttons no-print">
                <button class="print-btn" onclick="window.print()">🖨️ PDFとして保存/印刷</button>
                <button class="close-btn" onclick="window.close()">閉じる</button>
            </div>
        </body>
        </html>
    `);
    
    printWindow.document.close();
    showNotification('印刷用ページを開きました。印刷ダイアログからPDFを選択して保存してください。', 'info');
}

// 検索・フィルター機能
function filterRecipes() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    const filteredRecipes = recipes.filter(recipe => {
        const matchesSearch = recipe.name.toLowerCase().includes(searchTerm) ||
                            recipe.ingredients.some(ingredient => 
                                ingredient.toLowerCase().includes(searchTerm)
                            ) ||
                            recipe.instructions.some(instruction => 
                                instruction.toLowerCase().includes(searchTerm)
                            );
        
        const matchesCategory = !selectedCategory || recipe.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    displayRecipes(filteredRecipes);
}

// 通知表示
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 2000;
        animation: slideInRight 0.3s ease;
        max-width: 300px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    const colors = {
        success: '#28a745',
        info: '#17a2b8',
        warning: '#ffc107',
        error: '#dc3545'
    };
    
    notification.style.background = colors[type] || colors.info;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
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