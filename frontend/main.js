let gameData = null;
let currentShopTab = 'tables';

async function init() {
    AudioManager.init();
    await loadGameData();
    updateCoinsDisplay();
}

async function loadGameData() {
    gameData = await API.getGameData();
    return gameData;
}

function updateCoinsDisplay() {
    if (!gameData) return;
    
    const coins = gameData.player.coins;
    document.getElementById('menu-coins').textContent = coins;
    
    const shopCoinsEl = document.getElementById('shop-coins');
    if (shopCoinsEl) {
        shopCoinsEl.textContent = coins;
    }
}

function showScreen(screenId) {
    document.querySelectorAll('.screen').forEach(screen => {
        screen.classList.remove('active');
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.classList.add('hidden');
    });
    
    const targetScreen = document.getElementById(screenId);
    if (targetScreen) {
        targetScreen.classList.add('active');
    }
    
    if (screenId === 'level-select') {
        loadLevels();
    } else if (screenId === 'shop') {
        loadShop();
    } else if (screenId === 'collection') {
        loadCollection();
    }
}

async function loadLevels() {
    const levels = await API.getLevels();
    const grid = document.getElementById('levels-grid');
    grid.innerHTML = '';
    
    levels.forEach(level => {
        const btn = document.createElement('button');
        btn.className = `level-btn ${level.unlocked ? 'unlocked' : 'locked'} ${level.completed ? 'completed' : ''}`;
        
        const stars = level.completed ? '⭐⭐⭐' : (level.unlocked ? '' : '🔒');
        btn.innerHTML = `
            <span>${level.id}</span>
            <span class="stars">${stars}</span>
        `;
        
        if (level.unlocked) {
            btn.onclick = () => startLevel(level.id);
        }
        
        grid.appendChild(btn);
    });
}

async function startLevel(levelId) {
    showScreen('game-screen');
    await Game.init(levelId);
}

async function loadShop() {
    await loadGameData();
    updateCoinsDisplay();
    renderShopItems();
}

function showShopTab(tab) {
    currentShopTab = tab;
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.textContent.toLowerCase().includes(tab === 'tables' ? '桌椅' : 
            tab === 'wallpapers' ? '墙纸' : '火锅')) {
            btn.classList.add('active');
        }
    });
    
    renderShopItems();
}

async function renderShopItems() {
    const container = document.getElementById('shop-items');
    container.innerHTML = '';
    
    const items = gameData.shop[currentShopTab];
    const selectedId = gameData.selected[currentShopTab === 'tables' ? 'table' : 
        currentShopTab === 'wallpapers' ? 'wallpaper' : 'hotpot'];
    
    const icons = {
        tables: ['🪑', '🛋️', '💎', '👑'],
        wallpapers: ['🏠', '🌸', '🎨', '🌃'],
        hotpots: ['🍲', '🥘', '🀄', '🍱']
    };
    
    items.forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `shop-item ${item.id === selectedId ? 'selected' : ''}`;
        
        const isSelected = item.id === selectedId;
        const statusText = item.unlocked ? 
            (isSelected ? '✓ 使用中' : '点击使用') : 
            (gameData.player.coins >= item.price ? '可购买' : '金币不足');
        
        div.innerHTML = `
            <div class="shop-item-icon">${icons[currentShopTab][index]}</div>
            <div class="shop-item-name">${item.name}</div>
            <div class="shop-item-price ${item.unlocked ? '' : 'locked'}">
                ${item.unlocked ? '' : `💰 ${item.price}`}
            </div>
            <div class="shop-item-status ${item.unlocked ? 'unlocked' : 'locked'}">
                ${statusText}
            </div>
        `;
        
        div.onclick = async () => {
            if (item.unlocked) {
                if (!isSelected) {
                    const result = await API.selectItem(currentShopTab, item.id);
                    if (result) {
                        gameData = result;
                        renderShopItems();
                    }
                }
            } else if (gameData.player.coins >= item.price) {
                const result = await API.buyItem(currentShopTab, item.id);
                if (result) {
                    gameData = result;
                    updateCoinsDisplay();
                    renderShopItems();
                }
            }
        };
        
        container.appendChild(div);
    });
}

async function loadCollection() {
    const collection = await API.getCollection();
    const container = document.getElementById('collection-items');
    container.innerHTML = '';
    
    const rarityLabels = {
        common: '普通',
        rare: '稀有',
        epic: '史诗'
    };
    
    collection.forEach(dish => {
        const div = document.createElement('div');
        div.className = `collection-item ${dish.collected ? 'collected' : 'locked'}`;
        
        div.innerHTML = `
            <div class="collection-item-icon">${dish.icon}</div>
            <div class="collection-item-name">${dish.collected ? dish.name : '???'}</div>
            <span class="collection-item-rarity rarity-${dish.rarity}">
                ${rarityLabels[dish.rarity]}
            </span>
            <div class="collection-item-description">
                ${dish.collected ? dish.description : '尚未解锁'}
            </div>
        `;
        
        container.appendChild(div);
    });
}

document.addEventListener('DOMContentLoaded', init);
