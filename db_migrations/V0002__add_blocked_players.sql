-- Добавляем таблицу для заблокированных игроков
CREATE TABLE IF NOT EXISTS blocked_players (
    player_id VARCHAR(255) PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    blocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    blocked_by VARCHAR(255) DEFAULT 'admin'
);

-- Индекс для быстрого поиска
CREATE INDEX IF NOT EXISTS idx_blocked_players_username ON blocked_players(username);
