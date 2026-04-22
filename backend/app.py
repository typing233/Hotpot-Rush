from flask import Flask, jsonify, request
from flask_cors import CORS
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

DATA_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

GAME_DATA_FILE = os.path.join(DATA_DIR, 'game_data.json')

DEFAULT_GAME_DATA = {
    'player': {
        'coins': 100,
        'completed_levels': [],
        'total_score': 0
    },
    'shop': {
        'tables': [
            {'id': 1, 'name': '基础木桌', 'price': 0, 'unlocked': True},
            {'id': 2, 'name': '红木餐桌', 'price': 200, 'unlocked': False},
            {'id': 3, 'name': '大理石桌', 'price': 500, 'unlocked': False},
            {'id': 4, 'name': '豪华金桌', 'price': 1000, 'unlocked': False}
        ],
        'wallpapers': [
            {'id': 1, 'name': '白色墙壁', 'price': 0, 'unlocked': True},
            {'id': 2, 'name': '温馨墙纸', 'price': 150, 'unlocked': False},
            {'id': 3, 'name': '古典壁画', 'price': 400, 'unlocked': False},
            {'id': 4, 'name': '霓虹夜景', 'price': 800, 'unlocked': False}
        ],
        'hotpots': [
            {'id': 1, 'name': '普通单锅', 'price': 0, 'unlocked': True},
            {'id': 2, 'name': '鸳鸯锅', 'price': 300, 'unlocked': False},
            {'id': 3, 'name': '九宫格', 'price': 600, 'unlocked': False},
            {'id': 4, 'name': '四宫格', 'price': 1200, 'unlocked': False}
        ]
    },
    'collection': {
        'dishes': []
    },
    'selected': {
        'table': 1,
        'wallpaper': 1,
        'hotpot': 1
    }
}

