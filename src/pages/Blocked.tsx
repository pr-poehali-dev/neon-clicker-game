import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface BlockedProps {
  reason?: string;
}

const Blocked = ({ reason }: BlockedProps) => {
  const [blockReason, setBlockReason] = useState(reason || 'Нарушение правил игры');

  useEffect(() => {
    const savedReason = localStorage.getItem('block_reason');
    if (savedReason) {
      setBlockReason(savedReason);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-red-900 to-black flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl p-8 md:p-12 bg-red-950/50 backdrop-blur border-red-500/50 text-center">
        <div className="mb-6 animate-pulse">
          <Icon name="ShieldAlert" size={80} className="text-red-500 mx-auto mb-4" />
        </div>

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
          Аккаунт заблокирован
        </h1>

        <div className="bg-red-900/30 border border-red-500/30 rounded-lg p-6 mb-6">
          <p className="text-red-300 text-sm uppercase font-semibold mb-2">Причина блокировки:</p>
          <p className="text-white text-xl font-bold">{blockReason}</p>
        </div>

        <p className="text-gray-300 mb-8">
          Ваш аккаунт был заблокирован администратором. <br />
          Доступ к игре временно ограничен.
        </p>

        <div className="space-y-4 text-left bg-black/30 rounded-lg p-6">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Icon name="Info" size={20} className="text-blue-400" />
            Что делать?
          </h3>
          <ul className="text-gray-300 space-y-2 ml-7">
            <li>• Свяжитесь с администратором для выяснения причин</li>
            <li>• Дождитесь окончания срока блокировки</li>
            <li>• Ознакомьтесь с правилами игры</li>
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-red-500/30">
          <p className="text-gray-400 text-sm">
            Если вы считаете, что блокировка была ошибочной, обратитесь к администратору
          </p>
        </div>
      </Card>
    </div>
  );
};

export default Blocked;
