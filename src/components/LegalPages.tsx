import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Shield, FileText, AlertTriangle, Phone, Mail, MapPin, Globe, Calculator, CheckCircle, Info, Sparkles } from 'lucide-react';
import { generateFAQSchema } from '../utils/faqSchema';

interface LegalPagesProps {
  pageId: string;
  onBackClick: () => void;
}

export default function LegalPages({ pageId, onBackClick }: LegalPagesProps) {
  const { t, i18n } = useTranslation('legal');

  useEffect(() => {
    if (pageId === 'contact') {
      const existingFAQSchema = document.querySelector('script[data-faq-schema="true"]');
      if (existingFAQSchema) {
        existingFAQSchema.remove();
      }

      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-faq-schema', 'true');
      script.text = generateFAQSchema();
      document.head.appendChild(script);

      return () => {
        const schemaScript = document.querySelector('script[data-faq-schema="true"]');
        if (schemaScript) {
          schemaScript.remove();
        }
      };
    }
  }, [pageId]);

  const renderContent = () => {
    switch (pageId) {
      case 'about':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <Calculator className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('about.title')}</h1>
                <p className="text-gray-600">{t('about.subtitle')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('about.mission')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('about.missionText')}</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('about.whatWeOffer')}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('about.accurateCalculations')}</h3>
                        <p className="text-gray-600 text-sm">{t('about.accurateCalculationsText')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('about.dataSecurity')}</h3>
                        <p className="text-gray-600 text-sm">{t('about.dataSecurityText')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('about.freeNoRegistration')}</h3>
                        <p className="text-gray-600 text-sm">{t('about.freeNoRegistrationText')}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('about.actualInfo')}</h3>
                        <p className="text-gray-600 text-sm">{t('about.actualInfoText')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('about.convenientInterface')}</h3>
                        <p className="text-gray-600 text-sm">{t('about.convenientInterfaceText')}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start space-x-3">
                      <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                      <div>
                        <h3 className="font-semibold text-gray-900">{t('about.mobileVersion')}</h3>
                        <p className="text-gray-600 text-sm">{t('about.mobileVersionText')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('about.ourPrinciples')}</h2>
                <div className="bg-blue-50 rounded-lg p-6">
                  <div className="space-y-3 text-gray-700">
                    <p>
                      <strong>{t('about.transparency')}:</strong> {t('about.transparencyText')}
                    </p>
                    <p>
                      <strong>{t('about.relevance')}:</strong> {t('about.relevanceText')}
                    </p>
                    <p>
                      <strong>{t('about.accessibility')}:</strong> {t('about.accessibilityText')}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'contact':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <Phone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('contact.title')}</h1>
                <p className="text-gray-600">{t('contact.subtitle')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
              <div className="grid md:grid-cols-2 gap-8">
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('contact.feedback')}</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{t('contact.email')}</div>
                        <div className="text-gray-600">info@calk.kz</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <Globe className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{t('contact.website')}</div>
                        <div className="text-gray-600">www.calk.kz</div>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      <MapPin className="w-5 h-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-gray-900">{t('contact.serviceRegion')}</div>
                        <div className="text-gray-600">{t('contact.republicOfKazakhstan')}</div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 bg-blue-50 rounded-lg p-6">
                    <h3 className="font-semibold text-blue-900 mb-2">{t('contact.questionsTitle')}</h3>
                    <ul className="text-sm text-blue-800 space-y-1">
                      <li>• {t('contact.question1')}</li>
                      <li>• {t('contact.question2')}</li>
                      <li>• {t('contact.question3')}</li>
                      <li>• {t('contact.question4')}</li>
                      <li>• {t('contact.question5')}</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6">{t('contact.faq')}</h2>
                  <div className="space-y-4">
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{t('contact.faqQ1')}</h4>
                      <p className="text-gray-600 text-sm">{t('contact.faqA1')}</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{t('contact.faqQ2')}</h4>
                      <p className="text-gray-600 text-sm">{t('contact.faqA2')}</p>
                    </div>
                    
                    <div className="border border-gray-200 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-900 mb-2">{t('contact.faqQ3')}</h4>
                      <p className="text-gray-600 text-sm">{t('contact.faqA3')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'privacy':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                <Shield className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('privacy.title')}</h1>
                <p className="text-gray-600">{t('privacy.subtitle')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.generalProvisions')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacy.generalProvisionsText')}</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.dataCollection')}</h2>
                <div className="bg-green-50 rounded-lg p-6">
                  <div className="flex items-start space-x-3">
                    <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h3 className="font-semibold text-green-900 mb-2">{t('privacy.localCalculations')}</h3>
                      <p className="text-green-800">{t('privacy.localCalculationsText')}</p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6 space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">{t('privacy.whatWeCollect')}</h3>
                  <ul className="space-y-2 text-gray-700">
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>{t('privacy.technicalInfo')}:</strong> {t('privacy.technicalInfoText')}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>{t('privacy.usageStats')}:</strong> {t('privacy.usageStatsText')}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></span>
                      <span><strong>{t('privacy.localStorage')}:</strong> {t('privacy.localStorageText')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.cookies')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacy.cookiesText')}</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.dataProtection')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacy.dataProtectionText')}</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('privacy.policyChanges')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('privacy.policyChangesText')}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600">
                  <strong>{t('lastUpdated')}:</strong> {new Date().toLocaleDateString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'terms':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('terms.title')}</h1>
                <p className="text-gray-600">{t('terms.subtitle')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.acceptance')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('terms.acceptanceText')}</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.serviceDescription')}</h2>
                <p className="text-gray-700 leading-relaxed mb-4">{t('terms.serviceDescriptionText')}</p>
                <ul className="space-y-2 text-gray-700">
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{t('terms.taxCalculators')}</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{t('terms.financialTools')}</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{t('terms.socialCalculators')}</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="w-2 h-2 bg-indigo-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span>{t('terms.utilitiesConverters')}</span>
                  </li>
                </ul>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.rightsObligations')}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.yourRights')}</h3>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• {t('terms.right1')}</li>
                      <li>• {t('terms.right2')}</li>
                      <li>• {t('terms.right3')}</li>
                      <li>• {t('terms.right4')}</li>
                    </ul>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('terms.yourObligations')}</h3>
                    <ul className="space-y-1 text-gray-700 text-sm">
                      <li>• {t('terms.obligation1')}</li>
                      <li>• {t('terms.obligation2')}</li>
                      <li>• {t('terms.obligation3')}</li>
                      <li>• {t('terms.obligation4')}</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.intellectualProperty')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('terms.intellectualPropertyText')}</p>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('terms.termsChanges')}</h2>
                <p className="text-gray-700 leading-relaxed">{t('terms.termsChangesText')}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600">
                  <strong>{t('lastUpdated')}:</strong> {new Date().toLocaleDateString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'disclaimer':
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('disclaimer.title')}</h1>
                <p className="text-gray-600">{t('disclaimer.subtitle')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-xl font-semibold text-amber-900 mb-2">{t('disclaimer.importantWarning')}</h2>
                    <p className="text-amber-800">{t('disclaimer.importantWarningText')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('disclaimer.limitations')}</h2>
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('disclaimer.calculationAccuracy')}</h3>
                    <p className="text-gray-700">{t('disclaimer.calculationAccuracyText')}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('disclaimer.legislationChanges')}</h3>
                    <p className="text-gray-700">{t('disclaimer.legislationChangesText')}</p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">{t('disclaimer.individualFeatures')}</h3>
                    <p className="text-gray-700">{t('disclaimer.individualFeaturesText')}</p>
                  </div>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('disclaimer.usageRecommendations')}</h2>
                <div className="bg-blue-50 rounded-lg p-6">
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                      <span>{t('disclaimer.recommendation1')}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                      <span>{t('disclaimer.recommendation2')}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                      <span>{t('disclaimer.recommendation3')}</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-1" />
                      <span>{t('disclaimer.recommendation4')}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">{t('disclaimer.contactsForClarification')}</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('disclaimer.taxQuestions')}</h4>
                    <p className="text-gray-600 text-sm">{t('disclaimer.taxQuestionsContact')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('disclaimer.socialQuestions')}</h4>
                    <p className="text-gray-600 text-sm">{t('disclaimer.socialQuestionsContact')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('disclaimer.bankingServices')}</h4>
                    <p className="text-gray-600 text-sm">{t('disclaimer.bankingServicesContact')}</p>
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900 mb-2">{t('disclaimer.pensionQuestions')}</h4>
                    <p className="text-gray-600 text-sm">{t('disclaimer.pensionQuestionsContact')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                <div className="flex items-start space-x-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-red-900 mb-2">{t('disclaimer.disclaimerTitle')}</h3>
                    <p className="text-red-800">{t('disclaimer.disclaimerText')}</p>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 rounded-lg p-6">
                <p className="text-sm text-gray-600">
                  <strong>{t('lastUpdated')}:</strong> {new Date().toLocaleDateString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU')}
                </p>
              </div>
            </div>
          </div>
        );

      case 'updates': {
        const groups = (t('updates.groups', { returnObjects: true }) as Array<{ year: string; items: Array<{ date: string; title: string; text: string }> }>) || [];
        return (
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center space-x-3 mb-8">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-lg flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{t('updates.title')}</h1>
                <p className="text-gray-600">{t('updates.subtitle')}</p>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8 space-y-8">
              <p className="text-gray-700 leading-relaxed text-lg">{t('updates.intro')}</p>

              {Array.isArray(groups) && groups.map((group) => (
                <div key={group.year}>
                  <h2 className="text-2xl font-semibold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                    {group.year}
                  </h2>
                  <div className="space-y-6">
                    {group.items.map((item, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-emerald-500 mt-2"></div>
                        <div className="flex-1">
                          <div className="text-xs text-gray-500 mb-1 font-medium">{item.date}</div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                          <p className="text-gray-700 leading-relaxed">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              <div className="bg-gray-50 rounded-lg p-6 mt-6">
                <p className="text-sm text-gray-600">
                  <strong>{t('lastUpdated')}:</strong> {new Date().toLocaleDateString(i18n.language === 'kk' ? 'kk-KZ' : 'ru-RU')}
                </p>
              </div>
            </div>
          </div>
        );
      }

      default:
        return (
          <div className="max-w-4xl mx-auto text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('pageNotFound')}</h1>
            <p className="text-gray-600">{t('pageNotFoundDescription')}</p>
          </div>
        );
    }
  };

  return (
    <div>
      <div className="mb-8">
        <button
          onClick={onBackClick}
          className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('backToCalculators')}</span>
        </button>
      </div>

      {renderContent()}
    </div>
  );
}
