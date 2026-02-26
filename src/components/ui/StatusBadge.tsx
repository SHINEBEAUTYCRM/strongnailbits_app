import React from 'react';
import { ORDER_STATUS_MAP, OrderStatus } from '@/types/order';
import { useLanguage } from '@/hooks/useLanguage';
import { Badge } from './Badge';

interface StatusBadgeProps {
  status: string;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const { language } = useLanguage();
  const mapping = ORDER_STATUS_MAP[status as OrderStatus];

  if (!mapping) {
    return <Badge text={status} variant="coral" />;
  }

  const label = language === 'ru' ? mapping.label_ru : mapping.label_uk;

  return (
    <Badge
      text={label}
      variant="custom"
      backgroundColor={mapping.color}
      color="#fff"
    />
  );
}
