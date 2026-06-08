import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Receipt, Info, AlertTriangle, TrendingUp, FileText, CheckCircle, ShieldCheck, XCircle } from 'lucide-react';
import { FAQSection, MethodologySection } from '../ui/FAQSection';
import { getMethodology } from '../../data/calculatorMethodology';
import { CalculatorExamples } from '../ui/CalculatorExamples';
import { EmbedWidget } from '../ui/EmbedWidget';
import { ExpertBlock } from '../ui/ExpertBlock';
import { LegalDisclaimer } from '../ui/LegalDisclaimer';
import { LastUpdated } from '../ui/LastUpdated';
import { RangeSlider } from '../ui/RangeSlider';
import { ExportButtons } from '../ui/ExportButtons';
import { TaxPieChart } from '../ui/ChartComponents';
import { QuickAnswer } from '../ui/QuickAnswer';

type SocialCategory = 'none' | 'group3' | 'group12';

export default function TaxDeductionsCalculator() {
  const { t } = useTranslation('calculators');

  const [monthlyIncome, setMonthlyIncome] = useState<number>(500000);
  const [socialCategory, setSocialCategory] = useState<SocialCategory>('none');
  const [applyBaseDeduction, setApplyBaseDeduction] = useState<boolean>(true);

  const [results, setResults] = useState({
    opv: 0,
    vosms: 0,
    baseDeduction: 0,
    socialDeduction: 0,
    totalDeductions: 0,
    taxableBase: 0,
    ipn: 0,
    net: 0,
    ipnNoDeductions: 0,
    savings: 0,
    effectiveRate: 0,
  });

  // Параметры 2026 (НК РК K2500000214)
  const MRP = 4325;
  const MZP = 85000;
  const OPV_RATE = 0.10;
  const VOSMS_RATE = 0.02;
  const OPV_MAX_BASE = 50 * MZP; // 4 250 000 ₸/мес
  const VOSMS_MAX_BASE = 20 * MZP; // 1 700 000 ₸/мес
  const BASE_DEDUCTION = 30 * MRP; // 129 750 ₸/мес (ст. 403)
  const BASE_DEDUCTION_ANNUAL = 360 * MRP; // 1 557 000 ₸/год
  const GROUP3_ANNUAL = 882 * MRP; // 3 814 650 ₸/год (ст. 404)
  const GROUP12_ANNUAL = 5000 * MRP; // 21 625 000 ₸/год (ст. 404)
  const IPN_RATE_BASE = 0.10;
  const IPN_RATE_HIGH = 0.15;
  const IPN_ANNUAL_THRESHOLD = 8500 * MRP; // 36 762 500 ₸/год
  const IPN_MONTHLY_THRESHOLD = IPN_ANNUAL_THRESHOLD / 12; // ~3 063 542 ₸/мес

  const calcIPN = (base: number) => {
    if (base <= 0) return 0;
    if (base <= IPN_MONTHLY_THRESHOLD) return base * IPN_RATE_BASE;
    return IPN_MONTHLY_THRESHOLD * IPN_RATE_BASE + (base - IPN_MONTHLY_THRESHOLD) * IPN_RATE_HIGH;
  };

  const socialDeductionAnnual =
    socialCategory === 'group3' ? GROUP3_ANNUAL : socialCategory === 'group12' ? GROUP12_ANNUAL : 0;

  useEffect(() => {
    const income = monthlyIncome > 0 ? monthlyIncome : 0;

    const opv = OPV_RATE * Math.min(income, OPV_MAX_BASE);
    const vosms = VOSMS_RATE * Math.min(income, VOSMS_MAX_BASE);
    const baseDeduction = applyBaseDeduction ? BASE_DEDUCTION : 0;
    const socialDeduction = socialDeductionAnnual / 12;

    const taxableBase = Math.max(0, income - opv - vosms - baseDeduction - socialDeduction);
    const ipn = calcIPN(taxableBase);
    const net = income - opv - vosms - ipn;

    const baseNoDeductions = Math.max(0, income - opv - vosms);
    const ipnNoDeductions = calcIPN(baseNoDeductions);
    const savings = Math.max(0, ipnNoDeductions - ipn);

    const effectiveRate = income > 0 ? (ipn / income) * 100 : 0;

    setResults({
      opv: Math.round(opv),
      vosms: Math.round(vosms),
      baseDeduction: Math.round(baseDeduction),
      socialDeduction: Math.round(socialDeduction),
      totalDeductions: Math.round(baseDeduction + socialDeduction),
      taxableBase: Math.round(taxableBase),
      ipn: Math.round(ipn),
      net: Math.round(net),
      ipnNoDeductions: Math.round(ipnNoDeductions),
      savings: Math.round(savings),
      effectiveRate: Number(effectiveRate.toFixed(2)),
    });
  }, [monthlyIncome, socialCategory, applyBaseDeduction]);

  const formatNumber = (num: number) => num.toLocaleString('ru-KZ') + ' ₸';
  const formatPercent = (num: number) => num.toFixed(2) + '%';

  const cancelledDeductions: string[] = [
    t('tax-deductions.cancelled.item1'),
    t('tax-deductions.cancelled.item2'),
    t('tax-deductions.cancelled.item3'),
    t('tax-deductions.cancelled.item4'),
    t('tax-deductions.cancelled.item5'),
  ];

  const pieChartData = [
    { name: t('tax-deductions.chart.opv'), value: results.opv, color: '#f97316' },
    { name: t('tax-deductions.chart.vosms'), value: results.vosms, color: '#eab308' },
    { name: t('tax-deductions.chart.ipn'), value: results.ipn, color: '#ef4444' },
    { name: t('tax-deductions.chart.net'), value: results.net, color: '#22c55e' },
  ].filter((item) => item.value > 0);

  return (
    <div className="max-w-6xl mx-auto">
      <QuickAnswer calculatorId="tax-deductions" />
      <div className="mb-8">
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg flex items-center justify-center">
            <Receipt className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('tax-deductions.title')}</h1>
            <p className="text-gray-600">{t('tax-deductions.subtitle')}</p>
          </div>
        </div>
      </div>

      {/* Дисклеймер: что отменено с 2026 */}
      <div className="mb-8 bg-red-50 border border-red-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h2 className="text-lg font-semibold text-red-900 mb-2">
              {t('tax-deductions.cancelled.title')}
            </h2>
            <p className="text-red-800 mb-3 text-sm">{t('tax-deductions.cancelled.intro')}</p>
            <ul className="space-y-1">
              {cancelledDeductions.map((item, i) => (
                <li key={i} className="flex items-start space-x-2 text-sm text-red-800">
                  <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-red-700 mt-3">{t('tax-deductions.cancelled.note')}</p>
          </div>
        </div>
      </div>

      <div className="mb-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <div className="flex items-start space-x-3">
          <Info className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-blue-900 mb-2">
              {t('tax-deductions.importantInfo.title')}
            </h3>
            <div className="text-blue-800 space-y-2 text-sm">
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.importantInfo.description1') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.importantInfo.description2') }} />
            </div>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Ввод */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.inputSection.title')}</h2>

          <div className="space-y-6">
            <div>
              <RangeSlider
                value={monthlyIncome}
                onChange={setMonthlyIncome}
                min={85000}
                max={5000000}
                step={5000}
                label={t('tax-deductions.inputSection.monthlyIncome.label')}
                formatValue={(v) => `${v.toLocaleString('ru-KZ')} ₸`}
                color="#3b82f6"
              />
              <div className="relative mt-3">
                <input
                  type="number"
                  value={monthlyIncome}
                  onChange={(e) => setMonthlyIncome(Number(e.target.value) || 0)}
                  placeholder={t('tax-deductions.inputSection.monthlyIncome.placeholder')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 text-sm">₸</span>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.monthlyIncome.hint')}
              </p>
            </div>

            <div>
              <label htmlFor="socialCategory" className="block text-sm font-medium text-gray-700 mb-2">
                {t('tax-deductions.inputSection.socialCategory.label')}
              </label>
              <select
                id="socialCategory"
                value={socialCategory}
                onChange={(e) => setSocialCategory(e.target.value as SocialCategory)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors bg-white"
              >
                <option value="none">{t('tax-deductions.inputSection.socialCategory.none')}</option>
                <option value="group3">{t('tax-deductions.inputSection.socialCategory.group3')}</option>
                <option value="group12">{t('tax-deductions.inputSection.socialCategory.group12')}</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                {t('tax-deductions.inputSection.socialCategory.hint')}
              </p>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                id="applyBaseDeduction"
                checked={applyBaseDeduction}
                onChange={(e) => setApplyBaseDeduction(e.target.checked)}
                className="h-4 w-4 mt-0.5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="applyBaseDeduction" className="ml-2 block text-sm text-gray-700">
                {t('tax-deductions.inputSection.applyBaseDeduction.label')}
                <span className="block text-xs text-gray-500">
                  {t('tax-deductions.inputSection.applyBaseDeduction.hint')}
                </span>
              </label>
            </div>

            <div className="bg-green-50 rounded-lg p-4">
              <h3 className="text-sm font-medium text-green-900 mb-2">{t('tax-deductions.rates.title')}</h3>
              <div className="text-xs text-green-800 space-y-1">
                <div>• {t('tax-deductions.rates.base')}: {formatNumber(BASE_DEDUCTION)} ({t('tax-deductions.perMonth')})</div>
                <div>• {t('tax-deductions.rates.baseAnnual')}: {formatNumber(BASE_DEDUCTION_ANNUAL)}</div>
                <div>• {t('tax-deductions.rates.group3')}: {formatNumber(GROUP3_ANNUAL)} ({t('tax-deductions.perYear')})</div>
                <div>• {t('tax-deductions.rates.group12')}: {formatNumber(GROUP12_ANNUAL)} ({t('tax-deductions.perYear')})</div>
                <div>• {t('tax-deductions.rates.ipn')}</div>
                <div>• {t('tax-deductions.rates.mrp')}: {formatNumber(MRP)}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Результаты */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.results.title')}</h2>

          {monthlyIncome > 0 ? (
            <div className="space-y-6">
              {/* Положенные вычеты */}
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-3">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  <h3 className="font-semibold text-blue-900">{t('tax-deductions.results.allowedDeductions')}</h3>
                </div>
                <div className="space-y-2 text-sm">
                  {applyBaseDeduction && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('tax-deductions.results.baseDeduction')}</span>
                      <span className="font-medium text-gray-900">
                        {formatNumber(BASE_DEDUCTION)} / {t('tax-deductions.perMonth')}
                      </span>
                    </div>
                  )}
                  {applyBaseDeduction && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('tax-deductions.results.baseDeductionAnnual')}</span>
                      <span className="font-medium text-gray-900">{formatNumber(BASE_DEDUCTION_ANNUAL)}</span>
                    </div>
                  )}
                  {socialDeductionAnnual > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('tax-deductions.results.socialDeductionAnnual')}</span>
                      <span className="font-medium text-green-700">{formatNumber(socialDeductionAnnual)}</span>
                    </div>
                  )}
                  {!applyBaseDeduction && socialDeductionAnnual === 0 && (
                    <div className="text-gray-500">{t('tax-deductions.results.noDeductionsSelected')}</div>
                  )}
                </div>
              </div>

              {/* Экономия на ИПН */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-lg font-semibold text-gray-900">{t('tax-deductions.results.savings')}</span>
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="w-6 h-6 text-green-600" />
                    <span className="text-2xl font-bold text-green-700">{formatNumber(results.savings)}</span>
                  </div>
                </div>
                <div className="text-sm text-gray-600">{t('tax-deductions.results.savingsHint')}</div>
              </div>

              {/* Разбивка зарплаты */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-semibold text-gray-900 mb-3">{t('tax-deductions.results.breakdown.title')}</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.breakdown.gross')}</span>
                    <span className="font-medium">{formatNumber(monthlyIncome)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.breakdown.opv')}</span>
                    <span className="font-medium text-orange-600">−{formatNumber(results.opv)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.breakdown.vosms')}</span>
                    <span className="font-medium text-yellow-600">−{formatNumber(results.vosms)}</span>
                  </div>
                  {results.baseDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('tax-deductions.results.breakdown.baseDeduction')}</span>
                      <span className="font-medium text-green-600">−{formatNumber(results.baseDeduction)}</span>
                    </div>
                  )}
                  {results.socialDeduction > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">{t('tax-deductions.results.breakdown.socialDeduction')}</span>
                      <span className="font-medium text-green-600">−{formatNumber(results.socialDeduction)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t border-gray-200">
                    <span className="text-gray-600">{t('tax-deductions.results.breakdown.taxableBase')}</span>
                    <span className="font-medium">{formatNumber(results.taxableBase)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">{t('tax-deductions.results.breakdown.ipn')}</span>
                    <span className="font-medium text-red-600">−{formatNumber(results.ipn)}</span>
                  </div>
                  <div className="flex justify-between py-2 border-t border-gray-300">
                    <span className="font-semibold text-gray-900">{t('tax-deductions.results.breakdown.net')}</span>
                    <span className="font-bold text-green-700">{formatNumber(results.net)}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-gray-700 mb-1">{t('tax-deductions.results.effectiveRate')}</h3>
                  <div className="text-xl font-bold text-gray-900">{formatPercent(results.effectiveRate)}</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                  <h3 className="text-sm font-medium text-blue-700 mb-1">{t('tax-deductions.results.ipnNoDeductions')}</h3>
                  <div className="text-lg font-semibold text-blue-800">{formatNumber(results.ipnNoDeductions)}</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">{t('tax-deductions.results.enterData')}</div>
          )}
        </div>
      </div>

      {/* Действующие вычеты 2026 */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.activeDeductions.title')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('tax-deductions.activeDeductions.base.name')}</h3>
                <div className="text-xs text-gray-500">{formatNumber(BASE_DEDUCTION)} / {t('tax-deductions.perMonth')}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{t('tax-deductions.activeDeductions.base.description')}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('tax-deductions.activeDeductions.social.name')}</h3>
                <div className="text-xs text-gray-500">{formatNumber(GROUP3_ANNUAL)} / {formatNumber(GROUP12_ANNUAL)}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{t('tax-deductions.activeDeductions.social.description')}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('tax-deductions.activeDeductions.social402.name')}</h3>
                <div className="text-xs text-gray-500">{t('tax-deductions.activeDeductions.social402.amount')}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{t('tax-deductions.activeDeductions.social402.description')}</p>
          </div>

          <div className="border border-gray-200 rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Receipt className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{t('tax-deductions.activeDeductions.progression.name')}</h3>
                <div className="text-xs text-gray-500">{t('tax-deductions.activeDeductions.progression.amount')}</div>
              </div>
            </div>
            <p className="text-sm text-gray-600">{t('tax-deductions.activeDeductions.progression.description')}</p>
          </div>
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-blue-900 mb-1">{t('tax-deductions.generalRules.title')}</h3>
              <div className="text-blue-800 text-sm space-y-1">
                <p>• {t('tax-deductions.generalRules.rule1')}</p>
                <p>• {t('tax-deductions.generalRules.rule2')}</p>
                <p>• {t('tax-deductions.generalRules.rule3')}</p>
                <p>• {t('tax-deductions.generalRules.rule4')}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Как применить */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start space-x-3 mb-4">
          <FileText className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('tax-deductions.procedure.title')}</h3>
            <div className="grid md:grid-cols-2 gap-6 text-sm text-gray-700">
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('tax-deductions.procedure.documents.title')}</h4>
                <ul className="space-y-1 list-disc list-inside">
                  <li>{t('tax-deductions.procedure.documents.item1')}</li>
                  <li>{t('tax-deductions.procedure.documents.item2')}</li>
                  <li>{t('tax-deductions.procedure.documents.item3')}</li>
                  <li>{t('tax-deductions.procedure.documents.item4')}</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 mb-2">{t('tax-deductions.procedure.steps.title')}</h4>
                <ol className="space-y-1 list-decimal list-inside">
                  <li>{t('tax-deductions.procedure.steps.step1')}</li>
                  <li>{t('tax-deductions.procedure.steps.step2')}</li>
                  <li>{t('tax-deductions.procedure.steps.step3')}</li>
                  <li>{t('tax-deductions.procedure.steps.step4')}</li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-green-50 rounded-lg p-4 mt-4">
          <div className="flex items-start space-x-2">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-green-900 mb-1">{t('tax-deductions.practicalAdvice.title')}</h3>
              <div className="text-green-800 text-sm space-y-1">
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.practicalAdvice.tip1') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.practicalAdvice.tip2') }} />
                <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.practicalAdvice.tip3') }} />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Правовая основа */}
      <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">{t('tax-deductions.legalBasis.title')}</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-3">{t('tax-deductions.legalBasis.taxCode.title')}</h3>
            <div className="text-sm text-blue-800 space-y-1">
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.article401') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.article402') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.article403') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.article404') }} />
              <p dangerouslySetInnerHTML={{ __html: t('tax-deductions.legalBasis.taxCode.article439') }} />
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 mb-3">{t('tax-deductions.legalBasis.conditions.title')}</h3>
            <div className="text-sm text-green-800 space-y-1">
              <p>• {t('tax-deductions.legalBasis.conditions.condition1')}</p>
              <p>• {t('tax-deductions.legalBasis.conditions.condition2')}</p>
              <p>• {t('tax-deductions.legalBasis.conditions.condition3')}</p>
              <p>• {t('tax-deductions.legalBasis.conditions.condition4')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Диаграмма и экспорт */}
      {monthlyIncome > 0 && (
        <div className="mt-8 space-y-6">
          <TaxPieChart data={pieChartData} title={t('tax-deductions.chart.title')} formatValue={formatNumber} />
          <ExportButtons
            data={{
              title: t('tax-deductions.export.title'),
              subtitle: `${t('tax-deductions.export.income')}: ${formatNumber(monthlyIncome)}`,
              sections: [
                {
                  title: t('tax-deductions.export.parameters'),
                  data: [
                    { label: t('tax-deductions.export.income'), value: formatNumber(monthlyIncome) },
                    {
                      label: t('tax-deductions.export.baseDeduction'),
                      value: applyBaseDeduction ? formatNumber(BASE_DEDUCTION) : '—',
                    },
                    {
                      label: t('tax-deductions.export.socialDeduction'),
                      value: socialDeductionAnnual > 0 ? formatNumber(socialDeductionAnnual) : '—',
                    },
                  ],
                },
                {
                  title: t('tax-deductions.export.results'),
                  data: [
                    { label: t('tax-deductions.results.breakdown.opv'), value: formatNumber(results.opv) },
                    { label: t('tax-deductions.results.breakdown.vosms'), value: formatNumber(results.vosms) },
                    { label: t('tax-deductions.results.breakdown.ipn'), value: formatNumber(results.ipn) },
                    { label: t('tax-deductions.results.savings'), value: formatNumber(results.savings) },
                    { label: t('tax-deductions.results.breakdown.net'), value: formatNumber(results.net) },
                  ],
                },
              ],
              footer: 'calk.kz — Калькуляторы Казахстана',
            }}
            filename="tax-deductions-calculation"
          />
        </div>
      )}

      <CalculatorExamples calculatorId="tax-deductions" />
      <MethodologySection steps={getMethodology('tax-deductions')} />
      <FAQSection
        items={[
          { question: t('tax-deductions.faq.q1'), answer: t('tax-deductions.faq.a1') },
          { question: t('tax-deductions.faq.q2'), answer: t('tax-deductions.faq.a2') },
          { question: t('tax-deductions.faq.q3'), answer: t('tax-deductions.faq.a3') },
          { question: t('tax-deductions.faq.q4'), answer: t('tax-deductions.faq.a4') },
          { question: t('tax-deductions.faq.q5'), answer: t('tax-deductions.faq.a5') },
        ]}
        sources={[
          { title: 'Налоговый кодекс РК — ст. 401–404, 439', url: 'https://adilet.zan.kz/rus/docs/K2500000214' },
          { title: 'КГД МФ РК', url: 'https://kgd.gov.kz/' },
        ]}
      />

      <LegalDisclaimer type="tax" />
      <ExpertBlock />

      <EmbedWidget calculatorId="tax-deductions" calculatorTitle={t('tax-deductions.title')} />
      <LastUpdated calculatorId="tax-deductions" />
    </div>
  );
}
