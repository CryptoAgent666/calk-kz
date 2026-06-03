import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, Home } from 'lucide-react';
import LocalizedLink from './LocalizedLink';

interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const { t } = useTranslation('common');

  return (
    <nav aria-label="Breadcrumb" className="mb-6">
      <ol className="flex flex-wrap items-center space-x-2 text-sm">
        <li className="flex items-center">
          <LocalizedLink
            to="/"
            className="flex items-center text-gray-500 hover:text-blue-600 transition-colors"
            aria-label={t('navigation.homePage')}
          >
            <Home className="w-4 h-4" />
          </LocalizedLink>
        </li>

        {items.map((item, index) => (
          <li key={index} className="flex items-center space-x-2">
            <ChevronRight className="w-4 h-4 text-gray-400" />
            {item.path && index < items.length - 1 ? (
              <LocalizedLink
                to={item.path}
                className="text-gray-500 hover:text-blue-600 transition-colors"
              >
                {item.label}
              </LocalizedLink>
            ) : (
              <span className="text-gray-900 font-medium" aria-current="page">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
