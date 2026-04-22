'use client';

import Link from 'next/link';
import { useMemo } from 'react';

type ResultSheetProps = {
  diagnosis: any;
  onRestartHref?: string;
  savedAt?: string;
};

export function ResultSheet({ diagnosis, onRestartHref = '/', savedAt }: ResultSheetProps) {
  const d = diagnosis;
  const savedLabel = useMemo(
    () => (savedAt ? new Date(savedAt).toLocaleString('ko-KR') : null),
    [savedAt],
  );
  const printSummaryMetrics = useMemo(() => d.dashboard.slice(0, 3), [d.dashboard]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 print:max-w-none print:bg-white print:px-0 print:py-0">
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 14mm;
          }

          html,
          body {
            background: #ffffff !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }

          .report-print-avoid {
            break-inside: avoid;
            page-break-inside: avoid;
          }

          .report-print-break {
            break-before: page;
            page-break-before: always;
          }
        }
      `}</style>

      <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(28,25,23,0.08)] backdrop-blur sm:p-8 lg:p-10 print:rounded-none print:border-0 print:bg-white print:p-0 print:shadow-none">
        <div className="flex items-baseline justify-between gap-4 print:hidden">
          <div>
            <div className="mono text-[11px] uppercase tracking-[0.28em] text-stone-400">Result Sheet</div>
            <h1 className="mt-2 text-3xl font-bold tracking-tight">진단 결과</h1>
            <p className="mt-1 text-sm text-stone-600">원자료 기반 · 한국은행 2024 업종 평균 반영</p>
            {savedLabel && <p className="mt-1 text-xs text-stone-400">저장 시각: {savedLabel}</p>}
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => window.print()}
              className="rounded-xl border border-stone-900 px-4 py-2 text-sm font-medium text-stone-900 transition hover:bg-stone-900 hover:text-white"
            >
              PDF로 저장
            </button>
            <Link href={onRestartHref} className="mono text-xs text-stone-500 underline">
              다시 진단
            </Link>
          </div>
        </div>

        <div className="hidden print:block">
          <div className="overflow-hidden rounded-[20px] border border-stone-300 bg-white">
            <div className="border-b border-stone-300 bg-[linear-gradient(135deg,#f7f1e8_0%,#ffffff_60%,#efe5d7_100%)] px-6 py-6">
              <div className="mono text-[11px] uppercase tracking-[0.28em] text-stone-500">Founders Inbody Report</div>
              <div className="mt-3 flex items-start justify-between gap-6">
                <div>
                  <h1 className="text-[28px] font-bold tracking-tight text-stone-900">경영 진단 결과 보고서</h1>
                  <p className="mt-2 text-sm leading-relaxed text-stone-600">
                    경영지표를 바탕으로 현재 상태와 우선 액션을 정리한 대표용 요약본입니다.
                  </p>
                </div>
                <div className="min-w-[180px] rounded-2xl border border-stone-300 bg-white/90 px-4 py-3">
                  <div className="text-[11px] font-medium uppercase tracking-[0.18em] text-stone-400">진단 분류</div>
                  <div className="mt-2 text-lg font-semibold text-stone-900">{d.type}</div>
                  {savedLabel && <div className="mt-2 text-[11px] leading-relaxed text-stone-500">작성 시각 · {savedLabel}</div>}
                </div>
              </div>
            </div>

            <div className="grid gap-3 border-b border-stone-200 px-6 py-5 print:grid-cols-3">
              {printSummaryMetrics.map((metric: any) => (
                <div key={metric.label} className="rounded-[18px] border border-stone-200 bg-[#fcfaf7] px-4 py-4">
                  <div className="text-[11px] text-stone-500">{metric.label}</div>
                  <div className="mono mt-2 text-2xl font-semibold text-stone-900">{metric.value}</div>
                  {metric.note && <div className="mt-2 text-[11px] leading-relaxed text-stone-500">{metric.note}</div>}
                </div>
              ))}
            </div>

            <div className="px-6 py-5">
              <div className="rounded-[18px] border border-stone-900 bg-stone-900 px-5 py-5 text-white">
                <div className="mono text-[11px] uppercase tracking-[0.18em] text-stone-400">Executive Summary</div>
                <p className="mt-3 text-base leading-relaxed">{d.headline.asIs}</p>
                <p className="mt-3 text-sm leading-relaxed text-stone-200">{d.headline.toBe}</p>
              </div>
            </div>
          </div>
        </div>

        <Section num="01" title="경영지표" className="report-print-avoid print:mt-8">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5 print:grid-cols-2 print:gap-3">
            {d.dashboard.map((m: any, i: number) => (
              <div
                key={i}
                className={`${i === 0 ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-[#fffdf9] text-stone-900'} report-print-avoid rounded-[1.6rem] border p-5 shadow-sm print:rounded-[18px] print:p-4 print:shadow-none`}
              >
                <div className={`${i === 0 ? 'text-stone-300' : 'text-stone-500'} text-xs`}>{m.label}</div>
                <div className="mono mt-3 text-2xl font-semibold">{m.value}</div>
                {m.note && <div className={`${i === 0 ? 'text-stone-300' : 'text-stone-500'} mt-3 text-[11px] leading-relaxed`}>{m.note}</div>}
              </div>
            ))}
          </div>
        </Section>

        <Section num="02" title="경영지표 해석" className="report-print-avoid">
          <div className="rounded-[1.8rem] border border-stone-900 bg-stone-900 p-6 text-white shadow-[0_24px_60px_rgba(28,25,23,0.18)] print:rounded-[18px] print:p-5 print:shadow-none">
            <div className="mono text-xs text-stone-400">{d.type}</div>
            <p className="mt-3 text-lg leading-relaxed">{d.headline.asIs}</p>
            <p className="mt-3 text-base leading-relaxed text-stone-200">→ {d.headline.toBe}</p>
            {d.headline.context && (
              <div className="mt-5 border-t border-stone-700 pt-4 text-xs leading-relaxed text-stone-400">
                참고. {d.headline.context}
              </div>
            )}
          </div>
        </Section>

        <Section num="03" title="이번 달 집중 지표" className="report-print-avoid">
          <div className="rounded-[1.6rem] border border-stone-200 bg-[#fffdf9] p-6 print:rounded-[18px] print:p-5 print:shadow-none">
            <div className="text-xs text-stone-500">{d.mainLever.name}</div>
            <div className="mono mt-2 text-4xl font-semibold">{d.mainLever.value}</div>
            <div className="mt-3 text-xs leading-relaxed text-stone-500">{d.mainLever.benchmark}</div>
            {d.mainLever.benchmarkNote && (
              <div className="mt-3 rounded-2xl bg-stone-50 p-4 text-xs leading-relaxed text-stone-600 print:border print:border-stone-200 print:bg-white">
                💡 {d.mainLever.benchmarkNote}
              </div>
            )}
          </div>
        </Section>

        <Section num="04" title="행동 전략 3가지" className="report-print-break print:mt-0">
          <div className="space-y-4">
            {d.actions.map((ac: any, i: number) => (
              <ActionCardView key={i} card={ac} idx={i + 1} />
            ))}
          </div>
        </Section>

        <Section num="05" title="잉여금·현금 운용 우선순위" className="report-print-avoid">
          <div className="rounded-[1.6rem] border border-stone-200 bg-[#fffdf9] p-6 print:rounded-[18px] print:p-5 print:shadow-none">
            <div className="text-sm font-medium">{d.cashAdvice.stage}</div>
            <div className="mt-4">
              <div className="text-xs font-medium text-stone-500">먼저 하실 것</div>
              <ol className="mt-2 space-y-2">
                {d.cashAdvice.priorities.map((p: string, i: number) => (
                  <li key={i} className="flex gap-3 text-sm leading-relaxed">
                    <span className="mono text-stone-400">{i + 1}.</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ol>
            </div>
            <div className="mt-5 border-t border-stone-100 pt-4">
              <div className="text-xs font-medium text-stone-500">이 단계에서 피하실 것</div>
              <ul className="mt-2 space-y-1.5">
                {d.cashAdvice.avoid.map((x: string, i: number) => (
                  <li key={i} className="text-sm text-stone-600">✕ {x}</li>
                ))}
              </ul>
            </div>
          </div>
        </Section>

        <Section num="06" title="왜 이 숫자를 보나" className="report-print-break print:mt-0">
          <div className="grid gap-4 md:grid-cols-2 print:grid-cols-2 print:gap-3">
            {d.metricGuide.map((item: any) => (
              <div key={item.title} className="report-print-avoid rounded-[1.5rem] border border-stone-200 bg-[#fffdf9] p-5 shadow-sm print:rounded-[18px] print:p-4 print:shadow-none">
                <h4 className="text-sm font-semibold text-stone-900">{item.title}</h4>
                <p className="mt-3 text-sm leading-relaxed text-stone-600">{item.body}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section num="" title="" hideTitle className="report-print-avoid">
          <div className="mt-4 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-5 print:rounded-[18px] print:border-stone-300 print:bg-[#faf8f5]">
            <div className="mono text-xs text-stone-500">참고 출처</div>
            <p className="mt-2 text-xs leading-relaxed text-stone-600">
              · 업종 평균 영업이익률: <strong>{d.sources}</strong><br />
              · 인건비 추정: 통계청 KOSIS 임금근로자 평균 + 4대보험·복리후생 가산
            </p>
          </div>
        </Section>
      </div>
    </div>
  );
}

function Section({ num, title, children, hideTitle, className }: {
  num: string; title: string; children: React.ReactNode; hideTitle?: boolean; className?: string;
}) {
  return (
    <section className={`mt-10 ${className ?? ''}`}>
      {!hideTitle && (
        <div className="flex items-baseline gap-3 border-b border-stone-200 pb-2 print:border-stone-300">
          <span className="mono text-xs text-stone-400">{num}</span>
          <h3 className="text-sm font-medium tracking-wide text-stone-700">{title}</h3>
        </div>
      )}
      <div className={hideTitle ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

function ActionCardView({ card, idx }: { card: any; idx: number }) {
  return (
    <div className="report-print-avoid rounded-[1.6rem] border border-stone-200 bg-[#fffdf9] p-5 shadow-sm print:rounded-[18px] print:border-stone-300 print:p-4 print:shadow-none">
      <div className="flex items-baseline gap-3">
        <span className="mono text-xs text-stone-400">{String(idx).padStart(2, '0')}</span>
        <h4 className="text-base font-medium leading-snug">{card.title}</h4>
      </div>
      <div className="mt-4 space-y-3">
        <div>
          <div className="mono text-[10px] uppercase tracking-wider text-stone-400">Data</div>
          <p className="mt-1 text-sm leading-relaxed text-stone-700">{card.fact}</p>
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-wider text-stone-400">Why</div>
          <p className="mt-1 text-sm leading-relaxed text-stone-700">{card.insight}</p>
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-wider text-stone-400">Action</div>
          <p className="mt-1 text-sm leading-relaxed text-stone-700">{card.action}</p>
        </div>
        <div>
          <div className="mono text-[10px] uppercase tracking-wider text-stone-400">Checklist</div>
          <ul className="mt-2 space-y-1">
            {card.checklist.map((c: string, i: number) => (
              <li key={i} className="flex items-start gap-2 text-sm text-stone-700">
                <span className="mt-1 h-3 w-3 flex-shrink-0 rounded border border-stone-300"></span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