LEVELS = [
    {
        'id': 1,
        'name': '新手入门',
        'description': '学习基本操作',
        'time_limit': 60,
        'target_score': 100,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 30},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 30},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 30}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 2},
            {'ingredient_id': 'meat_slice', 'amount': 2}
        ],
        'hazards': [],
        'powerups': [],
        'conveyor_speed': 1,
        'spawn_rate': 2000,
        'coins_reward': 50
    },
    {
        'id': 2,
        'name': '忙碌午餐',
        'description': '更多订单来袭',
        'time_limit': 75,
        'target_score': 200,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 25},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 25},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 25},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 25}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 3},
            {'ingredient_id': 'meat_slice', 'amount': 2},
            {'ingredient_id': 'vegetable', 'amount': 2}
        ],
        'hazards': [],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 10}
        ],
        'conveyor_speed': 1.2,
        'spawn_rate': 1800,
        'coins_reward': 80
    },
    {
        'id': 3,
        'name': '小心为上',
        'description': '注意坏食材！',
        'time_limit': 70,
        'target_score': 300,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 20},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 20},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 20},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 20},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 20}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 3},
            {'ingredient_id': 'meat_slice', 'amount': 3},
            {'ingredient_id': 'mushroom', 'amount': 2}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 15, 'penalty': -5}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 10}
        ],
        'conveyor_speed': 1.3,
        'spawn_rate': 1700,
        'coins_reward': 100
    },
    {
        'id': 4,
        'name': '火爆高峰',
        'description': '订单更多了',
        'time_limit': 80,
        'target_score': 400,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 18},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 18},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 18},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 18},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 18},
            {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'points': 20, 'weight': 10}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 4},
            {'ingredient_id': 'meat_slice', 'amount': 3},
            {'ingredient_id': 'vegetable', 'amount': 3},
            {'ingredient_id': 'fish_ball', 'amount': 2}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 12, 'penalty': -5}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 8},
            {'id': 'strainer', 'name': '漏勺', 'icon': '🥄', 'weight': 8}
        ],
        'conveyor_speed': 1.4,
        'spawn_rate': 1600,
        'coins_reward': 120
    },
    {
        'id': 5,
        'name': '炸弹来袭',
        'description': '小心炸弹！',
        'time_limit': 75,
        'target_score': 500,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 16},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 16},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 16},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 16},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 16},
            {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'points': 20, 'weight': 10},
            {'id': 'noodles', 'name': '面条', 'icon': '🍜', 'points': 20, 'weight': 10}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 4},
            {'ingredient_id': 'meat_slice', 'amount': 4},
            {'ingredient_id': 'fish_ball', 'amount': 3},
            {'ingredient_id': 'noodles', 'amount': 2}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 10, 'penalty': -5},
            {'id': 'bomb', 'name': '炸弹', 'icon': '💣', 'weight': 8, 'penalty': -10, 'instant_fail': False}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 7},
            {'id': 'strainer', 'name': '漏勺', 'icon': '🥄', 'weight': 7}
        ],
        'conveyor_speed': 1.5,
        'spawn_rate': 1500,
        'coins_reward': 150
    },
    {
        'id': 6,
        'name': '极速挑战',
        'description': '传送带更快了！',
        'time_limit': 70,
        'target_score': 650,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 14},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 14},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 14},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 14},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 14},
            {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'points': 20, 'weight': 10},
            {'id': 'noodles', 'name': '面条', 'icon': '🍜', 'points': 20, 'weight': 10},
            {'id': 'egg', 'name': '鸡蛋', 'icon': '🥚', 'points': 15, 'weight': 10}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 5},
            {'ingredient_id': 'meat_slice', 'amount': 4},
            {'ingredient_id': 'vegetable', 'amount': 4},
            {'ingredient_id': 'fish_ball', 'amount': 3}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 8, 'penalty': -5},
            {'id': 'bomb', 'name': '炸弹', 'icon': '💣', 'weight': 7, 'penalty': -10, 'instant_fail': False}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 6},
            {'id': 'strainer', 'name': '漏勺', 'icon': '🥄', 'weight': 6}
        ],
        'conveyor_speed': 1.7,
        'spawn_rate': 1400,
        'coins_reward': 180
    },
    {
        'id': 7,
        'name': '火锅大师',
        'description': '考验你的技巧',
        'time_limit': 80,
        'target_score': 800,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 12},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 12},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 12},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 12},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 12},
            {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'points': 20, 'weight': 10},
            {'id': 'noodles', 'name': '面条', 'icon': '🍜', 'points': 20, 'weight': 10},
            {'id': 'egg', 'name': '鸡蛋', 'icon': '🥚', 'points': 15, 'weight': 10},
            {'id': 'clam', 'name': '蛤蜊', 'icon': '🐚', 'points': 25, 'weight': 10}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 5},
            {'ingredient_id': 'meat_slice', 'amount': 5},
            {'ingredient_id': 'fish_ball', 'amount': 4},
            {'ingredient_id': 'clam', 'amount': 3}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 7, 'penalty': -5},
            {'id': 'bomb', 'name': '炸弹', 'icon': '💣', 'weight': 6, 'penalty': -15, 'instant_fail': False}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 5},
            {'id': 'strainer', 'name': '漏勺', 'icon': '🥄', 'weight': 5}
        ],
        'conveyor_speed': 1.8,
        'spawn_rate': 1300,
        'coins_reward': 220
    },
    {
        'id': 8,
        'name': '疯狂晚餐',
        'description': '最繁忙的时段',
        'time_limit': 85,
        'target_score': 1000,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 10},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 10},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 10},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 10},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 10},
            {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'points': 20, 'weight': 10},
            {'id': 'noodles', 'name': '面条', 'icon': '🍜', 'points': 20, 'weight': 10},
            {'id': 'egg', 'name': '鸡蛋', 'icon': '🥚', 'points': 15, 'weight': 10},
            {'id': 'clam', 'name': '蛤蜊', 'icon': '🐚', 'points': 25, 'weight': 10},
            {'id': 'shrimp', 'name': '鲜虾', 'icon': '🦐', 'points': 30, 'weight': 10}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 6},
            {'ingredient_id': 'meat_slice', 'amount': 5},
            {'ingredient_id': 'fish_ball', 'amount': 4},
            {'ingredient_id': 'shrimp', 'amount': 3}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 6, 'penalty': -5},
            {'id': 'bomb', 'name': '炸弹', 'icon': '💣', 'weight': 5, 'penalty': -20, 'instant_fail': False}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 5},
            {'id': 'strainer', 'name': '漏勺', 'icon': '🥄', 'weight': 5}
        ],
        'conveyor_speed': 2.0,
        'spawn_rate': 1200,
        'coins_reward': 260
    },
    {
        'id': 9,
        'name': '极限挑战',
        'description': '最后的考验',
        'time_limit': 90,
        'target_score': 1200,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 9},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 9},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 9},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 9},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 9},
            {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'points': 20, 'weight': 9},
            {'id': 'noodles', 'name': '面条', 'icon': '🍜', 'points': 20, 'weight': 9},
            {'id': 'egg', 'name': '鸡蛋', 'icon': '🥚', 'points': 15, 'weight': 9},
            {'id': 'clam', 'name': '蛤蜊', 'icon': '🐚', 'points': 25, 'weight': 9},
            {'id': 'shrimp', 'name': '鲜虾', 'icon': '🦐', 'points': 30, 'weight': 9}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 7},
            {'ingredient_id': 'meat_slice', 'amount': 6},
            {'ingredient_id': 'fish_ball', 'amount': 5},
            {'ingredient_id': 'shrimp', 'amount': 4},
            {'ingredient_id': 'clam', 'amount': 3}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 5, 'penalty': -10},
            {'id': 'bomb', 'name': '炸弹', 'icon': '💣', 'weight': 5, 'penalty': -25, 'instant_fail': False}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 4},
            {'id': 'strainer', 'name': '漏勺', 'icon': '🥄', 'weight': 4}
        ],
        'conveyor_speed': 2.2,
        'spawn_rate': 1100,
        'coins_reward': 300
    },
    {
        'id': 10,
        'name': '火锅之王',
        'description': '成为火锅大师',
        'time_limit': 100,
        'target_score': 1500,
        'ingredients': [
            {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'points': 10, 'weight': 8},
            {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'points': 10, 'weight': 8},
            {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'points': 10, 'weight': 8},
            {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'points': 15, 'weight': 8},
            {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'points': 15, 'weight': 8},
            {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'points': 20, 'weight': 8},
            {'id': 'noodles', 'name': '面条', 'icon': '🍜', 'points': 20, 'weight': 8},
            {'id': 'egg', 'name': '鸡蛋', 'icon': '🥚', 'points': 15, 'weight': 8},
            {'id': 'clam', 'name': '蛤蜊', 'icon': '🐚', 'points': 25, 'weight': 8},
            {'id': 'shrimp', 'name': '鲜虾', 'icon': '🦐', 'points': 30, 'weight': 8},
            {'id': 'beef_ball', 'name': '牛肉丸', 'icon': '🔴', 'points': 35, 'weight': 10}
        ],
        'orders': [
            {'ingredient_id': 'shrimp_slide', 'amount': 8},
            {'ingredient_id': 'meat_slice', 'amount': 7},
            {'ingredient_id': 'fish_ball', 'amount': 5},
            {'ingredient_id': 'shrimp', 'amount': 5},
            {'ingredient_id': 'beef_ball', 'amount': 3}
        ],
        'hazards': [
            {'id': 'rotten', 'name': '坏食材', 'icon': '💀', 'weight': 5, 'penalty': -10},
            {'id': 'bomb', 'name': '炸弹', 'icon': '💣', 'weight': 5, 'penalty': -30, 'instant_fail': False}
        ],
        'powerups': [
            {'id': 'ice', 'name': '冰冻', 'icon': '❄️', 'weight': 4},
            {'id': 'strainer', 'name': '漏勺', 'icon': '🥄', 'weight': 4}
        ],
        'conveyor_speed': 2.5,
        'spawn_rate': 1000,
        'coins_reward': 500
    }
]

