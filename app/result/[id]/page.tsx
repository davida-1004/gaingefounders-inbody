'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { ResultSheet } from '../../../components/result-sheet';
import { getSavedResult } from '../../../lib/result-storage';

export default function SavedResultPage() {
  const params = useParams<{ id: string }>();
  const result = useMemo(() => getSavedResult(params.id), [params.id]);

  if (!result) {
    return (
      <div className="mx-auto max-w-2xl px-6 py-16">
        <h1 className="text-2xl font-semibold text-stone-900">저장된 결과를 찾지 못했습니다.</h1>
        <p className="mt-3 text-sm leading-relaxed text-stone-600">
          현재 다시보기는 이 브라우저에 저장된 결과만 불러옵니다. 다른 기기나 브라우저에서 열었다면 결과가 보이지 않을 수 있습니다.
        </p>
        <Link href="/" className="mt-6 inline-block rounded-xl border border-stone-900 px-4 py-3 text-sm font-medium text-stone-900">
          새로 진단하기
        </Link>
      </div>
    );
  }

  return <ResultSheet diagnosis={result.diagnosis} savedAt={result.createdAt} />;
}
