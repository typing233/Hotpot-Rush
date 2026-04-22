const API = {
    async getGameData() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/game-data`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get game data:', error);
            return null;
        }
    },
    
    async getLevels() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/levels`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get levels:', error);
            return [];
        }
    },
    
    async getLevel(levelId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/levels/${levelId}`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get level:', error);
            return null;
        }
    },
    
    async completeLevel(levelId, score) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/complete-level`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ level_id: levelId, score: score })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to complete level:', error);
            return null;
        }
    },
    
    async buyItem(category, itemId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/shop/buy`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category: category, item_id: itemId })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to buy item:', error);
            return null;
        }
    },
    
    async selectItem(category, itemId) {
        try {
            const response = await fetch(`${CONFIG.API_URL}/shop/select`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ category: category, item_id: itemId })
            });
            return await response.json();
        } catch (error) {
            console.error('Failed to select item:', error);
            return null;
        }
    },
    
    async getCollection() {
        try {
            const response = await fetch(`${CONFIG.API_URL}/collection`);
            return await response.json();
        } catch (error) {
            console.error('Failed to get collection:', error);
            return [];
        }
    }
};
