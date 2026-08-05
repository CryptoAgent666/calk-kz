import { useEffect, useState } from 'react';
import { getRemoveAdsPrice, purchasesAvailable, REMOVE_ADS_FALLBACK_PRICE } from '../purchases';

export type RemoveAdsPrice =
  | { status: 'loading'; price: string }      // цена ещё едет — показываем запасную, тап разрешён
  | { status: 'ready'; price: string }        // живая цена из стора
  | { status: 'unavailable'; price: null };   // стор ничего не отдал — оффер показывать НЕЛЬЗЯ

/**
 * Цена «Убрать рекламу» для UI.
 *
 * Раньше все три поверхности (кнопка в меню, плашка над баннером, тост после
 * интерстишела) держали копипастное состояние и рисовали зашитую цену даже
 * когда покупать было нечего — пользователь тапал и получал алерт «продукт ещё
 * активируется». Здесь «ещё грузится» и «стор ничего не отдал» — разные
 * состояния: в первом показываем запасную цену, во втором оффер прячем.
 *
 * Ролик за 24 часа этим не управляется — он на AdMob, а не на биллинге.
 */
export function useRemoveAdsPrice(): RemoveAdsPrice {
  const [state, setState] = useState<RemoveAdsPrice>(() =>
    purchasesAvailable()
      ? { status: 'loading', price: REMOVE_ADS_FALLBACK_PRICE }
      : { status: 'unavailable', price: null }
  );

  useEffect(() => {
    if (!purchasesAvailable()) return;
    let alive = true;
    void getRemoveAdsPrice().then((price) => {
      if (!alive) return;
      setState(price ? { status: 'ready', price } : { status: 'unavailable', price: null });
    });
    return () => { alive = false; };
  }, []);

  return state;
}
