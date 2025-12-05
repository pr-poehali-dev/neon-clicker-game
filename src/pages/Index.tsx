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

const Index = () => {
  const [coins, setCoins] = useState(0);
  const [clickPower, setClickPower] = useState(1);
  const [autoClickRate, setAutoClickRate] = useState(0);
  const [totalClicks, setTotalClicks] = useState(0);
  const [promoCode, setPromoCode] = useState('');
  const [usedPromoCodes, setUsedPromoCodes] = useState<string[]>([]);
  const [isSpinning, setIsSpinning] = useState(false);
  const [wheelRotation, setWheelRotation] = useState(0);

  const [upgrades, setUpgrades] = useState<Upgrade[]>([
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

  useEffect(() => {
    if (autoClickRate > 0) {
      const interval = setInterval(() => {
        setCoins((prev) => prev + autoClickRate);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [autoClickRate]);

  const handleClick = () => {
    setCoins((prev) => prev + clickPower);
    setTotalClicks((prev) => prev + 1);
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
            <TabsTrigger value="game" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Icon name="Gamepad2" size={18} className="mr-2" />
              Игра
            </TabsTrigger>
            <TabsTrigger value="about" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Icon name="Info" size={18} className="mr-2" />
              О проекте
            </TabsTrigger>
            <TabsTrigger value="gifts" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Icon name="Gift" size={18} className="mr-2" />
              Подарки
            </TabsTrigger>
            <TabsTrigger value="profile" className="data-[state=active]:bg-primary data-[state=active]:text-black">
              <Icon name="User" size={18} className="mr-2" />
              Профиль
            </TabsTrigger>
          </TabsList>

          <TabsContent value="game" className="mt-6">
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur border-primary/30 p-8">
                <div className="flex flex-col items-center justify-center space-y-6">
                  <h2 className="text-2xl font-semibold text-primary neon-text">Кликай и зарабатывай!</h2>
                  
                  <button
                    onClick={handleClick}
                    className="relative w-64 h-64 rounded-full bg-gradient-to-br from-primary to-secondary neon-glow animate-glow transition-transform hover:scale-105 active:scale-95 cursor-pointer border-4 border-primary/50"
                  >
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-primary/20 to-transparent animate-pulse"></div>
                    <span className="relative text-4xl font-bold text-black">MAY COIN</span>
                  </button>

                  <div className="text-center space-y-2">
                    <p className="text-lg text-muted-foreground">
                      +{clickPower} монет за клик
                    </p>
                    {autoClickRate > 0 && (
                      <p className="text-lg text-primary">
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
                      className="bg-muted/30 border-primary/20 p-4 hover:border-primary/50 transition-all"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold text-white">{upgrade.name}</h4>
                            {upgrade.owned > 0 && (
                              <span className="text-xs bg-primary/20 text-primary px-2 py-1 rounded">
                                x{upgrade.owned}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">{upgrade.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Icon name="Coins" size={16} className="text-primary" />
                            <span className="text-primary font-semibold">{upgrade.cost}</span>
                          </div>
                        </div>
                        <Button
                          onClick={() => buyUpgrade(upgrade)}
                          disabled={coins < upgrade.cost}
                          className="ml-4 bg-primary hover:bg-primary/80 text-black font-semibold"
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
            <Card className="bg-card/80 backdrop-blur border-primary/30 p-8 max-w-3xl mx-auto">
              <h2 className="text-3xl font-bold mb-6 text-primary neon-text">О проекте MAY COIN</h2>
              <div className="space-y-4 text-lg">
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
            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="bg-card/80 backdrop-blur border-primary/30 p-8">
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

              <Card className="bg-card/80 backdrop-blur border-primary/30 p-8">
                <h3 className="text-2xl font-semibold mb-6 text-primary neon-text">🎰 Колесо фортуны</h3>
                <div className="flex flex-col items-center space-y-6">
                  <div className="relative w-64 h-64">
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

          <TabsContent value="profile" className="mt-6">
            <Card className="bg-card/80 backdrop-blur border-primary/30 p-8 max-w-2xl mx-auto">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary neon-glow flex items-center justify-center">
                  <Icon name="User" size={48} className="text-black" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-primary neon-text">Игрок</h2>
                  <p className="text-muted-foreground">Кликер-магнат</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-muted/30 border-primary/20 p-6">
                    <div className="flex items-center gap-3">
                      <Icon name="Coins" className="text-primary" size={32} />
                      <div>
                        <p className="text-sm text-muted-foreground">Всего монет</p>
                        <p className="text-2xl font-bold text-primary">{Math.floor(coins)}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-muted/30 border-primary/20 p-6">
                    <div className="flex items-center gap-3">
                      <Icon name="MousePointerClick" className="text-primary" size={32} />
                      <div>
                        <p className="text-sm text-muted-foreground">Всего кликов</p>
                        <p className="text-2xl font-bold text-primary">{totalClicks}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-muted/30 border-primary/20 p-6">
                    <div className="flex items-center gap-3">
                      <Icon name="Zap" className="text-primary" size={32} />
                      <div>
                        <p className="text-sm text-muted-foreground">Сила клика</p>
                        <p className="text-2xl font-bold text-primary">+{clickPower}</p>
                      </div>
                    </div>
                  </Card>

                  <Card className="bg-muted/30 border-primary/20 p-6">
                    <div className="flex items-center gap-3">
                      <Icon name="TrendingUp" className="text-primary" size={32} />
                      <div>
                        <p className="text-sm text-muted-foreground">Авто/сек</p>
                        <p className="text-2xl font-bold text-primary">+{autoClickRate}</p>
                      </div>
                    </div>
                  </Card>
                </div>

                <Card className="bg-muted/30 border-primary/20 p-6">
                  <h3 className="text-xl font-semibold mb-4 text-primary">🏆 Улучшения</h3>
                  <div className="space-y-3">
                    {upgrades.filter(u => u.owned > 0).map((upgrade) => (
                      <div key={upgrade.id} className="flex items-center justify-between">
                        <span className="text-white">{upgrade.name}</span>
                        <span className="text-primary font-semibold">x{upgrade.owned}</span>
                      </div>
                    ))}
                    {upgrades.filter(u => u.owned > 0).length === 0 && (
                      <p className="text-muted-foreground text-center py-4">
                        Пока нет купленных улучшений
                      </p>
                    )}
                  </div>
                </Card>

                <Card className="bg-muted/30 border-primary/20 p-6">
                  <h3 className="text-xl font-semibold mb-4 text-primary">📊 Прогресс</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">До 1000 монет</span>
                        <span className="text-sm text-primary">{Math.floor((coins / 1000) * 100)}%</span>
                      </div>
                      <Progress value={(coins / 1000) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm">До 100 кликов</span>
                        <span className="text-sm text-primary">{Math.floor((totalClicks / 100) * 100)}%</span>
                      </div>
                      <Progress value={(totalClicks / 100) * 100} className="h-2" />
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