ALL_DISHES = [
    {'id': 'shrimp_slide', 'name': '虾滑', 'icon': '🦐', 'description': 'Q弹爽口的虾滑', 'rarity': 'common'},
    {'id': 'meat_slice', 'name': '肉片', 'icon': '🥩', 'description': '鲜嫩多汁的肉片', 'rarity': 'common'},
    {'id': 'vegetable', 'name': '蔬菜', 'icon': '🥬', 'description': '新鲜脆嫩的蔬菜', 'rarity': 'common'},
    {'id': 'mushroom', 'name': '蘑菇', 'icon': '🍄', 'description': '香气扑鼻的蘑菇', 'rarity': 'common'},
    {'id': 'tofu', 'name': '豆腐', 'icon': '🧈', 'description': '嫩滑可口的豆腐', 'rarity': 'common'},
    {'id': 'fish_ball', 'name': '鱼丸', 'icon': '⚪', 'description': '弹牙的手工鱼丸', 'rarity': 'rare'},
    {'id': 'noodles', 'name': '面条', 'icon': '🍜', 'description': '劲道爽滑的面条', 'rarity': 'common'},
    {'id': 'egg', 'name': '鸡蛋', 'icon': '🥚', 'description': '营养丰富的鸡蛋', 'rarity': 'common'},
    {'id': 'clam', 'name': '蛤蜊', 'icon': '🐚', 'description': '鲜美无比的蛤蜊', 'rarity': 'rare'},
    {'id': 'shrimp', 'name': '鲜虾', 'icon': '🦐', 'description': '鲜活的大虾', 'rarity': 'rare'},
    {'id': 'beef_ball', 'name': '牛肉丸', 'icon': '🔴', 'description': '劲道的手打牛肉丸', 'rarity': 'epic'}
]

