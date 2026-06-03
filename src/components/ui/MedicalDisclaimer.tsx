import React from 'react';
import { BookOpen, ExternalLink, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface MedicalSource {
  /** Display title of the source */
  title: string;
  /** URL to the authoritative source */
  url: string;
  /** Optional short description (year, organization, formula name) */
  description?: string;
}

export interface MedicalDisclaimerProps {
  /** Calculator-specific sources (peer-reviewed papers, WHO/CDC/NIH/ACOG, etc.) */
  sources: MedicalSource[];
  /** Optional override for the disclaimer heading */
  title?: string;
  /** Optional override for the disclaimer body text */
  disclaimer?: string;
}

/**
 * Prominent, always-visible block of citations for medical/health calculators.
 *
 * Required by Apple App Store Guideline 1.4.1 (Safety - Physical Harm):
 *   "All apps with medical and health information should include citations
 *    to ensure users are provided accurate information."
 *
 * This block must be EASY for the user to find. It is rendered as a non-collapsible
 * card with a distinct heading, list of authoritative sources, and a disclaimer
 * about not replacing medical advice.
 */
export function MedicalDisclaimer({
  sources,
  title,
  disclaimer,
}: MedicalDisclaimerProps) {
  const { t } = useTranslation('common');
  const displayTitle = title || t('medicalDisclaimer.title', 'Источники медицинской информации');
  const displayDisclaimer =
    disclaimer ||
    t(
      'medicalDisclaimer.notice',
      'Данный калькулятор предоставляется в информационных целях и не заменяет консультацию квалифицированного медицинского работника. При наличии вопросов о здоровье обращайтесь к врачу.',
    );

  return (
    <div className="mt-8 print:break-inside-avoid">
      <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-2xl p-6 border-2 border-teal-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-teal-100 rounded-xl">
            <BookOpen className="w-6 h-6 text-teal-700" />
          </div>
          <h3 className="text-xl font-bold text-gray-900">{displayTitle}</h3>
        </div>

        <ul className="space-y-3 mb-5">
          {sources.map((source, index) => (
            <li
              key={index}
              className="flex items-start gap-3 bg-white p-3 rounded-lg border border-teal-100"
            >
              <div className="flex-shrink-0 w-7 h-7 bg-teal-600 text-white rounded-full flex items-center justify-center font-bold text-xs">
                {index + 1}
              </div>
              <div className="flex-1 min-w-0">
                <a
                  href={source.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-teal-700 hover:text-teal-900 hover:underline break-words"
                >
                  {source.title}
                  <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                </a>
                {source.description && (
                  <p className="text-sm text-gray-600 mt-1 leading-snug">
                    {source.description}
                  </p>
                )}
                <p className="text-xs text-gray-500 mt-1 break-all">{source.url}</p>
              </div>
            </li>
          ))}
        </ul>

        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-amber-900 leading-relaxed">{displayDisclaimer}</p>
        </div>
      </div>
    </div>
  );
}

export default MedicalDisclaimer;
