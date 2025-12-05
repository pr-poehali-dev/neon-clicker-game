import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const ADMIN_API = 'https://functions.poehali.dev/f8c72edd-8483-4590-9e23-5a0891e36e7b';

interface Player {
  playerId: string;
  username: string;
  coins: number;
  totalEarned: number;
  totalClicks: number;
  hasPremium: boolean;
  lastUpdated: string;
  isBlocked: boolean;
  blockReason?: string;
  blockedAt?: string;
}

const Admin = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [coinsInput, setCoinsInput] = useState('');
  const [blockReason, setBlockReason] = useState('');

  const authenticate = async () => {
    if (!password) {
      toast({
        title: "Ошибка",
        description: "Введите пароль",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(ADMIN_API, {
        method: 'GET',
        headers: {
          'X-Admin-Password': password,
        },
      });

      if (response.status === 403) {
        toast({
          title: "Доступ запрещён",
          description: "Неверный пароль администратора",
          variant: "destructive",
        });
        return;
      }

      if (response.ok) {
        setIsAuthenticated(true);
        localStorage.setItem('admin_password', password);
        loadPlayers();
        toast({
          title: "Добро пожаловать!",
          description: "Вы вошли в админ-панель",
        });
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось подключиться к серверу",
        variant: "destructive",
      });
    }
  };

  const loadPlayers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(ADMIN_API, {
        method: 'GET',
        headers: {
          'X-Admin-Password': password || localStorage.getItem('admin_password') || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setPlayers(data.players);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось загрузить игроков",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateCoins = async (playerId: string, change: number) => {
    try {
      const response = await fetch(ADMIN_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password || localStorage.getItem('admin_password') || '',
        },
        body: JSON.stringify({ playerId, coinsChange: change }),
      });

      if (response.ok) {
        toast({
          title: "Успешно!",
          description: `Монеты ${change > 0 ? 'добавлены' : 'удалены'}`,
        });
        loadPlayers();
        setCoinsInput('');
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось изменить монеты",
        variant: "destructive",
      });
    }
  };

  const blockPlayer = async (playerId: string, reason: string) => {
    if (!reason.trim()) {
      toast({
        title: "Ошибка",
        description: "Укажите причину блокировки",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password || localStorage.getItem('admin_password') || '',
        },
        body: JSON.stringify({ playerId, action: 'block', reason }),
      });

      if (response.ok) {
        toast({
          title: "Игрок заблокирован",
          description: "Пользователь больше не сможет играть",
        });
        loadPlayers();
        setBlockReason('');
        setSelectedPlayer(null);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось заблокировать игрока",
        variant: "destructive",
      });
    }
  };

  const unblockPlayer = async (playerId: string) => {
    try {
      const response = await fetch(ADMIN_API, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Password': password || localStorage.getItem('admin_password') || '',
        },
        body: JSON.stringify({ playerId, action: 'unblock' }),
      });

      if (response.ok) {
        toast({
          title: "Игрок разблокирован",
          description: "Пользователь снова может играть",
        });
        loadPlayers();
        setSelectedPlayer(null);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось разблокировать игрока",
        variant: "destructive",
      });
    }
  };

  const deletePlayer = async (playerId: string) => {
    if (!confirm('Вы уверены? Это удалит игрока из базы данных!')) {
      return;
    }

    try {
      const response = await fetch(`${ADMIN_API}?playerId=${playerId}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Password': password || localStorage.getItem('admin_password') || '',
        },
      });

      if (response.ok) {
        toast({
          title: "Игрок удалён",
          description: "Данные игрока удалены из базы",
        });
        loadPlayers();
        setSelectedPlayer(null);
      }
    } catch (error) {
      toast({
        title: "Ошибка",
        description: "Не удалось удалить игрока",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const savedPassword = localStorage.getItem('admin_password');
    if (savedPassword) {
      setPassword(savedPassword);
      setIsAuthenticated(true);
      loadPlayers();
    }
  }, []);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md p-8 bg-card/90 backdrop-blur border-primary/30">
          <div className="text-center mb-6">
            <Icon name="Shield" size={48} className="text-primary mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-white mb-2">Админ-панель</h1>
            <p className="text-muted-foreground">Введите пароль для доступа</p>
          </div>

          <div className="space-y-4">
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && authenticate()}
              placeholder="Пароль администратора"
              className="bg-muted/30 border-primary/30 text-white"
            />
            <Button
              onClick={authenticate}
              className="w-full bg-primary hover:bg-primary/80 text-black font-bold"
            >
              Войти
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 p-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <Icon name="Shield" size={32} className="text-primary" />
            <h1 className="text-3xl font-bold text-white">Админ-панель MAY COIN</h1>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={loadPlayers}
              variant="outline"
              disabled={isLoading}
              className="border-primary/30 text-white"
            >
              <Icon name="RefreshCw" size={16} className={isLoading ? 'animate-spin' : ''} />
            </Button>
            <Button
              onClick={() => {
                setIsAuthenticated(false);
                localStorage.removeItem('admin_password');
                setPassword('');
              }}
              variant="outline"
              className="border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              <Icon name="LogOut" size={16} />
            </Button>
          </div>
        </div>

        <Tabs defaultValue="players" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted/30">
            <TabsTrigger value="players">Все игроки ({players.length})</TabsTrigger>
            <TabsTrigger value="blocked">
              Заблокированные ({players.filter(p => p.isBlocked).length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="players" className="space-y-4 mt-6">
            {isLoading ? (
              <div className="text-center py-12">
                <Icon name="Loader" size={48} className="animate-spin text-primary mx-auto" />
              </div>
            ) : (
              <div className="grid gap-4">
                {players.filter(p => !p.isBlocked).map((player) => (
                  <Card key={player.playerId} className="bg-card/80 backdrop-blur border-primary/30 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-xl font-bold text-white">{player.username}</h3>
                          {player.hasPremium && (
                            <Icon name="Crown" size={20} className="text-yellow-400" />
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Монеты</p>
                            <p className="text-white font-semibold">{player.coins.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Всего заработано</p>
                            <p className="text-white font-semibold">{player.totalEarned.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Кликов</p>
                            <p className="text-white font-semibold">{player.totalClicks.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">ID</p>
                            <p className="text-white font-mono text-xs">{player.playerId}</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button
                          onClick={() => setSelectedPlayer(player)}
                          size="sm"
                          variant="outline"
                          className="border-primary/30 text-primary"
                        >
                          <Icon name="Settings" size={16} />
                        </Button>
                        <Button
                          onClick={() => deletePlayer(player.playerId)}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>

                    {selectedPlayer?.playerId === player.playerId && (
                      <div className="mt-4 pt-4 border-t border-primary/20 space-y-4">
                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Управление монетами</h4>
                          <div className="flex gap-2">
                            <Input
                              type="number"
                              value={coinsInput}
                              onChange={(e) => setCoinsInput(e.target.value)}
                              placeholder="Количество монет"
                              className="bg-muted/30 border-primary/30 text-white"
                            />
                            <Button
                              onClick={() => {
                                const amount = parseInt(coinsInput);
                                if (amount) updateCoins(player.playerId, amount);
                              }}
                              size="sm"
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Icon name="Plus" size={16} />
                            </Button>
                            <Button
                              onClick={() => {
                                const amount = parseInt(coinsInput);
                                if (amount) updateCoins(player.playerId, -amount);
                              }}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Icon name="Minus" size={16} />
                            </Button>
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-semibold text-white mb-2">Блокировка</h4>
                          <div className="flex gap-2">
                            <Input
                              value={blockReason}
                              onChange={(e) => setBlockReason(e.target.value)}
                              placeholder="Причина блокировки"
                              className="bg-muted/30 border-primary/30 text-white"
                            />
                            <Button
                              onClick={() => blockPlayer(player.playerId, blockReason)}
                              size="sm"
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <Icon name="Ban" size={16} />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="blocked" className="space-y-4 mt-6">
            {players.filter(p => p.isBlocked).length === 0 ? (
              <div className="text-center py-12">
                <Icon name="CheckCircle" size={48} className="text-green-500 mx-auto mb-4" />
                <p className="text-muted-foreground">Нет заблокированных игроков</p>
              </div>
            ) : (
              <div className="grid gap-4">
                {players.filter(p => p.isBlocked).map((player) => (
                  <Card key={player.playerId} className="bg-red-950/30 backdrop-blur border-red-500/30 p-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon name="Ban" size={20} className="text-red-400" />
                          <h3 className="text-xl font-bold text-white">{player.username}</h3>
                        </div>
                        <p className="text-red-300 text-sm mb-2">
                          <strong>Причина:</strong> {player.blockReason}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-muted-foreground">Монеты</p>
                            <p className="text-white font-semibold">{player.coins.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">ID</p>
                            <p className="text-white font-mono text-xs">{player.playerId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Заблокирован</p>
                            <p className="text-white text-xs">
                              {player.blockedAt ? new Date(player.blockedAt).toLocaleDateString('ru') : '-'}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          onClick={() => unblockPlayer(player.playerId)}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Icon name="Unlock" size={16} />
                          Разблокировать
                        </Button>
                        <Button
                          onClick={() => deletePlayer(player.playerId)}
                          size="sm"
                          variant="outline"
                          className="border-red-500/30 text-red-400"
                        >
                          <Icon name="Trash2" size={16} />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
