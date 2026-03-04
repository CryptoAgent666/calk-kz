import React from 'react';
import { useParams } from 'react-router-dom';
import LegalPages from './LegalPages';

interface LegalPageProps {
  onBackClick: () => void;
}

export default function LegalPage({ onBackClick }: LegalPageProps) {
  const { pageId } = useParams<{ pageId: string }>();

  if (!pageId) {
    return <div>Страница не найдена</div>;
  }

  return (
    <LegalPages
      pageId={pageId}
      onBackClick={onBackClick}
    />
  );
}