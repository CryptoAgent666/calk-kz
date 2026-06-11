import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { FileText, Calculator, AlertTriangle, CheckCircle2, XCircle, Calendar, Info, Users } from 'lucide-react';
import { FAQSection } from '../ui/FAQSection';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { ExportButtons } from '../ui/ExportButtons';
import { getSources } from '../../data/calculatorSources';
import { QuickAnswer } from '../ui/QuickAnswer';

type Status = 'civilServant' | 'quasiGov' | 'founder' | 'lawyer' | 'regular';
type ReportYear = 2024 | 2025 | 2026;

interface DeclarationResult {
  mustDeclare: boolean;
  needsForm250: boolean;
  needsForm270: boolean;
  deadlineYear: number;
  explanationKey: string;
}

export default function UniversalDeclarationCalculator() {
  const { t } = useTranslation('calculators');

  const [status, setStatus] = useState<Status>('regular');
  const [reportYear, setReportYear] = useState<ReportYear>(2025);
  const [firstDeclaration, setFirstDeclaration] = useState<boolean>(true);
  const [hasForeignProperty, setHasForeignProperty] = useState<boolean>(false);
  const [hasForeignAccounts, setHasForeignAccounts] = useState<boolean>(false);
  const [income, setIncome] = useState<string>('3600000');
  const [ipnWithheld, setIpnWithheld] = useState<boolean>(true);
  const [hasOtherIncome, setHasOtherIncome] = useState<boolean>(false);

  const [result, setResult] = useState<DeclarationResult>({
    mustDeclare: true,
    needsForm250: true,
    needsForm270: true,
    deadlineYear: 2026,
    explanationKey: 'explRegular',
  });

  const statusOptions: { id: Status; labelKey: string; explKey: string }[] = [
    { id: 'civilServant', labelKey: 'universal-declaration.statusCivilServant', explKey: 'explCivilServant' },
    { id: 'quasiGov', labelKey: 'universal-declaration.statusQuasiGov', explKey: 'explQuasiGov' },
    { id: 'founder', labelKey: 'universal-declaration.statusFounder', explKey: 'explFounder' },
    { id: 'lawyer', labelKey: 'universal-declaration.statusLawyer', explKey: 'explLawyer' },
    { id: 'regular', labelKey: 'universal-declaration.statusRegular', explKey: 'explRegular' },
  ];

  useEffect(() => {
    // Проверка обязанности подавать декларацию
    const statusStartYear: Record<Status, number> = {
      civilServant: 2021,
      quasiGov: 2023,
      founder: 2024,
      lawyer: 2025,
      regular: 2025,
    };

    const startYear = statusStartYear[status];
    const mustDeclare = reportYear >= startYear;
    const needsForm250 = mustDeclare && firstDeclaration;
    const needsForm270 = mustDeclare;
    const deadlineYear = reportYear + 1;
    const explanationKey = statusOptions.find((s) => s.id === status)?.explKey || 'explRegular';

    setResult({
      mustDeclare,
      needsForm250,
      needsForm270,
      deadlineYear,
      explanationKey,
    });
  }, [status, reportYear, firstDeclaration]);

  const formatCurrency = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';

  const generateExportData = () => {
    const statusLabel = t(statusOptions.find((s) => s.id === status)?.labelKey || '');
    const formsLabel = result.needsForm250 && result.needsForm270
      ? t('universal-declaration.bothForms')
      : result.needsForm270
      ? t('universal-declaration.only270')
      : t('universal-declaration.noForms');

    return {
      title: t('universal-declaration.exportTitle'),
      subtitle: t('universal-declaration.subtitle'),
      sections: [
        {
          title: t('universal-declaration.parameters'),
          data: [
            { label: t('universal-declaration.status'), value: statusLabel },
            { label: t('universal-declaration.reportYear'), value: reportYear },
            { label: t('universal-declaration.income'), value: formatCurrency(parseFloat(income) || 0) },
            { label: t('universal-declaration.firstDeclaration'), value: firstDeclaration ? t('universal-declaration.yes') : t('universal-declaration.no') },
          ],
        },
        {
          title: t('universal-declaration.results'),
          data: [
            { label: t('universal-declaration.mustDeclare'), value: result.mustDeclare ? t('universal-declaration.yes') : t('universal-declaration.no') },
            { label: t('universal-declaration.formsRequired'), value: formsLabel },
            { label: t('universal-declaration.deadline'), value: t('universal-declaration.deadlineValue', { year: result.deadlineYear }) },
            { label: t('universal-declaration.fine'), value: t('universal-declaration.fineValue') },
          ],
        },
      ],
      footer: 'calk.kz',
    };
  };

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="universal-declaration" />
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-lg flex items-center justify-center">
            <FileText className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('universal-declaration.heading')}</h1>
            <p className="text-gray-600">{t('universal-declaration.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Warning */}
      <div className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <p className="text-amber-800 text-sm flex items-start">
          <AlertTriangle className="w-4 h-4 mr-2 mt-0.5 flex-shrink-0" />
          {t('universal-declaration.warning')}
        </p>
      </div>

      {/* Two-column layout */}
      <div className="grid lg:grid-cols-2 gap-8">
        {/* Left: inputs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <Calculator className="w-5 h-5 inline mr-2" />
            {t('universal-declaration.parameters')}
          </h2>

          <div className="space-y-6">
            {/* Status selector */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Users className="w-4 h-4 inline mr-1" />
                {t('universal-declaration.status')}
              </label>
              <div className="space-y-2">
                {statusOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setStatus(opt.id)}
                    className={`w-full text-left px-4 py-3 rounded-lg border-2 text-sm font-medium transition-all ${
                      status === opt.id
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    {t(opt.labelKey)}
                  </button>
                ))}
              </div>
            </div>

            {/* Report year */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                <Calendar className="w-4 h-4 inline mr-1" />
                {t('universal-declaration.reportYear')}
              </label>
              <div className="flex gap-2">
                {([2024, 2025, 2026] as ReportYear[]).map((y) => (
                  <button
                    key={y}
                    onClick={() => setReportYear(y)}
                    className={`flex-1 px-4 py-2 rounded-lg border-2 text-sm font-medium transition-all ${
                      reportYear === y
                        ? 'border-amber-500 bg-amber-50 text-amber-800'
                        : 'border-gray-200 hover:border-gray-300 text-gray-600'
                    }`}
                  >
                    {y}
                  </button>
                ))}
              </div>
            </div>

            {/* Income */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('universal-declaration.income')}
              </label>
              <div className="relative">
                <input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  placeholder={t('universal-declaration.incomePlaceholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
            </div>

            {/* Checkboxes */}
            <div className="space-y-3">
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstDeclaration}
                  onChange={(e) => setFirstDeclaration(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('universal-declaration.firstDeclaration')}</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={ipnWithheld}
                  onChange={(e) => setIpnWithheld(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('universal-declaration.ipnWithheld')}</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasOtherIncome}
                  onChange={(e) => setHasOtherIncome(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('universal-declaration.hasOtherIncome')}</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasForeignProperty}
                  onChange={(e) => setHasForeignProperty(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('universal-declaration.hasForeignProperty')}</span>
              </label>
              <label className="flex items-start cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasForeignAccounts}
                  onChange={(e) => setHasForeignAccounts(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">{t('universal-declaration.hasForeignAccounts')}</span>
              </label>
            </div>

            {/* Stages info */}
            <div className="bg-amber-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-amber-900 mb-2">
                <Info className="w-4 h-4 inline mr-1" />
                {t('universal-declaration.stages')}
              </h3>
              <ul className="text-xs text-amber-800 space-y-1">
                <li>— {t('universal-declaration.stage2021')}</li>
                <li>— {t('universal-declaration.stage2023')}</li>
                <li>— {t('universal-declaration.stage2024')}</li>
                <li>— {t('universal-declaration.stage2025')}</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Right: results */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            <FileText className="w-5 h-5 inline mr-2" />
            {t('universal-declaration.results')}
          </h2>

          <div className="space-y-6">
            {/* Main verdict */}
            <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-lg p-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-lg font-semibold text-gray-900">{t('universal-declaration.mustDeclare')}</span>
                <div className="flex items-center space-x-2">
                  {result.mustDeclare ? (
                    <CheckCircle2 className="w-6 h-6 text-orange-600" />
                  ) : (
                    <XCircle className="w-6 h-6 text-gray-500" />
                  )}
                  <span className={`text-2xl font-bold ${result.mustDeclare ? 'text-orange-700' : 'text-gray-600'}`}>
                    {result.mustDeclare ? t('universal-declaration.yes') : t('universal-declaration.no')}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-700 mt-2">
                {t(`universal-declaration.${result.explanationKey}`)}
              </p>
            </div>

            {/* Forms */}
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm text-gray-600 mb-2">{t('universal-declaration.formsRequired')}</div>
              {result.mustDeclare ? (
                <div className="space-y-2">
                  {result.needsForm250 && (
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                      {t('universal-declaration.form250')}
                    </div>
                  )}
                  {result.needsForm270 && (
                    <div className="flex items-center text-sm font-medium text-gray-900">
                      <CheckCircle2 className="w-4 h-4 text-green-600 mr-2" />
                      {t('universal-declaration.form270')}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-sm font-medium text-gray-600">{t('universal-declaration.noForms')}</div>
              )}
            </div>

            {/* Deadline */}
            {result.mustDeclare && (
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-blue-600">{t('universal-declaration.deadline')}</div>
                    <div className="text-lg font-bold text-blue-800">
                      {t('universal-declaration.deadlineValue', { year: result.deadlineYear })}
                    </div>
                  </div>
                  <Calendar className="w-8 h-8 text-blue-400" />
                </div>
              </div>
            )}

            {/* Fine */}
            <div className="bg-red-50 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-red-600">{t('universal-declaration.fine')}</div>
                  <div className="text-lg font-bold text-red-800">{t('universal-declaration.fineValue')}</div>
                </div>
                <AlertTriangle className="w-8 h-8 text-red-400" />
              </div>
            </div>

            {/* Foreign note */}
            {(hasForeignProperty || hasForeignAccounts) && result.mustDeclare && (
              <div className="bg-purple-50 rounded-lg p-4 text-sm text-purple-800">
                <Info className="w-4 h-4 inline mr-1" />
                {t('universal-declaration.foreignNote')}
              </div>
            )}

            {/* Recommendation */}
            {result.mustDeclare && (
              <div className="bg-green-50 rounded-lg p-4 text-sm text-green-800">
                <CheckCircle2 className="w-4 h-4 inline mr-1" />
                {t('universal-declaration.recommendation')}
              </div>
            )}

            {/* Info block */}
            <div className="bg-gray-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-900 mb-1">
                <Info className="w-4 h-4 inline mr-1" />
                {t('universal-declaration.infoTitle')}
              </h3>
              <p className="text-xs text-gray-600">{t('universal-declaration.infoText')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div className="mt-8">
        <ExportButtons data={generateExportData()} filename={t('universal-declaration.exportFilename')} />
      </div>

      {/* FAQ */}
      <FAQSection
        items={[
          { question: t('universal-declaration.faq.q1'), answer: t('universal-declaration.faq.a1') },
          { question: t('universal-declaration.faq.q2'), answer: t('universal-declaration.faq.a2') },
          { question: t('universal-declaration.faq.q3'), answer: t('universal-declaration.faq.a3') },
          { question: t('universal-declaration.faq.q4'), answer: t('universal-declaration.faq.a4') },
          { question: t('universal-declaration.faq.q5'), answer: t('universal-declaration.faq.a5') },
        ]}
      
          sources={getSources('universal-declaration')}
        />

      {/* Expert block */}
      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      {/* Embed widget */}
      <EmbedWidget calculatorId="universal-declaration" calculatorTitle={t('universal-declaration.heading')} />
      <LastUpdated calculatorId="universal-declaration" />
    </div>
  );
}
