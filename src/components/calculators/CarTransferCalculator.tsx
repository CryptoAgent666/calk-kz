import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Car, Calculator, FileCheck, Users, AlertTriangle, Info, ShieldCheck, Receipt } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { TaxPieChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

type Region =
  | 'kyzylorda-region' | 'zhambyl-region' | 'turkestan-region' | 'shymkent-city'
  | 'astana-city' | 'almaty-region' | 'zhetysu-region' | 'west-kazakhstan'
  | 'karaganda-region' | 'kostanay-region' | 'akmola-region' | 'aktobe-region'
  | 'ulytau-region' | 'pavlodar-region' | 'abay-region' | 'mangystau-region'
  | 'east-kazakhstan' | 'almaty-city' | 'north-kazakhstan' | 'atyrau-region';
type NotaryParty = 'relatives' | 'others' | 'legal';

export default function CarTransferCalculator() {
  const { t, i18n } = useTranslation('calculators');

  // Константы 2026
  const MRP_2026 = 4325;
  const REGISTRATION_FEE_MRP = 0.25;
  const CERTIFICATE_FEE_MRP = 1.25;
  const PLATES_FEE_MRP = 2.8;
  // Нотариальный тариф за удостоверение договора отчуждения авто (с 01.01.2026):
  // ставка зависит от СТОРОН сделки, а не от цены ТС.
  // Приказ Министра юстиции РК от 27.09.2025 № 957 (adilet.zan.kz V2500036957).
  const NOTARY_MRP: Record<NotaryParty, number> = {
    relatives: 4,  // близкие родственники (дети, супруг, родители, братья/сёстры, внуки)
    others: 10,    // прочие физлица
    legal: 12,     // одна из сторон — юридическое лицо
  };
  const OGPO_BASE_MRP = 1.9;
  const INSPECTION_COST = 7000;

  // Территориальные коэффициенты ОГПО ВТС — официальная пер-региональная таблица
  // АРРФР (Пост. Правления Агентства №72 от 13.11.2025), действ. с 01.01.2026.
  // Тот же справочник регионов, что и в калькуляторе ОГПО (InsuranceCalculator);
  // прежняя грубая схема (Алматы/Астана 2.96, прочие 1.86) упразднена.
  const TERRITORY_COEFFICIENTS: { id: Region; labelKey: string; coef: number }[] = [
    { id: 'kyzylorda-region', labelKey: 'insurance-premium.regions.kyzylordaRegion', coef: 1.85 },
    { id: 'zhambyl-region', labelKey: 'insurance-premium.regions.zhambylRegion', coef: 1.74 },
    { id: 'turkestan-region', labelKey: 'insurance-premium.regions.turkestanRegion', coef: 1.69 },
    { id: 'shymkent-city', labelKey: 'insurance-premium.regions.shymkentCity', coef: 1.61 },
    { id: 'astana-city', labelKey: 'insurance-premium.regions.astanaCity', coef: 1.44 },
    { id: 'almaty-region', labelKey: 'insurance-premium.regions.almatyRegion', coef: 1.44 },
    { id: 'zhetysu-region', labelKey: 'insurance-premium.regions.zhetysuRegion', coef: 1.20 },
    { id: 'west-kazakhstan', labelKey: 'insurance-premium.regions.westKazakhstan', coef: 1.19 },
    { id: 'karaganda-region', labelKey: 'insurance-premium.regions.karagandaRegion', coef: 1.18 },
    { id: 'kostanay-region', labelKey: 'insurance-premium.regions.kostanayRegion', coef: 1.11 },
    { id: 'akmola-region', labelKey: 'insurance-premium.regions.akmolaRegion', coef: 1.08 },
    { id: 'aktobe-region', labelKey: 'insurance-premium.regions.aktobeRegion', coef: 1.02 },
    { id: 'ulytau-region', labelKey: 'insurance-premium.regions.ulytauRegion', coef: 0.99 },
    { id: 'pavlodar-region', labelKey: 'insurance-premium.regions.pavlodarRegion', coef: 0.82 },
    { id: 'abay-region', labelKey: 'insurance-premium.regions.abayRegion', coef: 0.80 },
    { id: 'mangystau-region', labelKey: 'insurance-premium.regions.mangystauRegion', coef: 0.79 },
    { id: 'east-kazakhstan', labelKey: 'insurance-premium.regions.eastKazakhstan', coef: 0.72 },
    { id: 'almaty-city', labelKey: 'insurance-premium.regions.almatyCity', coef: 0.71 },
    { id: 'north-kazakhstan', labelKey: 'insurance-premium.regions.northKazakhstan', coef: 0.67 },
    { id: 'atyrau-region', labelKey: 'insurance-premium.regions.atyrauRegion', coef: 0.48 },
  ];
  const regionCoef = (r: Region) => TERRITORY_COEFFICIENTS.find((x) => x.id === r)?.coef ?? 1;
  const regionLabelKey = (r: Region) => TERRITORY_COEFFICIENTS.find((x) => x.id === r)?.labelKey ?? '';

  // Входные параметры
  const [salePrice, setSalePrice] = useState<string>('5000000');
  const [purchasePrice, setPurchasePrice] = useState<string>('4500000');
  const [ownershipYears, setOwnershipYears] = useState<string>('2');
  const [ownershipMonths, setOwnershipMonths] = useState<string>('0');
  const [keepPlates, setKeepPlates] = useState<boolean>(false);
  const [needInspection, setNeedInspection] = useState<boolean>(false);
  const [region, setRegion] = useState<Region>('almaty-city');
  const [notaryParty, setNotaryParty] = useState<NotaryParty>('others');
  const [buyerAge, setBuyerAge] = useState<string>('35');
  const [buyerExperience, setBuyerExperience] = useState<string>('10');

  const computeResults = () => {
    const sale = parseFloat(salePrice) || 0;
    const purchase = parseFloat(purchasePrice) || 0;
    const years = parseInt(ownershipYears) || 0;
    const months = parseInt(ownershipMonths) || 0;
    const age = parseInt(buyerAge) || 30;
    const experience = parseInt(buyerExperience) || 2;

    // Регистрационные расходы
    const registrationFee = Math.round(REGISTRATION_FEE_MRP * MRP_2026);
    const certificateFee = Math.round(CERTIFICATE_FEE_MRP * MRP_2026);
    const platesFee = keepPlates ? 0 : Math.round(PLATES_FEE_MRP * MRP_2026);

    // Нотариус — зависит от сторон сделки (родственники/прочие/юрлицо), не от цены авто
    const notaryMRP = NOTARY_MRP[notaryParty];
    const notaryFee = Math.round(notaryMRP * MRP_2026);

    // ОГПО расчёт: базовая 1.9 МРП × территориальный × возраст × стаж
    let ageCoef = 1.1;
    if (age >= 25 && age <= 65) ageCoef = 1.0;
    if (age < 25) ageCoef = 1.1;
    if (age > 65) ageCoef = 1.15;

    let expCoef = 1.1;
    if (experience >= 2 && experience < 7) expCoef = 1.05;
    if (experience >= 7) expCoef = 1.0;
    if (experience < 2) expCoef = 1.1;

    const ogpoFee = Math.round(OGPO_BASE_MRP * MRP_2026 * regionCoef(region) * ageCoef * expCoef);

    // Техосмотр
    const inspectionFee = needInspection ? INSPECTION_COST : 0;

    // Налог с продажи (ИПН 10%) — только если владение < 1 года И есть прирост
    const totalMonths = years * 12 + months;
    let salesTax = 0;
    let taxReason = '';
    if (totalMonths >= 12) {
      taxReason = t('car-transfer.taxExplanation');
    } else if (sale <= purchase) {
      taxReason = t('car-transfer.taxExplanationNoProfit');
    } else {
      const profit = sale - purchase;
      salesTax = Math.round(profit * 0.1);
      taxReason = t('car-transfer.taxExplanationProfit', {
        profit: profit.toLocaleString('ru-KZ') + ' ₸',
      });
    }

    // Распределение: покупатель платит регистрацию + номера + СТС + ОГПО + ТО + половину нотариуса
    // Продавец платит: половину нотариуса + налог с продажи
    const notaryHalf = Math.round(notaryFee / 2);
    const buyerPays = registrationFee + platesFee + certificateFee + ogpoFee + inspectionFee + notaryHalf;
    const sellerPays = (notaryFee - notaryHalf) + salesTax;
    const total = buyerPays + sellerPays;

    return {
      registrationFee,
      platesFee,
      certificateFee,
      notaryFee,
      ogpoFee,
      inspectionFee,
      salesTax,
      taxReason,
      total,
      sellerPays,
      buyerPays,
    };
  };

  // Синхронный расчёт (не useState+useEffect): пререндер сохраняет страницу с
  // числами, и первый клиентский рендер обязан выдать те же числа — иначе
  // гидратация падает (#418/#425). См. эталонный рефакторинг BMICalculator.
  const results = useMemo(
    computeResults,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [salePrice, purchasePrice, ownershipYears, ownershipMonths, keepPlates, needInspection, region, notaryParty, buyerAge, buyerExperience, t, i18n.language]
  );

  const fmt = (n: number) => n.toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="car-transfer" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('car-transfer.heading')}</h1>
            <p className="text-gray-600">{t('car-transfer.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning banner */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <div className="flex items-start space-x-2">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800 text-sm">{t('car-transfer.warning')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('car-transfer.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Sale price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('car-transfer.salePrice')}
              </label>
              <RangeSlider
                value={parseFloat(salePrice) || 0}
                onChange={(v) => setSalePrice(String(v))}
                min={500000}
                max={30000000}
                step={100000}
                formatValue={(v) => fmt(v)}
                color="#f59e0b"
              />
              <input
                type="number"
                value={salePrice}
                onChange={(e) => setSalePrice(e.target.value)}
                className="w-full mt-3 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Purchase price */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('car-transfer.purchasePrice')}
              </label>
              <input
                type="number"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            {/* Ownership period */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('car-transfer.ownershipYears')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="30"
                  value={ownershipYears}
                  onChange={(e) => setOwnershipYears(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('car-transfer.ownershipMonths')}
                </label>
                <input
                  type="number"
                  min="0"
                  max="11"
                  value={ownershipMonths}
                  onChange={(e) => setOwnershipMonths(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Region */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('car-transfer.region')}
              </label>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value as Region)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
              >
                {TERRITORY_COEFFICIENTS.map((r) => (
                  <option key={r.id} value={r.id}>
                    {t(r.labelKey)}
                  </option>
                ))}
              </select>
            </div>

            {/* Notary party (relationship between seller and buyer) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {t('car-transfer.notaryParty')}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['relatives', 'others', 'legal'] as NotaryParty[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setNotaryParty(p)}
                    className={`px-3 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      notaryParty === p
                        ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {t(`car-transfer.notaryParty${p.charAt(0).toUpperCase() + p.slice(1)}`)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">{t('car-transfer.notaryPartyHint')}</p>
            </div>

            {/* Buyer age */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('car-transfer.buyerAge')}
              </label>
              <RangeSlider
                value={parseInt(buyerAge) || 30}
                onChange={(v) => setBuyerAge(String(v))}
                min={18}
                max={80}
                step={1}
                formatValue={(v) => `${v}`}
                color="#f59e0b"
              />
            </div>

            {/* Buyer experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('car-transfer.buyerExperience')}
              </label>
              <RangeSlider
                value={parseInt(buyerExperience) || 2}
                onChange={(v) => setBuyerExperience(String(v))}
                min={0}
                max={50}
                step={1}
                formatValue={(v) => `${v}`}
                color="#f59e0b"
              />
            </div>

            {/* Checkboxes */}
            <div className="space-y-3 pt-2">
              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  checked={keepPlates}
                  onChange={(e) => setKeepPlates(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{t('car-transfer.keepPlates')}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t('car-transfer.keepPlatesHint')}</div>
                </div>
              </label>

              <label className="flex items-start space-x-3 cursor-pointer p-3 rounded-lg bg-amber-50 border border-amber-100 hover:bg-amber-100 transition-colors">
                <input
                  type="checkbox"
                  checked={needInspection}
                  onChange={(e) => setNeedInspection(e.target.checked)}
                  className="mt-1 w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <div className="flex-1">
                  <div className="text-sm font-medium text-gray-900">{t('car-transfer.needInspection')}</div>
                  <div className="text-xs text-gray-600 mt-0.5">{t('car-transfer.needInspectionHint')}</div>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Receipt className="w-5 h-5 inline mr-2" />
            {t('car-transfer.results')}
          </h2>

          <div className="space-y-2">
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm flex items-center"><FileCheck className="w-4 h-4 mr-2 text-amber-600" />{t('car-transfer.registrationFee')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.registrationFee)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm flex items-center"><Car className="w-4 h-4 mr-2 text-amber-600" />{t('car-transfer.plates')}</span>
              <span className="font-semibold text-gray-900">
                {keepPlates ? <span className="text-green-600 text-xs">{t('car-transfer.platesKept')}</span> : fmt(results.platesFee)}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm flex items-center"><FileCheck className="w-4 h-4 mr-2 text-amber-600" />{t('car-transfer.certificate')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.certificateFee)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm flex items-center"><Users className="w-4 h-4 mr-2 text-amber-600" />{t('car-transfer.notary')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.notaryFee)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm flex items-center"><ShieldCheck className="w-4 h-4 mr-2 text-amber-600" />{t('car-transfer.ogpo')}</span>
              <span className="font-semibold text-gray-900">{fmt(results.ogpoFee)}</span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm flex items-center"><Car className="w-4 h-4 mr-2 text-amber-600" />{t('car-transfer.inspection')}</span>
              <span className="font-semibold text-gray-900">
                {needInspection ? fmt(results.inspectionFee) : <span className="text-gray-400 text-xs">{t('car-transfer.inspectionNotNeeded')}</span>}
              </span>
            </div>
            <div className="flex justify-between items-center py-3 border-b border-gray-100">
              <div className="flex-1">
                <span className="text-gray-600 text-sm flex items-center"><Receipt className="w-4 h-4 mr-2 text-amber-600" />{t('car-transfer.salesTax')}</span>
                <span className="text-xs text-gray-500 ml-6">{results.taxReason}</span>
              </div>
              <span className="font-semibold text-gray-900">
                {results.salesTax > 0 ? fmt(results.salesTax) : <span className="text-green-600 text-xs">{t('car-transfer.noSalesTax')}</span>}
              </span>
            </div>
          </div>

          {/* Total */}
          <div className="flex justify-between items-center py-4 bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg px-4 mt-4">
            <span className="text-lg font-semibold text-gray-900">{t('car-transfer.totalCost')}</span>
            <span className="text-2xl font-bold text-amber-700">{fmt(results.total)}</span>
          </div>

          {/* Split */}
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-xs text-blue-600 mb-1">{t('car-transfer.sellerPays')}</div>
              <div className="text-lg font-bold text-blue-700">{fmt(results.sellerPays)}</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-xs text-purple-600 mb-1">{t('car-transfer.buyerPays')}</div>
              <div className="text-lg font-bold text-purple-700">{fmt(results.buyerPays)}</div>
            </div>
          </div>

          {/* Recommendation */}
          <div className="mt-4 bg-gray-50 rounded-lg p-4">
            <div className="flex items-start space-x-2">
              <Info className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">{t('car-transfer.recommendation')}</div>
                <div className="text-xs text-gray-600">{t('car-transfer.recommendationText')}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Chart */}
      {results.total > 0 && (
        <div className="mt-8">
          <TaxPieChart
            data={[
              { name: t('car-transfer.registrationFee'), value: results.registrationFee },
              { name: t('car-transfer.plates'), value: results.platesFee },
              { name: t('car-transfer.certificate'), value: results.certificateFee },
              { name: t('car-transfer.notary'), value: results.notaryFee },
              { name: t('car-transfer.ogpo'), value: results.ogpoFee },
              { name: t('car-transfer.inspection'), value: results.inspectionFee },
              { name: t('car-transfer.salesTax'), value: results.salesTax },
            ].filter((i) => i.value > 0)}
            title={t('car-transfer.results')}
          />
        </div>
      )}

      {/* Export */}
      {results.total > 0 && (
        <div className="mt-8">
          <ExportButtons
            data={{
              title: t('car-transfer.heading'),
              subtitle: t('car-transfer.subtitle'),
              sections: [
                {
                  title: t('car-transfer.parameters'),
                  data: [
                    { label: t('car-transfer.salePrice'), value: fmt(parseFloat(salePrice) || 0) },
                    { label: t('car-transfer.purchasePrice'), value: fmt(parseFloat(purchasePrice) || 0) },
                    { label: t('car-transfer.ownershipYears'), value: `${ownershipYears} / ${ownershipMonths}` },
                    { label: t('car-transfer.region'), value: t(regionLabelKey(region)) },
                    { label: t('car-transfer.notaryParty'), value: t(`car-transfer.notaryParty${notaryParty.charAt(0).toUpperCase() + notaryParty.slice(1)}`) },
                  ],
                },
                {
                  title: t('car-transfer.results'),
                  data: [
                    { label: t('car-transfer.registrationFee'), value: fmt(results.registrationFee) },
                    { label: t('car-transfer.plates'), value: fmt(results.platesFee) },
                    { label: t('car-transfer.certificate'), value: fmt(results.certificateFee) },
                    { label: t('car-transfer.notary'), value: fmt(results.notaryFee) },
                    { label: t('car-transfer.ogpo'), value: fmt(results.ogpoFee) },
                    { label: t('car-transfer.inspection'), value: fmt(results.inspectionFee) },
                    { label: t('car-transfer.salesTax'), value: fmt(results.salesTax) },
                    { label: t('car-transfer.totalCost'), value: fmt(results.total) },
                    { label: t('car-transfer.sellerPays'), value: fmt(results.sellerPays) },
                    { label: t('car-transfer.buyerPays'), value: fmt(results.buyerPays) },
                  ],
                },
              ],
              footer: 'calk.kz',
            }}
            filename="car-transfer-calculation"
          />
        </div>
      )}

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('car-transfer.faq.q1'), answer: t('car-transfer.faq.a1') },
          { question: t('car-transfer.faq.q2'), answer: t('car-transfer.faq.a2') },
          { question: t('car-transfer.faq.q3'), answer: t('car-transfer.faq.a3') },
          { question: t('car-transfer.faq.q4'), answer: t('car-transfer.faq.a4') },
          { question: t('car-transfer.faq.q5'), answer: t('car-transfer.faq.a5') },
        ]}
        sources={[
          { title: i18n.language === 'kk' ? 'ҚР Салық кодексі — КӨ сатудан ЖТС' : 'Налоговый кодекс РК — ИПН с продажи ТС', url: 'https://adilet.zan.kz/rus/docs/K1700000120' },
          { title: i18n.language === 'kk' ? 'СпецЦОН — КӨ қайта ресімдеу' : 'СпецЦОН — переоформление ТС', url: 'https://egov.kz/' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />
      <EmbedWidget
        calculatorId="car-transfer"
        calculatorTitle="Калькулятор переоформления авто"
      />
      <LastUpdated calculatorId="car-transfer" />
    </div>
  );
}
