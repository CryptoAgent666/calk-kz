import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Search, BadgePercent, Car, Info, Scale } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

const MRP_2026 = 4_325;

interface Violation {
  id: string;
  labelKey: string;
  articleRef: string;
  firstMRP: number;
  repeatMRP: number | null;
  note?: string;
}

const violations: Violation[] = [
  { id: 'speed10_20', labelKey: 'traffic-fines.v.speed10_20', articleRef: '592 ч.1', firstMRP: 5, repeatMRP: 10 },
  { id: 'speed20_40', labelKey: 'traffic-fines.v.speed20_40', articleRef: '592 ч.2', firstMRP: 10, repeatMRP: 20 },
  { id: 'speed40plus', labelKey: 'traffic-fines.v.speed40plus', articleRef: '592 ч.3', firstMRP: 20, repeatMRP: null, note: 'traffic-fines.noteLicense' },
  { id: 'redLight', labelKey: 'traffic-fines.v.redLight', articleRef: '596', firstMRP: 10, repeatMRP: 20 },
  { id: 'seatbelt', labelKey: 'traffic-fines.v.seatbelt', articleRef: '593 ч.1', firstMRP: 5, repeatMRP: 10 },
  { id: 'phone', labelKey: 'traffic-fines.v.phone', articleRef: '593 ч.2', firstMRP: 5, repeatMRP: 10 },
  { id: 'dui', labelKey: 'traffic-fines.v.dui', articleRef: '608 ч.1', firstMRP: 40, repeatMRP: null, note: 'traffic-fines.noteLicenseArrest' },
  { id: 'parking', labelKey: 'traffic-fines.v.parking', articleRef: '597 ч.1', firstMRP: 5, repeatMRP: 10 },
  { id: 'pedestrian', labelKey: 'traffic-fines.v.pedestrian', articleRef: '600', firstMRP: 10, repeatMRP: 15 },
  { id: 'oncoming', labelKey: 'traffic-fines.v.oncoming', articleRef: '596 ч.3', firstMRP: 10, repeatMRP: null, note: 'traffic-fines.noteLicense' },
  { id: 'tint', labelKey: 'traffic-fines.v.tint', articleRef: '590 ч.3', firstMRP: 10, repeatMRP: 15 },
  { id: 'noInsurance', labelKey: 'traffic-fines.v.noInsurance', articleRef: '611', firstMRP: 10, repeatMRP: 20 },
  { id: 'childSeat', labelKey: 'traffic-fines.v.childSeat', articleRef: '593 ч.3', firstMRP: 10, repeatMRP: 20 },
  { id: 'noPlates', labelKey: 'traffic-fines.v.noPlates', articleRef: '590 ч.4', firstMRP: 10, repeatMRP: 20 },
];

