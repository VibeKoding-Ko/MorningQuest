import React from 'react';

export function getStudentTier(level: number) {
  const tiers = [
    { name: '씨앗', id: 'seed' },
    { name: '새싹', id: 'sprout' },
    { name: '꽃', id: 'flower' },
    { name: '무지개', id: 'rainbow' },
    { name: '별빛', id: 'starlight' },
    { name: '혜성', id: 'comet' },
    { name: '행성', id: 'planet' },
    { name: '성운', id: 'nebula' },
    { name: '은하', id: 'galaxy' },
    { name: '전설', id: 'Legend' },
  ];

  if (level <= 0) level = 1;
  const tierIndex = Math.min(Math.floor((level - 1) / 5), tiers.length - 1);
  const tier = tiers[tierIndex];

  return {
    name: tier.name,
    icon: `/ranks/${tier.id}.png`,
    level
  };
}

export function RankBadge({ level, className = '' }: { level: number, className?: string }) {
  const tier = getStudentTier(level);
  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-bold text-sm bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm ${className}`}>
      <img src={tier.icon} alt={tier.name} className="w-5 h-5 object-contain" referrerPolicy="no-referrer" />
      <span className="text-gray-700">Lv.{level} {tier.name}</span>
    </div>
  );
}

export function RankIcon({ level, className = '' }: { level: number, className?: string }) {
  const tier = getStudentTier(level);
  return (
    <div className={`flex items-center justify-center drop-shadow-md ${className}`} title={`Lv.${level} ${tier.name}`}>
      <img src={tier.icon} alt={tier.name} className="w-full h-full object-contain" referrerPolicy="no-referrer" />
    </div>
  );
}
