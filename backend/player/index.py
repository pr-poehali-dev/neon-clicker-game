"""
Управление данными игрока MAY COIN
Сохранение и загрузка прогресса в базе данных
"""
import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    dsn = os.environ.get('DATABASE_URL')
    if not dsn:
        return {
            'statusCode': 500,
            'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
            'body': json.dumps({'error': 'Database configuration missing'}),
            'isBase64Encoded': False
        }
    
    if method == 'GET':
        params = event.get('queryStringParameters') or {}
        player_id = params.get('playerId')
        
        if not player_id:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'playerId is required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        try:
            cur = conn.cursor()
            
            # Проверяем блокировку
            cur.execute("SELECT reason FROM blocked_players WHERE player_id = %s", (player_id,))
            blocked = cur.fetchone()
            
            if blocked:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'error': 'Account blocked',
                        'blocked': True,
                        'reason': blocked[0]
                    }),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                SELECT username, coins, total_earned, total_clicks, click_power, 
                       auto_click_rate, has_premium
                FROM players
                WHERE player_id = %s
            """, (player_id,))
            
            row = cur.fetchone()
            cur.close()
            conn.close()
            
            if not row:
                return {
                    'statusCode': 404,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({'error': 'Player not found'}),
                    'isBase64Encoded': False
                }
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({
                    'username': row[0],
                    'coins': int(row[1]),
                    'totalEarned': int(row[2]),
                    'totalClicks': int(row[3]),
                    'clickPower': int(row[4]),
                    'autoClickRate': int(row[5]),
                    'hasPremium': row[6]
                }),
                'isBase64Encoded': False
            }
        except Exception as e:
            if conn:
                conn.close()
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    if method == 'POST' or method == 'PUT':
        body_str = event.get('body', '{}')
        body = json.loads(body_str)
        
        player_id = body.get('playerId')
        username = body.get('username')
        coins = body.get('coins', 0)
        total_earned = body.get('totalEarned', 0)
        total_clicks = body.get('totalClicks', 0)
        click_power = body.get('clickPower', 1)
        auto_click_rate = body.get('autoClickRate', 0)
        has_premium = body.get('hasPremium', False)
        
        if not player_id or not username:
            return {
                'statusCode': 400,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'playerId and username are required'}),
                'isBase64Encoded': False
            }
        
        conn = psycopg2.connect(dsn)
        try:
            cur = conn.cursor()
            
            # Проверяем блокировку перед сохранением
            cur.execute("SELECT reason FROM blocked_players WHERE player_id = %s", (player_id,))
            blocked = cur.fetchone()
            
            if blocked:
                cur.close()
                conn.close()
                return {
                    'statusCode': 403,
                    'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                    'body': json.dumps({
                        'error': 'Account blocked',
                        'blocked': True,
                        'reason': blocked[0]
                    }),
                    'isBase64Encoded': False
                }
            
            cur.execute("""
                INSERT INTO players (player_id, username, coins, total_earned, total_clicks, 
                                   click_power, auto_click_rate, has_premium, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
                ON CONFLICT (player_id) 
                DO UPDATE SET
                    username = EXCLUDED.username,
                    coins = EXCLUDED.coins,
                    total_earned = EXCLUDED.total_earned,
                    total_clicks = EXCLUDED.total_clicks,
                    click_power = EXCLUDED.click_power,
                    auto_click_rate = EXCLUDED.auto_click_rate,
                    has_premium = EXCLUDED.has_premium,
                    updated_at = CURRENT_TIMESTAMP
            """, (player_id, username, coins, total_earned, total_clicks, 
                  click_power, auto_click_rate, has_premium))
            
            conn.commit()
            cur.close()
            conn.close()
            
            return {
                'statusCode': 200,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'success': True, 'message': 'Player data saved'}),
                'isBase64Encoded': False
            }
        except Exception as e:
            if conn:
                conn.rollback()
                conn.close()
            return {
                'statusCode': 500,
                'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
                'body': json.dumps({'error': str(e)}),
                'isBase64Encoded': False
            }
    
    return {
        'statusCode': 405,
        'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'},
        'body': json.dumps({'error': 'Method not allowed'}),
        'isBase64Encoded': False
    }