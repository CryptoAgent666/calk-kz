import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Scale, Users, Info } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { RangeSlider } from '../ui/RangeSlider';
import { getSources } from '../../data/calculatorSources';
import { getMethodology } from '../../data/calculatorMethodology';
import { QuickAnswer } from '../ui/QuickAnswer';

const MRP_2026 = 4325;

export default function PropertyDivisionCalculator() {
  const { t } = useTranslation('calculators');

  // Совместное имущество (делится)
  const [apartmentMarriage, setApartmentMarriage] = useState<string>('25000000');
  const [carMarriage, setCarMarriage] = useState<string>('8000000');
  const [landMarriage, setLandMarriage] = useState<string>('0');
  const [depositsMarriage, setDepositsMarriage] = useState<string>('3000000');
  const [businessValue, setBusinessValue] = useState<string>('0');
  const [luxuryItems, setLuxuryItems] = useState<string>('0');

  // Долги (делятся если в интересах семьи)
  const [mortgageDebt, setMortgageDebt] = useState<string>('10000000');
  const [consumerLoans, setConsumerLoans] = useState<string>('500000');

  // Личное имущество (не делится)
  const [apartmentPreMarriage, setApartmentPreMarriage] = useState<string>('0');
  const [depositsPreMarriage, setDepositsPreMarriage] = useState<string>('0');

  // Модификаторы
  const [hasChildren, setHasChildren] = useState<boolean>(false);
  const [childrenWith, setChildrenWith] = useState<'wife' | 'husband' | 'both'>('wife');

  const results = useMemo(() => {
    const assetsMarriage = (parseFloat(apartmentMarriage) || 0) +
                           (parseFloat(carMarriage) || 0) +
                           (parseFloat(landMarriage) || 0) +
                           (parseFloat(depositsMarriage) || 0) +
                           (parseFloat(businessValue) || 0) +
                           (parseFloat(luxuryItems) || 0);
    const debts = (parseFloat(mortgageDebt) || 0) + (parseFloat(consumerLoans) || 0);
    const personalAssets = (parseFloat(apartmentPreMarriage) || 0) + (parseFloat(depositsPreMarriage) || 0);
    const netAssets = assetsMarriage - debts;

    // Доли по умолчанию 50/50
    let husbandShare = 0.5;
    let wifeShare = 0.5;

    // Если дети с одной стороной — может отступить в пользу родителя (55/45)
    if (hasChildren && childrenWith === 'wife') {
      wifeShare = 0.55;
      husbandShare = 0.45;
    } else if (hasChildren && childrenWith === 'husband') {
      husbandShare = 0.55;
      wifeShare = 0.45;
    }

    const husbandGets = netAssets * husbandShare;
    const wifeGets = netAssets * wifeShare;
    const husbandDebts = debts * husbandShare;
    const wifeDebts = debts * wifeShare;

    // Госпошлина при разделе в суде = 1% от стоимости иска, минимум 0.5 МРП
    const courtFee = Math.max(assetsMarriage * 0.01, 0.5 * MRP_2026);

    // Юр. услуги — ориентировочно
    const lawyerFee = Math.min(Math.max(assetsMarriage * 0.02, 100000), 500000);
    const notaryFee = 10 * MRP_2026;

    return {
      assetsMarriage,
      debts,
      netAssets,
      personalAssets,
      husbandShare: husbandShare * 100,
      wifeShare: wifeShare * 100,
      husbandGets,
      wifeGets,
      husbandDebts,
      wifeDebts,
      courtFee,
      lawyerFee,
      notaryFee,
      totalLegal: courtFee + lawyerFee + notaryFee,
    };
  }, [apartmentMarriage, carMarriage, landMarriage, depositsMarriage, businessValue, luxuryItems,
      mortgageDebt, consumerLoans, apartmentPreMarriage, depositsPreMarriage, hasChildren, childrenWith]);

  const formatNumber = (n: number) => Math.round(n).toLocaleString('ru-KZ') + ' ₸';

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="property-division" />
      <div className="mb-8 flex items-center space-x-3">
        <div className="w-10 h-10 bg-gradient-to-r from-rose-500 to-red-600 rounded-lg flex items-center justify-center">
          <Scale className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('property-division.title')}</h1>
          <p className="text-gray-600">{t('property-division.subtitle')}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-6">
          <h2 className="text-xl font-semibold">{t('property-division.parameters')}</h2>

          <div className="space-y-4">
            <h3 className="font-medium text-gray-900">{t('property-division.assetsInMarriage')}</h3>
            <RangeSlider label={t('property-division.apartment')} value={parseFloat(apartmentMarriage) || 0}
              onChange={v => setApartmentMarriage(String(v))} min={0} max={100000000} step={500000} formatValue={formatNumber} />
            <RangeSlider label={t('property-division.car')} value={parseFloat(carMarriage) || 0}
              onChange={v => setCarMarriage(String(v))} min={0} max={50000000} step={100000} formatValue={formatNumber} />
            <RangeSlider label={t('property-division.land')} value={parseFloat(landMarriage) || 0}
              onChange={v => setLandMarriage(String(v))} min={0} max={50000000} step={500000} formatValue={formatNumber} />
            <RangeSlider label={t('property-division.deposits')} value={parseFloat(depositsMarriage) || 0}
              onChange={v => setDepositsMarriage(String(v))} min={0} max={50000000} step={100000} formatValue={formatNumber} />
            <RangeSlider label={t('property-division.business')} value={parseFloat(businessValue) || 0}
              onChange={v => setBusinessValue(String(v))} min={0} max={100000000} step={500000} formatValue={formatNumber} />
            <RangeSlider label={t('property-division.luxury')} value={parseFloat(luxuryItems) || 0}
              onChange={v => setLuxuryItems(String(v))} min={0} max={30000000} step={100000} formatValue={formatNumber} />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-gray-900">{t('property-division.debtsInMarriage')}</h3>
            <RangeSlider label={t('property-division.mortgage')} value={parseFloat(mortgageDebt) || 0}
              onChange={v => setMortgageDebt(String(v))} min={0} max={50000000} step={100000} formatValue={formatNumber} />
            <RangeSlider label={t('property-division.consumerLoans')} value={parseFloat(consumerLoans) || 0}
              onChange={v => setConsumerLoans(String(v))} min={0} max={10000000} step={50000} formatValue={formatNumber} />
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-medium text-gray-900">{t('property-division.personalAssets')}</h3>
            <p className="text-xs text-gray-500">{t('property-division.personalNote')}</p>
            <RangeSlider label={t('property-division.apartmentPre')} value={parseFloat(apartmentPreMarriage) || 0}
              onChange={v => setApartmentPreMarriage(String(v))} min={0} max={100000000} step={500000} formatValue={formatNumber} />
            <RangeSlider label={t('property-division.depositsPre')} value={parseFloat(depositsPreMarriage) || 0}
              onChange={v => setDepositsPreMarriage(String(v))} min={0} max={50000000} step={100000} formatValue={formatNumber} />
          </div>

          <div className="space-y-3 pt-4 border-t">
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={hasChildren} onChange={e => setHasChildren(e.target.checked)} className="h-4 w-4" />
              <span className="text-sm font-medium">{t('property-division.hasChildren')}</span>
            </label>
            {hasChildren && (
              <div>
                <label className="block text-sm text-gray-700 mb-2">{t('property-division.childrenWith')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['wife', 'husband', 'both'] as const).map(w => (
                    <button key={w} onClick={() => setChildrenWith(w)}
                      className={`p-2 rounded-lg border text-sm ${childrenWith === w ? 'bg-rose-600 text-white border-rose-600' : 'bg-white border-gray-300'}`}>
                      {t(`property-division.${w}`)}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 space-y-4">
          <h2 className="text-xl font-semibold">{t('property-division.resultsTitle')}</h2>

          <div className="bg-gradient-to-r from-rose-50 to-red-50 rounded-lg p-6 border border-rose-200">
            <div className="text-sm text-gray-600">{t('property-division.totalNetAssets')}</div>
            <div className="text-3xl font-bold text-rose-700">{formatNumber(results.netAssets)}</div>
            <div className="text-xs text-gray-500 mt-1">{t('property-division.totalAssets')}: {formatNumber(results.assetsMarriage)} − {t('property-division.debts')}: {formatNumber(results.debts)}</div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-900">{t('property-division.husband')} ({results.husbandShare}%)</span>
              </div>
              <div className="text-xl font-bold text-blue-700">{formatNumber(results.husbandGets)}</div>
              <div className="text-xs text-blue-700 mt-1">− долги: {formatNumber(results.husbandDebts)}</div>
            </div>
            <div className="bg-pink-50 rounded-lg p-4 border border-pink-200">
              <div className="flex items-center gap-1 mb-1">
                <Users className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-medium text-pink-900">{t('property-division.wife')} ({results.wifeShare}%)</span>
              </div>
              <div className="text-xl font-bold text-pink-700">{formatNumber(results.wifeGets)}</div>
              <div className="text-xs text-pink-700 mt-1">− долги: {formatNumber(results.wifeDebts)}</div>
            </div>
          </div>

          {results.personalAssets > 0 && (
            <div className="bg-gray-50 rounded-lg p-4 text-sm">
              <div className="font-medium text-gray-900 mb-1">{t('property-division.personalAssetsNote')}</div>
              <div>{formatNumber(results.personalAssets)} ({t('property-division.notDivided')})</div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <div className="font-medium text-amber-900 mb-2">{t('property-division.legalCosts')}</div>
            <div className="text-sm space-y-1">
              <div className="flex justify-between"><span>{t('property-division.courtFee')} (1%)</span><span>{formatNumber(results.courtFee)}</span></div>
              <div className="flex justify-between"><span>{t('property-division.lawyer')}</span><span>~{formatNumber(results.lawyerFee)}</span></div>
              <div className="flex justify-between"><span>{t('property-division.notary')}</span><span>{formatNumber(results.notaryFee)}</span></div>
              <div className="flex justify-between border-t border-amber-300 pt-1 font-semibold"><span>{t('property-division.total')}</span><span>~{formatNumber(results.totalLegal)}</span></div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-900 flex items-start gap-2">
            <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <div>{t('property-division.disclaimer')}</div>
          </div>
        </div>
      </div>

      <div className="mt-8">
        <ExportButtons
          data={{
            title: t('property-division.title'),
            sections: [{ title: t('property-division.resultsTitle'), data: [
              { label: t('property-division.totalNetAssets'), value: formatNumber(results.netAssets) },
              { label: `${t('property-division.husband')} (${results.husbandShare}%)`, value: formatNumber(results.husbandGets) },
              { label: `${t('property-division.wife')} (${results.wifeShare}%)`, value: formatNumber(results.wifeGets) },
              { label: t('property-division.legalCosts'), value: formatNumber(results.totalLegal) },
            ]}],
            footer: 'Calk.kz'
          }}
          filename="property-division"
        />
      </div>

      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <MethodologySection steps={getMethodology('property-division')} />
      <FAQSection items={[
        { question: t('property-division.faq.q1'), answer: t('property-division.faq.a1') },
        { question: t('property-division.faq.q2'), answer: t('property-division.faq.a2') },
        { question: t('property-division.faq.q3'), answer: t('property-division.faq.a3') },
        { question: t('property-division.faq.q4'), answer: t('property-division.faq.a4') },
        { question: t('property-division.faq.q5'), answer: t('property-division.faq.a5') },
      ]} 
          sources={getSources('property-division')}
        />
      <EmbedWidget calculatorId="property-division" calculatorTitle={t('property-division.title')} />
      <LastUpdated calculatorId="property-division" />
    </div>
  );
}
