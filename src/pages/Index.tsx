import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/components/ui/use-toast';
import Icon from '@/components/ui/icon';

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier?: number;
  autoClickPerSecond?: number;
  owned: number;
}

const STORAGE_KEY = 'maycoin_save';

interface GameSave {
  coins: number;
  clickPower: number;
  autoClickRate: number;
  totalClicks: number;
  usedPromoCodes: string[];
  upgrades: Upgrade[];
  referralId: string;
  username: string;
  totalEarned: number;
  hasPremium: boolean;
}

interface Achievement {
  id: string;
  emoji: string;
  name: string;
  description: string;
  requirement: number | string;
  isCompleted: (game: GameSave) => boolean;
}

interface LeaderboardEntry {
  username: string;
  coins: number;
  rank: number;
}

const Index = () => {
  const [referralId] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('ref');
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data: GameSave = JSON.parse(saved);
      return data.referralId || Math.random().toString(36).substring(2, 10);
    }
    return refId || Math.random().toString(36).substring(2, 10);
  });

  const [username, setUsername] = useState(() => {
    const saved = loadGame();
    return saved?.username || `Player${Math.floor(Math.random() * 9999)}`;
  });

  const [totalEarned, setTotalEarned] = useState(() => {
    const saved = loadGame();
    return saved?.totalEarned || 0;
  });

  const [hasPremium, setHasPremium] = useState(() => {
    const saved = loadGame();
    return saved?.hasPremium || false;
  });

  const loadGame = (): GameSave | null => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
    return null;
  };

  const savedGame = loadGame();

  const [coins, setCoins] = useState(savedGame?.coins || 0);
  const [clickPower, setClickPower] = useState(savedGame?.clickPower || 1);
  const [autoClickRate, setAutoClickRate] = useState(savedGame?.autoClickRate || 0);
  const [totalClicks, setTotalClicks] = useState(savedGame?.totalClicks || 0);
  const [promoCode, setPromoCode] = useState('');
  const [usedPromoCodes, setUsedPromoCodes] = useState<string[]>(savedGame?.usedPromoCodes || []);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const [upgrades, setUpgrades] = useState<Upgrade[]>(savedGame?.upgrades || [
    {
      id: 'click1',
      name: 'Усилитель клика',
      description: '+1 монета за клик',
      cost: 50,
      multiplier: 1,
      owned: 0,
    },
    {
      id: 'click2',
      name: 'Мега-кликер',
      description: '+5 монет за клик',
      cost: 250,
      multiplier: 5,
      owned: 0,
    },
    {
      id: 'auto1',
      name: 'Автокликер',
      description: '+1 монета в секунду',
      cost: 100,
      autoClickPerSecond: 1,
      owned: 0,
    },
    {
      id: 'auto2',
      name: 'Робот-майнер',
      description: '+5 монет в секунду',
      cost: 500,
      autoClickPerSecond: 5,
      owned: 0,
    },
    {
      id: 'auto3',
      name: 'Квантовый генератор',
      description: '+20 монет в секунду',
      cost: 2000,
      autoClickPerSecond: 20,
      owned: 0,
    },
  ]);

  const promoCodes: { [key: string]: number } = {
    'MAYSTART': 100,
    'GREENPOWER': 250,
    'NEONBOOST': 500,
    'CYBERPUNK': 1000,
  };

  const saveGame = () => {
    const gameData: GameSave = {
      coins,
      clickPower,
      autoClickRate,
      totalClicks,
      usedPromoCodes,
      upgrades,
      referralId,
      username,
      totalEarned,
      hasPremium,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameData));
    updateLeaderboard(gameData);
  };

  const updateLeaderboard = (gameData: GameSave) => {
    const leaderboardKey = 'maycoin_leaderboard';
    const saved = localStorage.getItem(leaderboardKey);
    let leaderboard: LeaderboardEntry[] = saved ? JSON.parse(saved) : [];

    const existingIndex = leaderboard.findIndex(e => e.username === gameData.username);
    if (existingIndex >= 0) {
      leaderboard[existingIndex].coins = gameData.coins;
    } else {
      leaderboard.push({ username: gameData.username, coins: gameData.coins, rank: 0 });
    }

    leaderboard.sort((a, b) => b.coins - a.coins);
    leaderboard = leaderboard.slice(0, 10).map((entry, index) => ({ ...entry, rank: index + 1 }));
    localStorage.setItem(leaderboardKey, JSON.stringify(leaderboard));
  };

  const getLeaderboard = (): LeaderboardEntry[] => {
    const saved = localStorage.getItem('maycoin_leaderboard');
    return saved ? JSON.parse(saved) : [];
  };

  const achievements: Achievement[] = [
    {
      id: 'newbie',
      emoji: '🌱',
      name: 'Новичок',
      description: 'Заработайте 35,000 MAY',
      requirement: 35000,
      isCompleted: (game) => game.totalEarned >= 35000,
    },
    {
      id: 'experienced',
      emoji: '⚡',
      name: 'Опытный',
      description: 'Заработайте 250,000 MAY',
      requirement: 250000,
      isCompleted: (game) => game.totalEarned >= 250000,
    },
    {
      id: 'master',
      emoji: '👑',
      name: 'Мастер',
      description: 'Заработайте 500,000 MAY',
      requirement: 500000,
      isCompleted: (game) => game.totalEarned >= 500000,
    },
    {
      id: 'freebie',
      emoji: '🎁',
      name: 'Халява!',
      description: 'Активируйте 20 промокодов',
      requirement: 20,
      isCompleted: (game) => game.usedPromoCodes.length >= 20,
    },
    {
      id: 'winner',
      emoji: '🏆',
      name: 'Я победил!',
      description: 'Займите первое место в таблице лидеров',
      requirement: 'rank1',
      isCompleted: (game) => {
        const leaderboard = getLeaderboard();
        return leaderboard[0]?.username === game.username;
      },
    },
    {
      id: 'premium',
      emoji: '💎',
      name: 'Премиум пользователь',
      description: 'Купите подписку MAY PLUS',
      requirement: 'premium',
      isCompleted: (game) => game.hasPremium,
    },
  ];

  useEffect(() => {
    saveGame();
  }, [coins, clickPower, autoClickRate, totalClicks, usedPromoCodes, upgrades, username, totalEarned, hasPremium]);

  useEffect(() => {
    if (autoClickRate > 0) {
      const interval = setInterval(() => {
        setCoins((prev) => prev + autoClickRate);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoClickRate]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refId = params.get('ref');
    if (refId && refId !== referralId) {
      setCoins((prev) => prev + 50);
      toast({
        title: "Бонус за реферала! 🎉",
        description: "+50 монет за переход по реферальной ссылке",
      });
    }
  }, []);

  const handleClick = () => {
    setCoins((prev) => prev + clickPower);
    setTotalClicks((prev) => prev + 1);
    setTotalEarned((prev) => prev + clickPower);
  };

  const buyUpgrade = (upgrade: Upgrade) => {
    if (coins >= upgrade.cost) {
      setCoins((prev) => prev - upgrade.cost);
      
      const updatedUpgrades = upgrades.map((u) => {
        if (u.id === upgrade.id) {
          const newOwned = u.owned + 1;
          const newCost = Math.floor(u.cost * 1.5);
          return { ...u, owned: newOwned, cost: newCost };
        }
        return u;
      });
      
      setUpgrades(updatedUpgrades);

      if (upgrade.multiplier) {
        setClickPower((prev) => prev + upgrade.multiplier);
      }

      if (upgrade.autoClickPerSecond) {
        setAutoClickRate((prev) => prev + upgrade.autoClickPerSecond);
      }

      toast({
        title: "Улучшение куплено!",
        description: upgrade.name,
      });
    } else {
      toast({
        title: "Недостаточно монет",
        description: `Нужно еще ${upgrade.cost - coins} монет`,
        variant: "destructive",
      });
    }
  };

  const applyPromoCode = () => {
    const code = promoCode.toUpperCase();
    
    if (usedPromoCodes.includes(code)) {
      toast({
        title: "Промокод уже использован",
        variant: "destructive",
      });
      return;
    }

    if (promoCodes[code]) {
      setCoins((prev) => prev + promoCodes[code]);
      setTotalEarned((prev) => prev + promoCodes[code]);
      setUsedPromoCodes((prev) => [...prev, code]);
      setPromoCode('');
      toast({
        title: "Промокод активирован! 🎉",
        description: `+${promoCodes[code]} монет`,
      });
    } else {
      toast({
        title: "Неверный промокод",
        variant: "destructive",
      });
    }
  };

  const spinWheel = () => {
    if (coins < 190) {
      toast({
        title: "Недостаточно монет",
        description: "Нужно 190 монет для вращения",
        variant: "destructive",
      });
      return;
    }

    setCoins((prev) => prev - 190);
    setIsSpinning(true);

    const spins = 5 + Math.random() * 3;
    const finalRotation = wheelRotation + 360 * spins;
    setWheelRotation(finalRotation);

    setTimeout(() => {
      const random = Math.random();
      let prize = 0;

      if (random < 0.3) {
        prize = Math.floor(Math.random() * 51) + 50;
      } else if (random < 0.8) {
        prize = Math.floor(Math.random() * 31) + 90;
      } else {
        prize = Math.floor(Math.random() * 106) + 500;
      }

      setCoins((prev) => prev + prize);
      setTotalEarned((prev) => prev + prize);
      setIsSpinning(false);

      toast({
        title: "Поздравляем! 🎰",
        description: `Вы выиграли ${prize} монет!`,
      });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white relative overflow-hidden">
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[100px] animate-pulse-glow" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-4xl font-bold neon-text">MAY COIN</h1>
          <Card className="bg-card/80 backdrop-blur border-primary/30 px-6 py-3 neon-glow">
            <div className="flex items-center gap-3">
              <Icon name="Coins" className="text-primary" size={24} />
              <div>
                <p className="text-sm text-muted-foreground">Баланс</p>
                <p className="text-2xl font-bold text-primary">{Math.floor(coins)}</p>
              </div>
            </div>
          </Card>
        </div>

        <Tabs defaultValue="game" className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-card/50 backdrop-blur border border-primary/30">
            <TabsTrigger value="game" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-base">
              <Icon name="Gamepad2" size={18} className="md:mr-2" />
              <span className="hidden md:inline">Игра</span>
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-base">
              <Icon name="Info" size={18} className="md:mr-2" />
              <span className="hidden md:inline">О проекте</span>
            </TabsTrigger>
            <TabsTrigger value="gifts" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-base">
              <Icon name="Gift" size={18} className="md:mr-2" />
              <span className="hidden md:inline">Подарки</span>
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-black text-xs md:text-base">
              <Icon name="User" size={18} className="md:mr-2" />
              <span className="hidden md:inline">Профиль</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="bg-card/80 backdrop-blur border-primary/30 p-4 md:p-8">
                <div className="flex flex-col items-center justify-center space-y-4 md:space-y-6">
                  <h2 className="text-lg md:text-2xl font-semibold text-primary neon-text text-center">Кликай и зарабатывай!</h2>
                  
                  <button
                    onClick={handleClick}
                    className="relative w-48 h-48 md:w-64 md:h-64 rounded-full bg-gradient-to-br from-primary to-secondary neon-glow animate-glow transition-transform hover:scale-105 active:scale-95 cursor-pointer border-4 border-primary/50"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse"></div>
                    <span className="relative text-2xl md:text-4xl font-bold text-black">MAY COIN</span>
                  </button>

                  <div className="text-center space-y-2">
                    <p className="text-base md:text-lg text-muted-foreground">
                      +{clickPower} монет за клик
                    </p>
                    {autoClickRate > 0 && (
                      <p className="text-base md:text-lg text-primary">
                        🤖 +{autoClickRate} монет/сек
                      </p>
                    )}
                  </div>
                </div>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-primary/30 p-6">
                <h3 className="text-xl font-semibold mb-4 text-primary">🛒 Магазин улучшений</h3>
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                  {upgrades.map((upgrade) => (
                    <Card
                      key={upgrade.id}
                      className="bg-muted/30 border-primary/20 p-3 md:p-4 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-white text-sm md:text-base">{upgrade.name}</h4>
                            {upgrade.owned > 0 && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                x{upgrade.owned}
                              </span>
                            )}
                          </div>
                          <p className="text-xs md:text-sm text-muted-foreground mt-1">{upgrade.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Icon name="Coins" size={14} className="text-primary" />
                            <span className="text-primary font-semibold text-sm md:text-base">{upgrade.cost}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => buyUpgrade(upgrade)}
                          disabled={coins < upgrade.cost}
                          className="bg-primary hover:bg-primary/80 text-black font-semibold text-xs md:text-sm px-3 md:px-4 whitespace-nowrap"
                        >
                          Купить
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="about" className="mt-6">
            <Card className="bg-card/80 backdrop-blur border-primary/30 p-4 md:p-8 max-w-3xl mx-auto">
              <h2 className="text-2xl md:text-3xl font-bold mb-4 md:mb-6 text-primary neon-text">О проекте MAY COIN</h2>
              <div className="space-y-3 md:space-y-4 text-sm md:text-lg">
                <p>
                  🎮 <strong className="text-primary">MAY COIN</strong> — это увлекательная игра-кликер в неоновом киберпанк стиле!
                </p>
                <p>
                  💰 Кликай на монету, зарабатывай коины и покупай улучшения для автоматизации процесса.
                </p>
                <p>
                  🚀 Развивай свою империю монет с помощью автокликеров, роботов-майнеров и квантовых генераторов!
                </p>
                <p>
                  🎁 Используй промокоды и крути колесо фортуны для получения бонусных монет.
                </p>
                <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/30">
                  <h3 className="text-xl font-semibold mb-3 text-primary">Советы для игры:</h3>
                  <ul className="space-y-2 list-disc list-inside">
                    <li>Сначала купите несколько усилителей клика</li>
                    <li>Затем инвестируйте в автокликеры для пассивного дохода</li>
                    <li>Не забывайте использовать промокоды из раздела "Подарки"</li>
                    <li>Колесо фортуны может принести большой куш!</li>
                  </ul>
                </div>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="gifts" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-4 md:gap-6">
              <Card className="bg-card/80 backdrop-blur border-primary/30 p-4 md:p-8">
                <h3 className="text-2xl font-semibold mb-6 text-primary neon-text">🎫 Промокоды</h3>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={promoCode}
                      onChange={(e) => setPromoCode(e.target.value)}
                      placeholder="Введите промокод"
                      className="bg-muted/30 border-primary/30 text-white"
                      onKeyPress={(e) => e.key === 'Enter' && applyPromoCode()}
                    />
                    <Button
                      onClick={applyPromoCode}
                      className="bg-primary hover:bg-primary/80 text-black font-semibold"
                    >
                      Активировать
                    </Button>
                  </div>

                  <div className="mt-8 p-6 bg-primary/10 rounded-lg border border-primary/30">
                    <h4 className="font-semibold mb-3 text-primary">Доступные промокоды:</h4>
                    <div className="space-y-2">
                      {Object.keys(promoCodes).map((code) => (
                        <div
                          key={code}
                          className={`flex justify-between items-center p-3 rounded ${
                            usedPromoCodes.includes(code)
                              ? 'bg-muted/20 opacity-50'
                              : 'bg-muted/30'
                          }`}
                        >
                          <code className="text-primary font-mono">{code}</code>
                          <span className="text-sm">
                            {usedPromoCodes.includes(code) ? '✓ Использован' : `+${promoCodes[code]} монет`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="bg-card/80 backdrop-blur border-primary/30 p-4 md:p-8">
                <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-primary neon-text">🎰 Колесо фортуны</h3>
                <div className="flex flex-col items-center space-y-4 md:space-y-6">
                  <div className="relative w-48 h-48 md:w-64 md:h-64">
                    <div
                      className="absolute inset-0 rounded-full border-8 border-primary neon-glow"
                      style={{
                        transform: `rotate(${wheelRotation}deg)`,
                        transition: isSpinning ? 'transform 3s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                        background: 'conic-gradient(from 0deg, #00ff88 0deg 108deg, #00d4aa 108deg 288deg, #ffaa00 288deg 360deg)',
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 bg-white rounded-full"></div>
                      </div>
                    </div>
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 w-0 h-0 border-l-8 border-r-8 border-t-8 border-l-transparent border-r-transparent border-t-red-500 z-10"></div>
                  </div>

                  <div className="text-center space-y-3 w-full">
                    <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                      <p className="text-sm"><span className="text-[#00ff88]">⬤</span> 30% — от 50 до 100 монет</p>
                      <p className="text-sm"><span className="text-[#00d4aa]">⬤</span> 50% — от 90 до 120 монет</p>
                      <p className="text-sm"><span className="text-[#ffaa00]">⬤</span> 20% — от 500 до 605 монет</p>
                    </div>
                    
                    <Button
                      onClick={spinWheel}
                      disabled={isSpinning || coins < 190}
                      className="w-full bg-primary hover:bg-primary/80 text-black font-semibold text-lg h-12"
                    >
                      {isSpinning ? 'Крутится...' : `Крутить (190 монет)`}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="profile" className="mt-6 space-y-6">
            <div className="max-w-6xl mx-auto">
              <Card className="bg-card/80 backdrop-blur border-primary/30 p-4 md:p-8">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 mb-6">
                  <div className="w-20 h-20 md:w-24 md:h-24 rounded-full bg-gradient-to-br from-primary to-secondary neon-glow flex items-center justify-center">
                    <Icon name="User" size={40} className="text-black md:w-12 md:h-12" />
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-2xl md:text-3xl font-bold text-primary neon-text">{username}</h2>
                    <p className="text-muted-foreground text-sm md:text-base">Кликер-магнат</p>
                  </div>
                  {hasPremium && (
                    <div className="bg-gradient-to-r from-yellow-500/20 to-primary/20 border border-yellow-500/50 rounded-lg px-4 py-2">
                      <span className="text-yellow-400 font-semibold flex items-center gap-2">
                        <Icon name="Crown" size={20} />
                        MAY PLUS
                      </span>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                  <Card className="bg-muted/30 border-primary/20 p-3 md:p-4">
                    <div className="flex flex-col items-center text-center">
                      <Icon name="Coins" className="text-primary mb-2" size={24} />
                      <p className="text-xs text-muted-foreground">Баланс</p>
                      <p className="text-lg md:text-xl font-bold text-primary">{Math.floor(coins)}</p>
                    </div>
                  </Card>

                  <Card className="bg-muted/30 border-primary/20 p-3 md:p-4">
                    <div className="flex flex-col items-center text-center">
                      <Icon name="TrendingUp" className="text-primary mb-2" size={24} />
                      <p className="text-xs text-muted-foreground">Заработано</p>
                      <p className="text-lg md:text-xl font-bold text-primary">{Math.floor(totalEarned)}</p>
                    </div>
                  </Card>

                  <Card className="bg-muted/30 border-primary/20 p-3 md:p-4">
                    <div className="flex flex-col items-center text-center">
                      <Icon name="MousePointerClick" className="text-primary mb-2" size={24} />
                      <p className="text-xs text-muted-foreground">Кликов</p>
                      <p className="text-lg md:text-xl font-bold text-primary">{totalClicks}</p>
                    </div>
                  </Card>

                  <Card className="bg-muted/30 border-primary/20 p-3 md:p-4">
                    <div className="flex flex-col items-center text-center">
                      <Icon name="Zap" className="text-primary mb-2" size={24} />
                      <p className="text-xs text-muted-foreground">Авто/сек</p>
                      <p className="text-lg md:text-xl font-bold text-primary">+{autoClickRate}</p>
                    </div>
                  </Card>
                </div>

                <Card className="bg-primary/10 border-primary/30 p-4 md:p-6">
                  <h3 className="text-lg md:text-xl font-semibold mb-3 md:mb-4 text-primary flex items-center gap-2">
                    <Icon name="Link" size={20} />
                    Реферальная ссылка
                  </h3>
                  <p className="text-xs md:text-sm text-muted-foreground mb-3">
                    Поделитесь ссылкой с друзьями — они получат 50 монет при первом входе!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Input
                      value={`${window.location.origin}?ref=${referralId}`}
                      readOnly
                      className="bg-muted/30 border-primary/30 text-white font-mono text-xs md:text-sm"
                    />
                    <Button
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}?ref=${referralId}`);
                        toast({
                          title: "Скопировано!",
                          description: "Реферальная ссылка скопирована в буфер обмена",
                        });
                      }}
                      className="bg-primary hover:bg-primary/80 text-black font-semibold whitespace-nowrap"
                    >
                      <Icon name="Copy" size={18} className="mr-2" />
                      Копировать
                    </Button>
                  </div>
                </Card>
              </Card>

              <div className="grid lg:grid-cols-2 gap-6">
                <Card className="bg-card/80 backdrop-blur border-primary/30 p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-primary neon-text flex items-center gap-2">
                    <Icon name="Trophy" size={24} />
                    Таблица лидеров
                  </h3>
                  <div className="space-y-2">
                    {getLeaderboard().map((entry, index) => (
                      <Card
                        key={entry.username}
                        className={`p-3 md:p-4 ${
                          entry.username === username
                            ? 'bg-primary/20 border-primary neon-glow'
                            : 'bg-muted/30 border-primary/20'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center font-bold ${
                              index === 0 ? 'bg-yellow-500/20 text-yellow-400' :
                              index === 1 ? 'bg-gray-400/20 text-gray-300' :
                              index === 2 ? 'bg-orange-500/20 text-orange-400' :
                              'bg-muted/50 text-muted-foreground'
                            }`}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </div>
                            <div>
                              <p className="font-semibold text-white text-sm md:text-base">{entry.username}</p>
                              <p className="text-xs text-muted-foreground">#{entry.rank}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Coins" size={16} className="text-primary" />
                            <span className="font-bold text-primary text-sm md:text-base">{Math.floor(entry.coins)}</span>
                          </div>
                        </div>
                      </Card>
                    ))}
                    {getLeaderboard().length === 0 && (
                      <p className="text-center text-muted-foreground py-8">Пока нет записей в таблице лидеров</p>
                    )}
                  </div>
                </Card>

                <Card className="bg-card/80 backdrop-blur border-primary/30 p-4 md:p-6">
                  <h3 className="text-xl md:text-2xl font-semibold mb-4 md:mb-6 text-primary neon-text flex items-center gap-2">
                    <Icon name="Award" size={24} />
                    Достижения
                  </h3>
                  <div className="space-y-3">
                    {achievements.map((achievement) => {
                      const completed = achievement.isCompleted({ coins, clickPower, autoClickRate, totalClicks, usedPromoCodes, upgrades, referralId, username, totalEarned, hasPremium });
                      return (
                        <Card
                          key={achievement.id}
                          className={`p-3 md:p-4 transition-all ${
                            completed
                              ? 'bg-primary/20 border-primary neon-glow'
                              : 'bg-muted/30 border-primary/20 opacity-60'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="text-3xl md:text-4xl">{achievement.emoji}</div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-1">
                                <h4 className="font-semibold text-white text-sm md:text-base">{achievement.name}</h4>
                                {completed && (
                                  <Icon name="CheckCircle2" size={20} className="text-primary" />
                                )}
                              </div>
                              <p className="text-xs md:text-sm text-muted-foreground">{achievement.description}</p>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>

                  {!hasPremium && (
                    <Button
                      onClick={() => {
                        setHasPremium(true);
                        toast({
                          title: "MAY PLUS активирован! 💎",
                          description: "Теперь вы премиум пользователь!",
                        });
                      }}
                      className="w-full mt-6 bg-gradient-to-r from-yellow-500 to-primary hover:from-yellow-600 hover:to-primary/80 text-black font-bold text-base md:text-lg h-12 md:h-14"
                    >
                      <Icon name="Crown" size={20} className="mr-2" />
                      Купить MAY PLUS
                    </Button>
                  )}
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;