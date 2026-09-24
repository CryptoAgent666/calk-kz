/** Откуда открыли экран предложения: плашка над баннером или тост после интерстишела. */
export type OfferSource = 'bar' | 'toast';

export const OPEN_REMOVE_ADS_OFFER_EVENT = 'calk:open-remove-ads-offer';

export interface OpenRemoveAdsOfferDetail {
  source: OfferSource;
  /** Вариант текста плашки (price / coffee) — для воронки. */
  variant?: string;
}

/** Открыть экран предложения «Убрать рекламу» (его слушает RemoveAdsOffer в Layout). */
export function openRemoveAdsOffer(source: OfferSource, variant?: string): void {
  window.dispatchEvent(new CustomEvent<OpenRemoveAdsOfferDetail>(
    OPEN_REMOVE_ADS_OFFER_EVENT, { detail: { source, variant } },
  ));
}