export default function TrafficFinesCalculator() {
  const { t } = useTranslation('calculators');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedViolation, setSelectedViolation] = useState<string | null>('speed10_20');
  const [isRepeat, setIsRepeat] = useState(false);

  const filteredViolations = useMemo(() => {
    if (!searchQuery.trim()) return violations;
    const q = searchQuery.toLowerCase();
    return violations.filter((v) =>
      t(v.labelKey).toLowerCase().includes(q) || v.articleRef.toLowerCase().includes(q)
    );
  }, [searchQuery, t]);

  const selected = violations.find((v) => v.id === selectedViolation);

  const fineInMRP = useMemo(() => {
    if (!selected) return 0;
    if (isRepeat && selected.repeatMRP !== null) return selected.repeatMRP;
    return selected.firstMRP;
  }, [selected, isRepeat]);

  const fineAmount = fineInMRP * MRP_2026;
  const discountedAmount = Math.round(fineAmount * 0.5);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    if (!selected) return null;
    return {
      title: t('traffic-fines.exportTitle'),
      sections: [
        {
          title: t('traffic-fines.parameters'),
          data: [
            { label: t('traffic-fines.violation'), value: t(selected.labelKey) },
            { label: t('traffic-fines.article'), value: selected.articleRef },
            { label: t('traffic-fines.repeatOffense'), value: isRepeat ? t('common.yes') : t('common.no') },
          ],
        },
        {
          title: t('traffic-fines.resultsTitle'),
          data: [
            { label: t('traffic-fines.fineInMRP'), value: `${fineInMRP} МРП` },
            { label: t('traffic-fines.fullAmount'), value: formatCurrency(fineAmount) },
            { label: t('traffic-fines.discountAmount'), value: formatCurrency(discountedAmount) },
          ],
        },
      ],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="traffic-fines" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('traffic-fines.heading')}</h1>
            <p className="text-gray-600">{t('traffic-fines.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="mb-6 rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-start space-x-2">
          <BadgePercent className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
          <p className="text-green-800 text-sm">{t('traffic-fines.discountBanner')}</p>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: selection */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Car className="w-5 h-5 inline mr-2" />
            {t('traffic-fines.selectViolation')}
          </h2>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('traffic-fines.searchPlaceholder')}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-colors"
            />
          </div>

          {/* Violation list */}
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredViolations.map((v) => (
              <button
                key={v.id}
                onClick={() => setSelectedViolation(v.id)}
                className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                  selectedViolation === v.id
                    ? 'border-red-500 bg-red-50 text-red-900'
                    : 'border-gray-100 hover:border-gray-200 text-gray-700'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="text-sm font-medium">{t(v.labelKey)}</span>
                  <span className="text-xs text-gray-500 ml-2 flex-shrink-0">ст. {v.articleRef}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {v.firstMRP} МРП{v.repeatMRP !== null && ` / ${v.repeatMRP} МРП`}
                </div>
              </button>
            ))}
            {filteredViolations.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">{t('traffic-fines.noResults')}</p>
            )}
          </div>

          {/* Repeat toggle */}
          <div className="mt-4 pt-4 border-t border-gray-100">
            <label className="flex items-center space-x-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isRepeat}
                onChange={(e) => setIsRepeat(e.target.checked)}
                className="w-5 h-5 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm text-gray-700">{t('traffic-fines.repeatOffense')}</span>
            </label>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Scale className="w-5 h-5 inline mr-2" />
            {t('traffic-fines.resultsTitle')}
          </h2>

          {selected ? (
            <div className="space-y-6">
              {/* Selected violation */}
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-1">{t('traffic-fines.violation')}</div>
                <div className="font-semibold text-gray-900">{t(selected.labelKey)}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {t('traffic-fines.article')} {selected.articleRef} {t('traffic-fines.koapRK')}
                </div>
              </div>

              {/* Fine in MRP */}
              <div className="bg-orange-50 rounded-lg p-4 flex justify-between items-center">
                <div>
                  <div className="text-sm text-orange-600">{t('traffic-fines.fineInMRP')}</div>
                  <div className="text-xs text-orange-500">1 МРП = {formatCurrency(MRP_2026)}</div>
                </div>
                <span className="text-2xl font-bold text-orange-700">{fineInMRP} МРП</span>
              </div>

              {/* Full amount */}
              <div className="bg-red-50 rounded-lg p-6">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold text-gray-900">{t('traffic-fines.fullAmount')}</span>
                  <span className="text-2xl font-bold text-red-700">{formatCurrency(fineAmount)}</span>
                </div>
                {isRepeat && selected.repeatMRP === null && (
                  <div className="mt-2 text-sm text-red-600">
                    {selected.note && t(selected.note)}
                  </div>
                )}
                {!isRepeat && selected.note && (
                  <div className="mt-2 text-sm text-red-600">{t(selected.note)}</div>
                )}
              </div>

              {/* Discount */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6 border border-green-200">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-lg font-semibold text-green-900">{t('traffic-fines.discountAmount')}</span>
                    <div className="text-xs text-green-600">{t('traffic-fines.discountCondition')}</div>
                  </div>
                  <div className="text-right">
                    <span className="text-2xl font-bold text-green-700">{formatCurrency(discountedAmount)}</span>
                    <div className="text-xs text-green-600">-50%</div>
                  </div>
                </div>
              </div>

              {/* Savings */}
              <div className="bg-blue-50 rounded-lg p-4 flex justify-between items-center">
                <span className="text-sm text-blue-700">{t('traffic-fines.savings')}</span>
                <span className="text-lg font-bold text-blue-700">{formatCurrency(fineAmount - discountedAmount)}</span>
              </div>

              {/* Note */}
              {selected.note && (isRepeat ? selected.repeatMRP === null : true) && (
                <div className="bg-amber-50 rounded-lg p-4 text-sm text-amber-800 border border-amber-200">
                  <AlertTriangle className="w-4 h-4 inline mr-1" />
                  {t(selected.note)}
                </div>
              )}

              {/* Info */}
              <div className="bg-gray-50 rounded-lg p-4 text-sm text-gray-600">
                <Info className="w-4 h-4 inline mr-1" />
                {t('traffic-fines.infoNote')}
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500 py-12">
              {t('traffic-fines.selectPrompt')}
            </div>
          )}
        </div>
      </div>

      {/* Reference table */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('traffic-fines.referenceTable')}</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2 text-gray-600">{t('traffic-fines.violation')}</th>
                <th className="text-left py-3 px-2 text-gray-600">{t('traffic-fines.article')}</th>
                <th className="text-right py-3 px-2 text-gray-600">{t('traffic-fines.firstTime')}</th>
                <th className="text-right py-3 px-2 text-gray-600">{t('traffic-fines.repeat')}</th>
                <th className="text-right py-3 px-2 text-gray-600">{t('traffic-fines.firstTimeTenge')}</th>
              </tr>
            </thead>
            <tbody>
              {violations.map((v) => (
                <tr
                  key={v.id}
                  className={`border-b border-gray-50 cursor-pointer hover:bg-gray-50 ${
                    selectedViolation === v.id ? 'bg-red-50' : ''
                  }`}
                  onClick={() => setSelectedViolation(v.id)}
                >
                  <td className="py-2 px-2">{t(v.labelKey)}</td>
                  <td className="py-2 px-2 text-gray-500">ст. {v.articleRef}</td>
                  <td className="py-2 px-2 text-right font-medium">{v.firstMRP} МРП</td>
                  <td className="py-2 px-2 text-right font-medium">
                    {v.repeatMRP !== null ? `${v.repeatMRP} МРП` : '—'}
                  </td>
                  <td className="py-2 px-2 text-right text-gray-600">{formatCurrency(v.firstMRP * MRP_2026)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('traffic-fines.faq.q1'), answer: t('traffic-fines.faq.a1') },
          { question: t('traffic-fines.faq.q2'), answer: t('traffic-fines.faq.a2') },
          { question: t('traffic-fines.faq.q3'), answer: t('traffic-fines.faq.a3') },
          { question: t('traffic-fines.faq.q4'), answer: t('traffic-fines.faq.a4') },
          { question: t('traffic-fines.faq.q5'), answer: t('traffic-fines.faq.a5') },
        ]}
      
          sources={getSources('traffic-fines')}
        />

      <LegalDisclaimer type="legal" />
      <ExpertBlock />
      <EmbedWidget calculatorId="traffic-fines" calculatorTitle={t('traffic-fines.heading')} />
      <LastUpdated calculatorId="traffic-fines" />
    </div>
  );
}