def load_game_data():
    if os.path.exists(GAME_DATA_FILE):
        try:
            with open(GAME_DATA_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except:
            pass
    return DEFAULT_GAME_DATA.copy()

def save_game_data(data):
    with open(GAME_DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

@app.route('/api/game-data', methods=['GET'])
def get_game_data():
    data = load_game_data()
    return jsonify(data)

@app.route('/api/levels', methods=['GET'])
def get_levels():
    data = load_game_data()
    completed_levels = data['player']['completed_levels']
    
    levels_with_status = []
    for level in LEVELS:
        level_copy = level.copy()
        level_copy['completed'] = level['id'] in completed_levels
        level_copy['unlocked'] = level['id'] == 1 or (level['id'] - 1) in completed_levels
        levels_with_status.append(level_copy)
    
    return jsonify(levels_with_status)

@app.route('/api/levels/<int:level_id>', methods=['GET'])
def get_level(level_id):
    for level in LEVELS:
        if level['id'] == level_id:
            return jsonify(level)
    return jsonify({'error': 'Level not found'}), 404

@app.route('/api/complete-level', methods=['POST'])
def complete_level():
    data = request.json
    level_id = data.get('level_id')
    score = data.get('score', 0)
    
    game_data = load_game_data()
    
    if level_id not in game_data['player']['completed_levels']:
        game_data['player']['completed_levels'].append(level_id)
    
    for level in LEVELS:
        if level['id'] == level_id:
            game_data['player']['coins'] += level['coins_reward']
            break
    
    game_data['player']['total_score'] += score
    
    for dish in ALL_DISHES:
        if dish['id'] not in game_data['collection']['dishes']:
            game_data['collection']['dishes'].append(dish['id'])
    
    save_game_data(game_data)
    return jsonify(game_data)

@app.route('/api/shop/buy', methods=['POST'])
def buy_item():
    data = request.json
    category = data.get('category')
    item_id = data.get('item_id')
    
    game_data = load_game_data()
    
    if category not in game_data['shop']:
        return jsonify({'error': 'Invalid category'}), 400
    
    items = game_data['shop'][category]
    item = next((i for i in items if i['id'] == item_id), None)
    
    if not item:
        return jsonify({'error': 'Item not found'}), 404
    
    if item['unlocked']:
        return jsonify({'error': 'Item already unlocked'}), 400
    
    if game_data['player']['coins'] < item['price']:
        return jsonify({'error': 'Not enough coins'}), 400
    
    game_data['player']['coins'] -= item['price']
    item['unlocked'] = True
    
    save_game_data(game_data)
    return jsonify(game_data)

@app.route('/api/shop/select', methods=['POST'])
def select_item():
    data = request.json
    category = data.get('category')
    item_id = data.get('item_id')
    
    game_data = load_game_data()
    
    category_map = {
        'tables': 'table',
        'wallpapers': 'wallpaper',
        'hotpots': 'hotpot'
    }
    
    if category not in category_map:
        return jsonify({'error': 'Invalid category'}), 400
    
    items = game_data['shop'][category]
    item = next((i for i in items if i['id'] == item_id), None)
    
    if not item or not item['unlocked']:
        return jsonify({'error': 'Item not available'}), 400
    
    game_data['selected'][category_map[category]] = item_id
    save_game_data(game_data)
    
    return jsonify(game_data)

@app.route('/api/collection', methods=['GET'])
def get_collection():
    game_data = load_game_data()
    collected = game_data['collection']['dishes']
    
    result = []
    for dish in ALL_DISHES:
        dish_copy = dish.copy()
        dish_copy['collected'] = dish['id'] in collected
        result.append(dish_copy)
    
    return jsonify(result)

if __name__ == '__main__':
    if not os.path.exists(GAME_DATA_FILE):
        save_game_data(DEFAULT_GAME_DATA)
    
    app.run(host='0.0.0.0', port=5000, debug=True)
