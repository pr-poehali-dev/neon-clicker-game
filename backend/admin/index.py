import json
import os
import psycopg2
from typing import Dict, Any

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    '''
    Админ-панель для управления игроками: блокировка, выдача монет, удаление
    Args: event - HTTP запрос с методом и данными
          context - контекст выполнения функции
    Returns: Ответ с данными игроков или результатом операции
    '''
    method: str = event.get('httpMethod', 'GET')
    
    # CORS
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Admin-Password',
                'Access-Control-Max-Age': '86400'
            },
            'body': ''
        }
    
    # Проверка пароля администратора
    headers = event.get('headers', {})
    admin_password = headers.get('x-admin-password') or headers.get('X-Admin-Password')
    expected_password = os.environ.get('ADMIN_PASSWORD')
    
    if not admin_password or admin_password != expected_password:
        return {
            'statusCode': 403,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Неверный пароль администратора'})
        }
    
    dsn = os.environ.get('DATABASE_URL')
    conn = psycopg2.connect(dsn)
    cur = conn.cursor()
    
    try:
        # GET - получить всех игроков
        if method == 'GET':
            cur.execute('''
                SELECT p.player_id, p.username, p.coins, p.total_earned, 
                       p.total_clicks, p.has_premium, p.last_updated,
                       b.reason as block_reason, b.blocked_at
                FROM players p
                LEFT JOIN blocked_players b ON p.player_id = b.player_id
                ORDER BY p.coins DESC
            ''')
            
            players = []
            for row in cur.fetchall():
                players.append({
                    'playerId': row[0],
                    'username': row[1],
                    'coins': row[2],
                    'totalEarned': row[3],
                    'totalClicks': row[4],
                    'hasPremium': row[5],
                    'lastUpdated': row[6].isoformat() if row[6] else None,
                    'isBlocked': row[7] is not None,
                    'blockReason': row[7],
                    'blockedAt': row[8].isoformat() if row[8] else None
                })
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'players': players})
            }
        
        # POST - изменить монеты игрока
        if method == 'POST':
            body = json.loads(event.get('body', '{}'))
            player_id = body.get('playerId')
            coins_change = body.get('coinsChange', 0)
            
            cur.execute('SELECT coins FROM players WHERE player_id = %s', (player_id,))
            result = cur.fetchone()
            
            if not result:
                return {
                    'statusCode': 404,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'error': 'Игрок не найден'})
                }
            
            new_coins = max(0, result[0] + coins_change)
            cur.execute(
                'UPDATE players SET coins = %s WHERE player_id = %s',
                (new_coins, player_id)
            )
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'success': True, 'newCoins': new_coins})
            }
        
        # PUT - заблокировать/разблокировать игрока
        if method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            player_id = body.get('playerId')
            action = body.get('action')  # 'block' or 'unblock'
            reason = body.get('reason', 'Нарушение правил')
            
            if action == 'block':
                cur.execute('SELECT username FROM players WHERE player_id = %s', (player_id,))
                result = cur.fetchone()
                
                if not result:
                    return {
                        'statusCode': 404,
                        'headers': {
                            'Access-Control-Allow-Origin': '*',
                            'Content-Type': 'application/json'
                        },
                        'isBase64Encoded': False,
                        'body': json.dumps({'error': 'Игрок не найден'})
                    }
                
                username = result[0]
                cur.execute(
                    '''INSERT INTO blocked_players (player_id, username, reason)
                       VALUES (%s, %s, %s)
                       ON CONFLICT (player_id) DO UPDATE SET reason = %s''',
                    (player_id, username, reason, reason)
                )
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'action': 'blocked'})
                }
            
            elif action == 'unblock':
                cur.execute('DELETE FROM blocked_players WHERE player_id = %s', (player_id,))
                conn.commit()
                
                return {
                    'statusCode': 200,
                    'headers': {
                        'Access-Control-Allow-Origin': '*',
                        'Content-Type': 'application/json'
                    },
                    'isBase64Encoded': False,
                    'body': json.dumps({'success': True, 'action': 'unblocked'})
                }
        
        # DELETE - удалить игрока из базы
        if method == 'DELETE':
            params = event.get('queryStringParameters', {})
            player_id = params.get('playerId')
            
            # Удаляем из blocked_players если есть
            cur.execute('DELETE FROM blocked_players WHERE player_id = %s', (player_id,))
            # Удаляем из players
            cur.execute('DELETE FROM players WHERE player_id = %s', (player_id,))
            conn.commit()
            
            return {
                'statusCode': 200,
                'headers': {
                    'Access-Control-Allow-Origin': '*',
                    'Content-Type': 'application/json'
                },
                'isBase64Encoded': False,
                'body': json.dumps({'success': True})
            }
        
        return {
            'statusCode': 405,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'isBase64Encoded': False,
            'body': json.dumps({'error': 'Метод не поддерживается'})
        }
    
    finally:
        cur.close()
        conn.close()
