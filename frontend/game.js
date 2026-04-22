const Game = {
    currentLevel: null,
    score: 0,
    combo: 0,
    maxCombo: 0,
    timeRemaining: 0,
    isPaused: false,
    isRunning: false,
    
    ingredients: [],
    orderProgress: {},
    orderTargets: {},
    
    activePowerups: {
        ice: 0,
        strainer: 0
    },
    
    gameLoopId: null,
    spawnInterval: null,
    timerInterval: null,
    comboTimeout: null,
    
    getConveyorPath: function() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;
        const cornerSize = CONFIG.CONVEYOR.CORNER_SIZE;
        const topOffset = CONFIG.CONVEYOR.TOP_OFFSET;
        
        return [
            {
                startX: cornerSize,
                startY: topOffset + cornerSize / 2,
                endX: screenWidth - cornerSize,
                endY: topOffset + cornerSize / 2,
                direction: 'right'
            },
            {
                startX: screenWidth - cornerSize / 2,
                startY: topOffset + cornerSize,
                endX: screenWidth - cornerSize / 2,
                endY: screenHeight - cornerSize,
                direction: 'down'
            },
            {
                startX: screenWidth - cornerSize,
                startY: screenHeight - cornerSize / 2,
                endX: cornerSize,
                endY: screenHeight - cornerSize / 2,
                direction: 'left'
            },
            {
                startX: cornerSize / 2,
                startY: screenHeight - cornerSize,
                endX: cornerSize / 2,
                endY: topOffset + cornerSize,
                direction: 'up'
            }
        ];
    },
    
    init: async function(levelId) {
        this.currentLevel = await API.getLevel(levelId);
        if (!this.currentLevel) {
            alert('无法加载关卡数据');
            return;
        }
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.timeRemaining = this.currentLevel.time_limit;
        this.isPaused = false;
        this.isRunning = true;
        
        this.ingredients = [];
        this.orderProgress = {};
        this.orderTargets = {};
        this.activePowerups = { ice: 0, strainer: 0 };
        
        var self = this;
        this.currentLevel.orders.forEach(function(order) {
            self.orderProgress[order.ingredient_id] = 0;
            self.orderTargets[order.ingredient_id] = order.amount;
        });
        
        this.updateUI();
        this.renderOrders();
        this.clearIngredients();
        
        AudioManager.init();
        this.startGameLoop();
        this.startTimer();
        this.startSpawning();
        
        this.boilInterval = setInterval(function() {
            if (!self.isPaused && self.isRunning) {
                AudioManager.playBoil();
            }
        }, 3000);
    },
    
    startGameLoop: function() {
        var self = this;
        var loop = function() {
            if (!self.isPaused && self.isRunning) {
                self.updateIngredients();
                self.updatePowerups();
                self.checkStrainerAutoCollect();
            }
            self.gameLoopId = requestAnimationFrame(loop);
        };
        this.gameLoopId = requestAnimationFrame(loop);
    },
    
    startTimer: function() {
        var self = this;
        this.timerInterval = setInterval(function() {
            if (!self.isPaused && self.isRunning) {
                self.timeRemaining -= 0.1;
                self.updateTimeUI();
                
                if (self.timeRemaining <= 0) {
                    self.lose('时间耗尽了...');
                }
            }
        }, 100);
    },
    
    startSpawning: function() {
        var self = this;
        this.spawnInterval = setInterval(function() {
            if (!self.isPaused && self.isRunning) {
                self.spawnIngredient();
            }
        }, this.currentLevel.spawn_rate);
    },
    
    spawnIngredient: function() {
        var allItems = [];
        var self = this;
        
        this.currentLevel.ingredients.forEach(function(ing) {
            for (var i = 0; i < ing.weight; i++) {
                allItems.push({ data: ing, type: 'ingredient' });
            }
        });
        
        this.currentLevel.hazards.forEach(function(hz) {
            for (var i = 0; i < hz.weight; i++) {
                allItems.push({ data: hz, type: 'hazard' });
            }
        });
        
        this.currentLevel.powerups.forEach(function(pu) {
            for (var i = 0; i < pu.weight; i++) {
                allItems.push({ data: pu, type: 'powerup' });
            }
        });
        
        if (allItems.length === 0) return;
        
        var item = allItems[Math.floor(Math.random() * allItems.length)];
        var path = this.getConveyorPath();
        var startPath = path[0];
        
        var ingredient = {
            id: Date.now() + Math.random(),
            data: item.data,
            type: item.type,
            pathIndex: 0,
            progress: 0,
            x: startPath.startX,
            y: startPath.startY
        };
        
        this.ingredients.push(ingredient);
        this.renderIngredient(ingredient);
    },
    
    renderIngredient: function(ingredient) {
        var container = document.getElementById('ingredients-container');
        var el = document.createElement('div');
        el.className = 'ingredient ' + ingredient.type;
        el.setAttribute('data-id', ingredient.id);
        el.innerHTML = ingredient.data.icon;
        el.style.left = (ingredient.x - 30) + 'px';
        el.style.top = (ingredient.y - 30) + 'px';
        
        var self = this;
        el.addEventListener('click', function(e) {
            e.stopPropagation();
            self.handleIngredientClick(ingredient);
        });
        
        container.appendChild(el);
    },
    
    updateIngredients: function() {
        var path = this.getConveyorPath();
        var baseSpeed = CONFIG.CONVEYOR.BASE_SPEED * this.currentLevel.conveyor_speed;
        var speed = this.activePowerups.ice > 0 ? 
            baseSpeed * CONFIG.GAME.ICE_SPEED_MULTIPLIER : baseSpeed;
        
        var self = this;
        this.ingredients.forEach(function(ingredient) {
            var currentPath = path[ingredient.pathIndex];
            
            if (!currentPath) {
                ingredient.pathIndex = 0;
                ingredient.progress = 0;
                return;
            }
            
            var dx = currentPath.endX - currentPath.startX;
            var dy = currentPath.endY - currentPath.startY;
            var distance = Math.sqrt(dx * dx + dy * dy);
            
            ingredient.progress += speed / distance;
            
            if (ingredient.progress >= 1) {
                ingredient.progress = 0;
                ingredient.pathIndex++;
                
                if (ingredient.pathIndex >= path.length) {
                    ingredient.pathIndex = 0;
                }
            }
            
            var newPath = path[ingredient.pathIndex];
            var newDx = newPath.endX - newPath.startX;
            var newDy = newPath.endY - newPath.startY;
            
            ingredient.x = newPath.startX + newDx * ingredient.progress;
            ingredient.y = newPath.startY + newDy * ingredient.progress;
            
            var el = document.querySelector('[data-id="' + ingredient.id + '"]');
            if (el) {
                el.style.left = (ingredient.x - 30) + 'px';
                el.style.top = (ingredient.y - 30) + 'px';
            }
        });
    },
    
    handleIngredientClick: function(ingredient) {
        if (this.isPaused || !this.isRunning) return;
        
        var el = document.querySelector('[data-id="' + ingredient.id + '"]');
        if (!el) return;
        
        if (ingredient.type === 'hazard') {
            this.handleHazardClick(ingredient, el);
        } else if (ingredient.type === 'powerup') {
            this.handlePowerupClick(ingredient, el);
        } else {
            this.handleNormalClick(ingredient, el);
        }
    },
    
    handleHazardClick: function(ingredient, el) {
        AudioManager.playError();
        
        var penalty = ingredient.data.penalty || -5;
        this.score = Math.max(0, this.score + penalty);
        
        if (ingredient.data.instant_fail) {
            this.lose('你点到了炸弹！');
            return;
        }
        
        this.timeRemaining = Math.max(0, this.timeRemaining - 3);
        this.resetCombo();
        
        this.showScorePopup(el, penalty, true);
        this.removeIngredient(ingredient.id);
        this.updateUI();
    },
    
    handlePowerupClick: function(ingredient, el) {
        AudioManager.playPowerup();
        
        if (ingredient.data.id === 'ice') {
            this.activePowerups.ice = CONFIG.GAME.ICE_DURATION;
            document.getElementById('ice-status').classList.remove('hidden');
        } else if (ingredient.data.id === 'strainer') {
            this.activePowerups.strainer = CONFIG.GAME.STRAINER_DURATION;
            document.getElementById('strainer-status').classList.remove('hidden');
        }
        
        this.removeIngredient(ingredient.id);
    },
    
    handleNormalClick: function(ingredient, el) {
        var ingId = ingredient.data.id;
        var isOrderItem = this.orderTargets.hasOwnProperty(ingId);
        var needsMore = isOrderItem && this.orderProgress[ingId] < this.orderTargets[ingId];
        
        if (needsMore) {
            AudioManager.playPop();
            
            this.combo++;
            if (this.combo > this.maxCombo) {
                this.maxCombo = this.combo;
            }
            
            this.resetComboTimeout();
            
            var basePoints = ingredient.data.points || 10;
            var comboMultiplier = Math.min(
                Math.pow(CONFIG.SCORES.COMBO_MULTIPLIER, this.combo - 1),
                CONFIG.SCORES.MAX_COMBO_MULTIPLIER
            );
            var points = Math.floor(basePoints * comboMultiplier);
            
            this.score += points;
            this.orderProgress[ingId]++;
            
            this.animateIngredientToPot(el, ingredient);
            
            if (this.combo >= 2) {
                AudioManager.playCombo();
                this.showComboPopup(el, this.combo);
            }
            
            this.showScorePopup(el, points, false);
            this.renderOrders();
            this.updateUI();
            this.checkWinCondition();
        } else {
            AudioManager.playError();
            this.resetCombo();
            
            if (!isOrderItem) {
                this.timeRemaining = Math.max(0, this.timeRemaining - 2);
                this.showScorePopup(el, 0, true);
            }
            
            this.removeIngredient(ingredient.id);
            this.updateUI();
        }
    },
    
    animateIngredientToPot: function(el, ingredient) {
        el.classList.add('flying');
        
        var hotpot = document.getElementById('hotpot');
        var hotpotRect = hotpot.getBoundingClientRect();
        var targetX = hotpotRect.left + hotpotRect.width / 2;
        var targetY = hotpotRect.top + hotpotRect.height / 2;
        
        var startX = ingredient.x;
        var startY = ingredient.y;
        
        var duration = 500;
        var startTime = performance.now();
        var self = this;
        
        var animate = function(currentTime) {
            var elapsed = currentTime - startTime;
            var progress = Math.min(elapsed / duration, 1);
            
            var parabolicProgress = progress * (2 - progress);
            
            var currentX = startX + (targetX - startX) * parabolicProgress;
            var currentY = startY + (targetY - startY) * parabolicProgress - 
                Math.sin(progress * Math.PI) * 100;
            
            el.style.left = (currentX - 30) + 'px';
            el.style.top = (currentY - 30) + 'px';
            el.style.transform = 'scale(' + (1 - progress * 0.5) + ')';
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                self.removeIngredient(ingredient.id);
            }
        };
        
        requestAnimationFrame(animate);
    },
    
    checkStrainerAutoCollect: function() {
        if (this.activePowerups.strainer <= 0) return;
        
        var self = this;
        var toCollect = this.ingredients.filter(function(ing) {
            if (ing.type !== 'ingredient') return false;
            var ingId = ing.data.id;
            return self.orderTargets.hasOwnProperty(ingId) && 
                   self.orderProgress[ingId] < self.orderTargets[ingId];
        });
        
        toCollect.forEach(function(ing) {
            var el = document.querySelector('[data-id="' + ing.id + '"]');
            if (el) {
                self.handleNormalClick(ing, el);
            }
        });
    },
    
    updatePowerups: function() {
        this.activePowerups.ice = Math.max(0, this.activePowerups.ice - 16.67);
        this.activePowerups.strainer = Math.max(0, this.activePowerups.strainer - 16.67);
        
        var iceStatus = document.getElementById('ice-status');
        var strainerStatus = document.getElementById('strainer-status');
        var iceTimer = document.getElementById('ice-timer');
        var strainerTimer = document.getElementById('strainer-timer');
        
        if (this.activePowerups.ice > 0) {
            iceTimer.textContent = Math.ceil(this.activePowerups.ice / 1000) + 's';
        } else {
            iceStatus.classList.add('hidden');
        }
        
        if (this.activePowerups.strainer > 0) {
            strainerTimer.textContent = Math.ceil(this.activePowerups.strainer / 1000) + 's';
        } else {
            strainerStatus.classList.add('hidden');
        }
    },
    
    resetComboTimeout: function() {
        if (this.comboTimeout) clearTimeout(this.comboTimeout);
        var self = this;
        this.comboTimeout = setTimeout(function() {
            self.resetCombo();
        }, CONFIG.GAME.COMBO_TIMEOUT);
    },
    
    resetCombo: function() {
        this.combo = 0;
        this.updateUI();
    },
    
    showScorePopup: function(el, score, isNegative) {
        var popup = document.createElement('div');
        popup.className = 'score-popup ' + (isNegative ? 'negative' : 'positive');
        popup.textContent = isNegative ? '错误!' : '+' + score;
        
        var rect = el.getBoundingClientRect();
        popup.style.left = (rect.left + rect.width / 2) + 'px';
        popup.style.top = rect.top + 'px';
        
        document.body.appendChild(popup);
        
        setTimeout(function() {
            popup.remove();
        }, 800);
    },
    
    showComboPopup: function(el, combo) {
        var popup = document.createElement('div');
        popup.className = 'combo-popup';
        popup.textContent = combo + '连击!';
        
        var rect = el.getBoundingClientRect();
        popup.style.left = (rect.left + rect.width / 2) + 'px';
        popup.style.top = rect.top + 'px';
        
        document.body.appendChild(popup);
        
        setTimeout(function() {
            popup.remove();
        }, 1000);
    },
    
    removeIngredient: function(id) {
        this.ingredients = this.ingredients.filter(function(ing) { return ing.id !== id; });
        var el = document.querySelector('[data-id="' + id + '"]');
        if (el) el.remove();
    },
    
    clearIngredients: function() {
        this.ingredients = [];
        document.getElementById('ingredients-container').innerHTML = '';
    },
    
    checkWinCondition: function() {
        var self = this;
        var allComplete = Object.keys(this.orderTargets).every(function(id) {
            return self.orderProgress[id] >= self.orderTargets[id];
        });
        
        if (allComplete) {
            this.win();
        }
    },
    
    win: async function() {
        this.stop();
        
        AudioManager.playVictory();
        
        var result = await API.completeLevel(this.currentLevel.id, this.score);
        
        document.getElementById('victory-score').textContent = this.score;
        document.getElementById('victory-coins').textContent = this.currentLevel.coins_reward;
        document.getElementById('victory-combo').textContent = this.maxCombo;
        
        document.getElementById('victory-modal').classList.remove('hidden');
    },
    
    lose: function(reason) {
        this.stop();
        
        AudioManager.playDefeat();
        
        document.getElementById('defeat-reason').textContent = reason;
        document.getElementById('defeat-score').textContent = this.score;
        
        document.getElementById('defeat-modal').classList.remove('hidden');
    },
    
    stop: function() {
        this.isRunning = false;
        
        if (this.gameLoopId) cancelAnimationFrame(this.gameLoopId);
        if (this.spawnInterval) clearInterval(this.spawnInterval);
        if (this.timerInterval) clearInterval(this.timerInterval);
        if (this.comboTimeout) clearTimeout(this.comboTimeout);
        if (this.boilInterval) clearInterval(this.boilInterval);
    },
    
    updateUI: function() {
        document.getElementById('game-level-name').textContent = 
            '第' + this.currentLevel.id + '关: ' + this.currentLevel.name;
        document.getElementById('game-score').textContent = this.score;
        document.getElementById('game-combo').textContent = this.combo;
    },
    
    updateTimeUI: function() {
        var progress = (this.timeRemaining / this.currentLevel.time_limit) * 100;
        document.getElementById('time-progress').style.width = Math.max(0, progress) + '%';
        document.getElementById('time-text').textContent = Math.ceil(this.timeRemaining) + 's';
    },
    
    renderOrders: function() {
        var container = document.getElementById('order-items');
        container.innerHTML = '';
        
        var ingredientMap = {};
        this.currentLevel.ingredients.forEach(function(ing) {
            ingredientMap[ing.id] = ing;
        });
        
        var self = this;
        this.currentLevel.orders.forEach(function(order) {
            var ing = ingredientMap[order.ingredient_id];
            var current = self.orderProgress[order.ingredient_id] || 0;
            var target = order.amount;
            var completed = current >= target;
            
            var item = document.createElement('div');
            item.className = 'order-item' + (completed ? ' completed' : '');
            item.innerHTML = 
                '<div class="order-item-icon">' + ing.icon + '</div>' +
                '<div class="order-item-count">' +
                    '<span class="current">' + current + '</span>' +
                    '<span class="target">/' + target + '</span>' +
                '</div>';
            
            container.appendChild(item);
        });
    }
};

function togglePause() {
    Game.isPaused = !Game.isPaused;
    document.getElementById('pause-menu').classList.toggle('hidden', !Game.isPaused);
}

function exitGame() {
    Game.stop();
    Game.isPaused = false;
    document.getElementById('pause-menu').classList.add('hidden');
    document.getElementById('victory-modal').classList.add('hidden');
    document.getElementById('defeat-modal').classList.add('hidden');
    showScreen('level-select');
}

function retryLevel() {
    document.getElementById('defeat-modal').classList.add('hidden');
    var levelId = Game.currentLevel.id;
    Game.init(levelId);
}

function nextLevel() {
    document.getElementById('victory-modal').classList.add('hidden');
    var nextLevelId = Game.currentLevel.id + 1;
    
    if (nextLevelId <= 10) {
        Game.init(nextLevelId);
    } else {
        showScreen('level-select');
    }
}
