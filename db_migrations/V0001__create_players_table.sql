CREATE TABLE IF NOT EXISTS players (
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  player_id VARCHAR(50) UNIQUE NOT NULL,
  coins BIGINT DEFAULT 0,
  total_earned BIGINT DEFAULT 0,
  total_clicks INTEGER DEFAULT 0,
  click_power INTEGER DEFAULT 1,
  auto_click_rate INTEGER DEFAULT 0,
  has_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_players_coins ON players(coins DESC);
CREATE INDEX idx_players_player_id ON players(player_id);