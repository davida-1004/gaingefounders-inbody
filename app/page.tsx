'use client';

import { useMemo, useState } from 'react';

/* ============================================================================
 * Founders Inbody v3 — Single-File MVP
 *
 * 적용: Next.js (App Router) + Tailwind. `app/page.tsx` 에 덮어쓰기.
 *
 * 반영된 설계:
 *  - v3 기획서: 7문항 + 카테고리별 2~3문항 = 최대 10문항
 *  - 업종 15개 (헬스케어 3분할, 의료 2분할, 부동산 2분할, 마케팅 2분할)
 *  - 매출 공식 5개 (A·B·C·D·E) + 메인 유형 4개
 *  - 벤치마크 근거: 한국은행 2024년 기업경영분석 확정판 중소기업(SME) 수치
 *  - 프레임워크 적용 패치: PQC 분해, GCS 단계, F-I-A-C 액션 카드 구조
 *  - "앱이 아는 것만 말한다" 원칙: Insight 는 계산값·일반원리·시뮬레이션만
 * ==========================================================================*/

/* ============================================================================
 *  Part 1 — 타입 정의
 * ==========================================================================*/

type Industry =
  | 'MFG_B2B' | 'MFG_B2C'
  | 'RETAIL'
  | 'IT'
  | 'MEDICAL_GENERAL' | 'MEDICAL_AESTHETIC'
  | 'BEAUTY'
  | 'HEALTH_SERVICE' | 'HEALTH_PRODUCT' | 'HEALTH_TECH'
  | 'REALESTATE_BROKERAGE' | 'REALESTATE_DEV'
  | 'MARKETING_RETAINER' | 'MARKETING_PROJECT'
  | 'SERVICE';

type RevenueSource = 'PRIVATE' | 'PUBLIC' | 'MIX' | 'GOV';
type FormulaCategory = 'A' | 'B' | 'C' | 'D' | 'E';
type ResultType = '지혈 필요형' | '지원 의존형' | '마진 취약형' | '성장 준비형';
type GcsStage = 'SURVIVE' | 'CASH' | 'GROW';

type Answers = {
  // 1차 공통 (Q1~Q7)
  industry?: Industry;
  revenueSource?: RevenueSource;
  annualRevenue?: number;
  annualOperatingProfit?: number;
  cash?: number;
  monthlyFixedCost?: number;
  headcount?: number;

  // 2차 매출 공식
  primaryFormula?: FormulaCategory;

  // A형
  activeCustomers3m?: number;
  repeatCustomers3m?: number;
  avgOrderValue?: number;
  // B형
  newLeadsLastMonth?: number;
  newPaidLastMonth?: number;
  newCustomerAOV?: number;
  // C형
  annualCustomers?: number;
  avgTicket?: number;
  // D형
  activeAccounts?: number;
  retainedAccounts?: number;
  // E형
  coreStaffCount?: number;
  capacityStatus?: 'SLACK' | 'OK' | 'OVERLOAD';
  hourlyRate?: number;

  // 매출 유형별
  govSubsidyAnnual?: number;
  nextGrant?: 'SECURED' | 'APPLIED' | 'NONE';
  nextPublicDeal?: 'SECURED' | 'PIPELINE' | 'NONE';
  paidCustomers?: number;
};

/* ============================================================================
 *  Part 2 — 업종 메타 (15개)
 * ==========================================================================*/

const INDUSTRIES: { code: Industry; label: string; emoji: string; hint?: string }[] = [
  { code: 'MFG_B2B',              label: '제조업 B2B',              emoji: '🏭', hint: '기업 대상 제조·부품·소재' },
  { code: 'MFG_B2C',              label: '제조업 B2C (식품 등)',    emoji: '🥫', hint: '소비재·식음료 제조' },
  { code: 'RETAIL',               label: '유통·도소매',             emoji: '🛒', hint: '온·오프라인 판매' },
  { code: 'IT',                   label: 'IT·SaaS',                 emoji: '💻', hint: '소프트웨어·플랫폼·앱' },
  { code: 'MEDICAL_GENERAL',      label: '의료 (일반 진료)',        emoji: '🏥', hint: '병의원·보험 진료' },
  { code: 'MEDICAL_AESTHETIC',    label: '의료 (비급여·시술)',      emoji: '💉', hint: '피부·성형·한방 비급여' },
  { code: 'BEAUTY',               label: '뷰티·라이프스타일',        emoji: '💄', hint: '화장품·뷰티 소매' },
  { code: 'HEALTH_SERVICE',       label: '헬스케어 서비스',         emoji: '🧘', hint: 'PT·요가·필라테스 등' },
  { code: 'HEALTH_PRODUCT',       label: '헬스케어 제품',           emoji: '💊', hint: '건강기능식품·보조제' },
  { code: 'HEALTH_TECH',          label: '헬스케어 테크',           emoji: '📱', hint: '디지털헬스·의료기기' },
  { code: 'REALESTATE_BROKERAGE', label: '부동산 중개·임대',        emoji: '🏠', hint: '중개·관리·임대업' },
  { code: 'REALESTATE_DEV',       label: '부동산 개발·시행',        emoji: '🏗️', hint: '시행·분양·개발' },
  { code: 'MARKETING_RETAINER',   label: '마케팅·광고 (리테이너)',  emoji: '📈', hint: '월정액 에이전시' },
  { code: 'MARKETING_PROJECT',    label: '마케팅·광고 (프로젝트)',  emoji: '🎨', hint: '건별 수주 에이전시' },
  { code: 'SERVICE',              label: '기타 서비스업',           emoji: '🛎️', hint: '위에 없는 업종' },
];

/* ============================================================================
 *  Part 3 — 한국은행 2024 벤치마크 (SME 우선)
 * ==========================================================================*/

type Benchmark = {
  operatingMargin: number;
  operatingMarginSME: number;
  label: string;
  ksicCode: string;
  note?: string;
};

const BENCHMARKS: Record<string, Benchmark> = {
  ALL:                  { operatingMargin: 4.59, operatingMarginSME: 3.03,  label: '전 산업 평균',                 ksicCode: '전체' },
  MFG_ALL:              { operatingMargin: 5.13, operatingMarginSME: 3.89,  label: '제조업',                       ksicCode: 'C10-34' },
  MFG_FOOD:             { operatingMargin: 3.82, operatingMarginSME: 2.90,  label: '식료품 제조업',                ksicCode: 'C10' },
  MFG_PHARMA:           { operatingMargin: 10.50, operatingMarginSME: 7.96, label: '의약품',                       ksicCode: 'C21' },
  MFG_MEDICAL_DEVICE:   { operatingMargin: 5.88, operatingMarginSME: 4.46,  label: '의료·정밀·광학기기',          ksicCode: 'C27' },
  RETAIL_ALL:           { operatingMargin: 2.84, operatingMarginSME: 2.48,  label: '도소매업',                     ksicCode: 'G45-47' },
  RETAIL_OFFLINE:       { operatingMargin: 2.08, operatingMarginSME: 1.82,  label: '오프라인 소매',                ksicCode: 'G47' },
  ACCOM_FOOD:           { operatingMargin: 3.96, operatingMarginSME: 2.23,  label: '숙박·음식점업',                ksicCode: 'I55-56' },
  INFO_COMM:            { operatingMargin: 4.97, operatingMarginSME: -2.32, label: '정보통신업',                   ksicCode: 'J58-63',
                          note: '국내 SW·IT 중소기업 평균이 영업적자입니다. 성장 투자 단계 회사가 많습니다.' },
  IT_SOFTWARE:          { operatingMargin: 1.75, operatingMarginSME: -5.54, label: '소프트웨어·SaaS',              ksicCode: 'J582',
                          note: '국내 SW 중소기업 평균은 영업적자입니다. 흑자라면 업계 상위권입니다.' },
  REAL_ESTATE:          { operatingMargin: 6.73, operatingMarginSME: 3.33,  label: '부동산업',                     ksicCode: 'L68',
                          note: '영업은 흑자여도 금융비용 부담으로 세전순이익은 적자인 경우가 많습니다.' },
  PROF_SCI_TECH:        { operatingMargin: 4.12, operatingMarginSME: 3.76,  label: '전문·과학·기술 서비스업',       ksicCode: 'M71-73' },
  MARKETING_AD:         { operatingMargin: 4.22, operatingMarginSME: 3.85,  label: '광고업',                       ksicCode: 'M713' },
  ARTS_SPORTS:          { operatingMargin: 15.69, operatingMarginSME: 4.03, label: '예술·스포츠·여가 서비스업',    ksicCode: 'R90-91',
                          note: '종합 평균은 대형 시설(카지노·리조트)이 끌어올린 값이라 중소기업 평균(4%대)이 현실에 가깝습니다.' },
};

function getBenchmark(industry: Industry): Benchmark {
  const map: Record<Industry, keyof typeof BENCHMARKS> = {
    MFG_B2B: 'MFG_ALL',
    MFG_B2C: 'MFG_FOOD',
    RETAIL: 'RETAIL_ALL',
    IT: 'IT_SOFTWARE',
    MEDICAL_GENERAL: 'ARTS_SPORTS',
    MEDICAL_AESTHETIC: 'ARTS_SPORTS',
    BEAUTY: 'RETAIL_OFFLINE',
    HEALTH_SERVICE: 'ARTS_SPORTS',
    HEALTH_PRODUCT: 'MFG_PHARMA',
    HEALTH_TECH: 'MFG_MEDICAL_DEVICE',
    REALESTATE_BROKERAGE: 'REAL_ESTATE',
    REALESTATE_DEV: 'REAL_ESTATE',
    MARKETING_RETAINER: 'MARKETING_AD',
    MARKETING_PROJECT: 'MARKETING_AD',
    SERVICE: 'ACCOM_FOOD',
  };
  return BENCHMARKS[map[industry]];
}

/* ============================================================================
 *  Part 4 — 파생지표 계산 (computeDerived)
 * ==========================================================================*/

const ESTIMATED_LABOR_COST_PER_HEAD = 60000000; // 원
const SME_HEADCOUNT_THRESHOLD = 300;

const KOREAN_NUMBER_UNITS = [
  { value: 1000000000000, label: '조' },
  { value: 100000000, label: '억' },
  { value: 10000, label: '만' },
];

function formatNumber(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '';
  return value.toLocaleString('ko-KR');
}

function formatWon(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toLocaleString('ko-KR')}원`;
}

function formatCount(value?: number | null, unit = '명') {
  if (value == null || Number.isNaN(value)) return '—';
  return `${value.toLocaleString('ko-KR')}${unit}`;
}

function toKoreanMoney(value?: number | null) {
  if (value == null || Number.isNaN(value)) return '';

  const abs = Math.abs(Math.trunc(value));
  if (abs === 0) return '영 원';

  let remaining = abs;
  const parts: string[] = [];

  for (const unit of KOREAN_NUMBER_UNITS) {
    const chunk = Math.floor(remaining / unit.value);
    if (chunk > 0) {
      parts.push(`${chunk.toLocaleString('ko-KR')}${unit.label}`);
      remaining %= unit.value;
    }
  }

  if (remaining > 0) {
    parts.push(remaining.toLocaleString('ko-KR'));
  }

  return `${value < 0 ? '마이너스 ' : ''}${parts.join(' ')}원`;
}

type Derived = {
  operatingMargin: number | null;
  runwayMonths: number | null;
  hcroi: number | null;
  revenuePerHead: number | null;
  govDependency: number | null;
  privateRevenueCoverage: number | null;
  repeatRate: number | null;
  conversionRate: number | null;
  renewalRate: number | null;
  capacityLabel: string | null;
  isSME: boolean;
  gcsStage: GcsStage;
};

function computeDerived(a: Answers): Derived {
  const div = (n?: number, d?: number) => (n != null && d != null && d !== 0 ? n / d : null);
  const pct = (v: number | null) => (v == null ? null : +(v * 100).toFixed(1));
  const r1 = (v: number | null) => (v == null ? null : +v.toFixed(1));
  const r2 = (v: number | null) => (v == null ? null : +v.toFixed(2));

  const operatingMargin = pct(div(a.annualOperatingProfit, a.annualRevenue));
  const runwayMonths = r1(div(a.cash, a.monthlyFixedCost));
  const laborCost = (a.headcount ?? 0) * ESTIMATED_LABOR_COST_PER_HEAD;
  const hcroi = r2(div(a.annualOperatingProfit, laborCost || undefined));
  const revenuePerHeadRaw = div(a.annualRevenue, a.headcount);
  const revenuePerHead = revenuePerHeadRaw == null ? null : Math.round(revenuePerHeadRaw);

  const govDependency =
    a.revenueSource === 'GOV' ? 100 :
    a.revenueSource === 'MIX' && a.govSubsidyAnnual != null
      ? pct(div(a.govSubsidyAnnual, a.annualRevenue))
      : null;

  const privateRevenueCoverage =
    a.revenueSource === 'MIX' && a.govSubsidyAnnual != null && a.monthlyFixedCost && a.annualRevenue
      ? r2(((a.annualRevenue - a.govSubsidyAnnual) / 12) / a.monthlyFixedCost)
      : null;

  const repeatRate =
    a.primaryFormula === 'A' && (a.activeCustomers3m ?? 0) > 0
      ? pct(div(a.repeatCustomers3m, a.activeCustomers3m))
      : null;
  const conversionRate =
    a.primaryFormula === 'B' && (a.newLeadsLastMonth ?? 0) > 0
      ? pct(div(a.newPaidLastMonth, a.newLeadsLastMonth))
      : null;
  const renewalRate =
    a.primaryFormula === 'D' && (a.activeAccounts ?? 0) > 0
      ? pct(div(a.retainedAccounts, a.activeAccounts))
      : null;
  const capacityLabel =
    a.primaryFormula === 'E' && a.capacityStatus
      ? { SLACK: '여유 있음', OK: '적정', OVERLOAD: '초과 근무' }[a.capacityStatus]
      : null;

  const isSME = (a.headcount ?? 0) < SME_HEADCOUNT_THRESHOLD;

  // GCS 단계 판정
  let gcsStage: GcsStage = 'CASH';
  if ((runwayMonths != null && runwayMonths < 3) || (operatingMargin != null && operatingMargin < 0)) {
    gcsStage = 'SURVIVE';
  } else if (runwayMonths != null && runwayMonths >= 6) {
    gcsStage = 'GROW';
  }

  return {
    operatingMargin, runwayMonths, hcroi, revenuePerHead,
    govDependency, privateRevenueCoverage,
    repeatRate, conversionRate, renewalRate, capacityLabel,
    isSME, gcsStage,
  };
}

/* ============================================================================
 *  Part 5 — 메인 유형 판정 (classify)
 * ==========================================================================*/

function classify(a: Answers, d: Derived, bm: Benchmark): ResultType {
  const bmMargin = d.isSME ? bm.operatingMarginSME : bm.operatingMargin;

  // 지혈 필요형
  if ((a.revenueSource === 'PRIVATE' || a.revenueSource === 'PUBLIC')
      && d.runwayMonths != null && d.runwayMonths < 3) return '지혈 필요형';
  if (a.revenueSource === 'MIX' && d.privateRevenueCoverage != null
      && d.privateRevenueCoverage < 0.5 && d.runwayMonths != null && d.runwayMonths < 6) return '지혈 필요형';
  if (a.revenueSource === 'GOV' && d.runwayMonths != null && d.runwayMonths < 3
      && a.nextGrant === 'NONE') return '지혈 필요형';

  // 지원 의존형
  if ((a.revenueSource === 'MIX' || a.revenueSource === 'GOV')
      && d.govDependency != null && d.govDependency >= 50) return '지원 의존형';
  if (a.revenueSource === 'PUBLIC' && a.nextPublicDeal === 'NONE') return '지원 의존형';

  // 마진 취약형 — 업종 SME 평균 대비 판정
  if (d.operatingMargin != null && d.operatingMargin < bmMargin - 2 && (a.annualRevenue ?? 0) >= 100000000) {
    return '마진 취약형';
  }

  return '성장 준비형';
}

/* ============================================================================
 *  Part 6 — 결과 조립
 * ==========================================================================*/

type ActionCard = {
  title: string;
  fact: string;
  insight: string;
  action: string;
  checklist: string[];
};

type Diagnosis = {
  type: ResultType;
  gcsStage: GcsStage;
  headline: { asIs: string; toBe: string; context?: string };
  formula: { expression: string; interpretation: string };
  mainLever: { name: string; value: string; benchmark: string; benchmarkNote?: string };
  actions: ActionCard[];
  cashAdvice: { stage: string; priorities: string[]; avoid: string[] };
  dashboard: { label: string; value: string; note?: string }[];
  sources: string;
};

function buildDiagnosis(a: Answers, d: Derived, bm: Benchmark, t: ResultType): Diagnosis {
  const bmMargin = d.isSME ? bm.operatingMarginSME : bm.operatingMarginSME; // SME 기본 노출
  const marginLabel = d.operatingMargin != null ? `${d.operatingMargin}%` : '—';
  const runwayLabel = d.runwayMonths != null ? `${d.runwayMonths}개월` : '—';
  const dependencyLabel = d.govDependency != null ? `${d.govDependency}%` : null;

  // ── 1. 헤드라인 (As-is / To-be) ──
  const asIsMap: Record<ResultType, string> = {
    '지혈 필요형': `영업이익률 ${marginLabel}, 현금 런웨이 ${runwayLabel}로 지금은 성장이 아니라 현금 방어가 먼저입니다.`,
    '지원 의존형': `영업이익률 ${marginLabel}, 지원 의존도 ${dependencyLabel ?? '—'}로 자체 매출 기반을 더 두껍게 만들어야 하는 구간입니다.`,
    '마진 취약형': `현금 런웨이 ${runwayLabel}는 버티고 있지만 영업이익률 ${marginLabel}로 남는 구조를 다시 짜야 합니다.`,
    '성장 준비형': `영업이익률 ${marginLabel}, 현금 런웨이 ${runwayLabel}로 기본 체력은 확보됐고 이제 성장 레버를 고를 차례입니다.`,
  };
  const toBeMap: Record<ResultType, string> = {
    '지혈 필요형': '3개월 안에 런웨이 6개월 이상 확보하는 게 목표입니다.',
    '지원 의존형': '6개월 안에 지원금 의존도를 50% 미만으로 낮추는 게 목표입니다.',
    '마진 취약형': `6개월 안에 영업이익률을 업종 평균(${bmMargin.toFixed(1)}%) 이상으로 끌어올리는 게 목표입니다.`,
    '성장 준비형': '6개월 안에 매출을 지속적으로 20% 이상 성장시킬 레버를 확정하는 게 목표입니다.',
  };

  // ── 2. 매출 공식 ──
  const formulaInfo = buildFormula(a, d);

  // ── 3. 메인 레버 ──
  const mainLever = buildMainLever(a, d, bm);

  // ── 4. 액션 카드 3개 ──
  const actions = buildActions(a, d, bm, t);

  // ── 5. 현금 전략 (GCS) ──
  const cashAdvice = buildCashAdvice(d.gcsStage);

  // ── 6. 경영 계기판 ──
  const dashboard = buildDashboard(a, d, bm);

  return {
    type: t,
    gcsStage: d.gcsStage,
    headline: {
      asIs: asIsMap[t],
      toBe: toBeMap[t],
      context: bm.note,
    },
    formula: formulaInfo,
    mainLever,
    actions,
    cashAdvice,
    dashboard,
    sources: `한국은행 「2024년 기업경영분석」 (2025.10 공표) · ${bm.label} (${bm.ksicCode}) ${d.isSME ? '중소기업' : '전체'} 기준`,
  };
}

function buildFormula(a: Answers, d: Derived) {
  const f = a.primaryFormula;
  if (f === 'A') {
    const gain = d.repeatRate != null && d.repeatRate > 0
      ? `재구매율 ${d.repeatRate}% 에서 5%p 만 올려도 매출이 약 ${((5 / d.repeatRate) * 100).toFixed(1)}% 증가합니다.`
      : '재구매율은 이 사업 모델에서 가장 큰 레버입니다.';
    return {
      expression: '매출 = 고객 수 × 재구매율 × 객단가',
      interpretation: `세 요소 중 재구매율이 가장 빠른 레버입니다. ${gain}`,
    };
  }
  if (f === 'B') {
    return {
      expression: '매출 = 유입 × 전환율 × 객단가',
      interpretation: `전환율 1%p 변화가 매출의 같은 비율 변화로 이어집니다. 유입 확대보다 전환율 개선이 광고비 부담 없이 가능한 레버입니다.`,
    };
  }
  if (f === 'C') {
    return {
      expression: '매출 = 고객 수 × 객단가',
      interpretation: '고객 수를 늘리는 것보다 객단가를 올리는 것이 영업이익에 2~3배 크게 기여합니다. 신규 획득 비용이 붙지 않기 때문입니다.',
    };
  }
  if (f === 'D') {
    return {
      expression: '매출 = 거래처 수 × 거래처당 매출 × 재계약률',
      interpretation: '재계약률은 영업이익에 직결됩니다. 신규 거래처 확보보다 기존 거래처 유지에 드는 비용이 훨씬 작기 때문입니다.',
    };
  }
  if (f === 'E') {
    return {
      expression: '매출 = 가용 시간 × 가동률 × 시간당 단가',
      interpretation: '가동률이 낮으면 시간당 단가를, 가동률이 초과면 단가 인상이 먼저입니다. 인력을 더 뽑는 건 마지막 선택지입니다.',
    };
  }
  return { expression: '매출 공식 정보 없음', interpretation: '' };
}

function buildMainLever(a: Answers, d: Derived, bm: Benchmark) {
  // 이번 달 집중 지표 결정: GCS + 유형에 따라 다름
  if (d.gcsStage === 'SURVIVE') {
    return {
      name: '현금 런웨이',
      value: d.runwayMonths != null ? `${d.runwayMonths}개월` : '—',
      benchmark: '경영 판단 기준: 3개월 미만 즉시 방어 / 3~6개월 경계 / 6개월 이상 안정',
    };
  }

  if (a.primaryFormula === 'A' && d.repeatRate != null) {
    return {
      name: '재구매율',
      value: `${d.repeatRate}%`,
      benchmark: '이 지표는 업종·정의별 편차가 커서 업계 평균을 제시하지 않습니다. 분기별 추세로 판단해주시기 바랍니다.',
    };
  }
  if (a.primaryFormula === 'B' && d.conversionRate != null) {
    return {
      name: '전환율',
      value: `${d.conversionRate}%`,
      benchmark: '이 지표는 유입 경로·상품 유형별 편차가 커서 업계 평균을 제시하지 않습니다.',
    };
  }
  if (a.primaryFormula === 'D' && d.renewalRate != null) {
    return {
      name: '재계약률',
      value: `${d.renewalRate}%`,
      benchmark: '이 지표는 업종·계약 구조별 편차가 커서 업계 평균을 제시하지 않습니다.',
    };
  }

  // 기본: 영업이익률
  const bmMargin = d.isSME ? bm.operatingMarginSME : bm.operatingMargin;
  const bmScope = d.isSME ? '중소기업' : '전체';
  return {
    name: '영업이익률',
    value: d.operatingMargin != null ? `${d.operatingMargin}%` : '—',
    benchmark: `${bm.label} ${bmScope} 평균 ${bmMargin.toFixed(1)}%`,
    benchmarkNote: bm.note,
  };
}

function buildActions(a: Answers, d: Derived, bm: Benchmark, t: ResultType): ActionCard[] {
  const cards: ActionCard[] = [];

  // 1번 카드 — 유형 기반
  if (t === '지혈 필요형') {
    cards.push({
      title: '이번 주에 현금 30일치를 별도 계좌로 분리하십시오',
      fact: `현재 런웨이 ${d.runwayMonths ?? '—'}개월. 월 고정비 ${formatWon(a.monthlyFixedCost)}.`,
      insight: '런웨이가 짧을 때 가장 먼저 무너지는 건 심리입니다. 총 잔액을 매일 보면 판단력이 떨어집니다. 운영 계좌와 방어 계좌를 물리적으로 분리하면 남은 자원으로 무엇을 할지 차분하게 결정할 수 있습니다.',
      action: '오늘 안에 별도 계좌를 하나 개설하고, 월 고정비 1개월치를 이체하십시오. 이 계좌 카드는 평상시 쓰지 않습니다.',
      checklist: ['별도 계좌 개설', '월 고정비 1개월치 이체', '카드 지갑에서 분리'],
    });
  } else if (t === '지원 의존형') {
    cards.push({
      title: '다음 3개월 안에 유료 민간 고객 10명을 확보하십시오',
      fact: `정부지원 의존도 ${d.govDependency ?? '—'}%. 유료 민간 고객 ${a.paidCustomers ?? '—'}명.`,
      insight: '지원금은 회사 제품에 대한 시장 검증이 아닙니다. 시장이 돈을 내는지는 유료 민간 고객 1명이 증명합니다. 10명을 쌓으면 다음 지원사업 심사에서도 훨씬 유리합니다.',
      action: '지금까지 관심만 표현하고 결제하지 않은 리드 10명에게 이번 주 안에 직접 연락하십시오. 할인·무료 체험 대신 "어떤 문제가 해결되면 결제하시겠습니까?" 를 물으십시오.',
      checklist: ['미결제 리드 10명 리스트 정리', '10명 전원에게 직접 연락', '결제 장벽 3개 도출'],
    });
  } else if (t === '마진 취약형') {
    const bmMargin = d.isSME ? bm.operatingMarginSME : bm.operatingMargin;
    cards.push({
      title: '영업이익률 1%p 개선 시뮬레이션을 해보십시오',
      fact: `현재 영업이익률 ${d.operatingMargin ?? '—'}%, 업종 평균 ${bmMargin.toFixed(1)}%.`,
      insight: `영업이익률 1%p 개선은 "단가 2% 인상" 또는 "원가율 1%p 절감" 으로 가능합니다. 둘 다 어렵게 느껴지지만, 원가 항목별로 쪼개면 1%p 찾는 건 대개 가능합니다.`,
      action: '월 지출 상위 5개 항목을 적어놓고, 각 항목별로 "공급처 1개 더 알아보기" 또는 "단가 협상 시도" 중 하나를 이번 달 안에 실행하십시오.',
      checklist: ['월 지출 상위 5개 항목 정리', '공급처 재협상 시도 최소 2건', '줄어든 원가 금액 기록'],
    });
  } else {
    cards.push({
      title: '다음 6개월의 한 가지 레버를 정하십시오',
      fact: `${formulaLabel(a.primaryFormula)} 기반. 지금 상태는 안정적입니다.`,
      insight: '성장 단계에서 가장 흔한 실수는 "여러 가지를 동시에" 하는 것입니다. 재구매·객단가·신규 획득 중 하나만 6개월 집중해도 결과가 달라집니다.',
      action: '매출 공식 3요소 각각을 10% 올리는 데 드는 시간·비용·성공 확률을 적어보십시오. 숫자로 비교되면 선택이 명확해집니다.',
      checklist: ['3요소별 예상 비용 산출', '3요소별 소요 시간 예상', '가장 레버리지 큰 1개 확정'],
    });
  }

  // 2번 카드 — 매출 공식 기반 확인 행동
  if (a.primaryFormula === 'B') {
    cards.push({
      title: '유입 경로 상위 3개를 직접 확인하십시오',
      fact: `지난달 유입 ${a.newLeadsLastMonth ?? '—'}건 → 유료 전환 ${a.newPaidLastMonth ?? '—'}건. 전환율 ${d.conversionRate ?? '—'}%.`,
      insight: '같은 전환율이어도 유입 경로가 무엇이냐에 따라 해석이 완전히 달라집니다. 할인 검색으로 온 고객이 많다면 이 숫자가 낮은 게 당연하고, 브랜드명으로 직접 찾아온 고객이 많다면 오히려 낮은 수치입니다.',
      action: '이번 주 안에 광고 관리자(Google·Naver·Meta)에서 "유입 소스별 전환율"을 직접 확인하십시오. 경로별 전환율을 표로 만들면 어디에 광고비를 더 쓸지가 눈에 보입니다.',
      checklist: ['상위 3개 유입 경로 확인', '경로별 전환율 표 작성', '다음 달 광고비 재배분'],
    });
  } else if (a.primaryFormula === 'A') {
    cards.push({
      title: '최근 해지 고객 10명에게 직접 연락하십시오',
      fact: `재구매율 ${d.repeatRate ?? '—'}%. 활성 고객 ${a.activeCustomers3m ?? '—'}명 중 재구매 ${a.repeatCustomers3m ?? '—'}명.`,
      insight: '재구매율은 첫 3개월의 경험에 가장 크게 좌우됩니다. 이 구간에서 무엇이 부족한지는 해지한 고객이 가장 정확히 알고 있습니다. 10명 인터뷰가 리서치 업체 보고서보다 빠르고 정확합니다.',
      action: '지난 3개월 안에 해지한 고객 중 10명을 골라 이번 주 안에 직접 연락하십시오. "왜 그만두셨는지" 만 묻고 공통 사유 3개를 적으십시오.',
      checklist: ['해지 고객 10명 선정', '10명 전원 인터뷰', '공통 사유 3개 정리'],
    });
  } else if (a.primaryFormula === 'C') {
    cards.push({
      title: '객단가 10% 인상 후보군을 찾으십시오',
      fact: `연 누적 고객 ${formatCount(a.annualCustomers)}, 평균 객단가 ${formatWon(a.avgTicket)}.`,
      insight: '객단가 10% 인상은 영업이익에 단순 계산보다 훨씬 크게 기여합니다. 고정비가 그대로이기 때문입니다. 다만 기존 고객 전원 인상은 저항이 크므로 프리미엄 옵션 추가 방식이 안전합니다.',
      action: '지난 1년 결제 고객을 결제 횟수순으로 정렬해 상위 20%에게 "프리미엄 옵션" 을 시범 제안하십시오. 2주간 전환율을 측정하면 인상 가능성이 보입니다.',
      checklist: ['상위 20% 고객 명단 추출', '프리미엄 옵션 3개 기획', '10건 이상 시범 제안'],
    });
  } else if (a.primaryFormula === 'D') {
    cards.push({
      title: '핵심 거래처 의존도를 구체 숫자로 확인하십시오',
      fact: `거래처 ${a.activeAccounts ?? '—'}개, 재계약률 ${d.renewalRate ?? '—'}%.`,
      insight: 'B2B 회사의 가장 큰 리스크는 핵심 거래처 이탈입니다. 매출의 30% 이상을 차지하는 거래처가 있다면 그 한 곳 때문에 회사 전체가 흔들립니다.',
      action: '지난 12개월 거래처별 매출을 큰 순서로 나열하십시오. 상위 3개가 전체 매출의 몇 %인지 계산해보시면 의존도가 숫자로 보입니다.',
      checklist: ['거래처별 매출 정렬', '상위 3개 거래처 비중 계산', '의존도 30% 이상이면 분산 계획 수립'],
    });
  } else if (a.primaryFormula === 'E') {
    cards.push({
      title: '가동률 구간별 단가 전략을 점검하십시오',
      fact: `핵심 인력 ${a.coreStaffCount ?? '—'}명, 현재 가동 상태: ${d.capacityLabel ?? '—'}.`,
      insight: '가동률이 "초과 근무" 면 단가 인상이 먼저입니다. 사람을 더 뽑으면 고정비가 늘어 역효과가 납니다. "여유 있음" 이면 단가보다 수요 창출이 먼저입니다.',
      action: '지난 3개월 시간당 단가를 고객별로 확인하십시오. 같은 서비스인데 단가 차이가 20% 이상 나는 고객이 있다면 평균 단가로 재협상하십시오.',
      checklist: ['고객별 시간당 단가 정렬', '평균 대비 20% 낮은 고객 식별', '재협상 대상 3곳 선정'],
    });
  }

  // 3번 카드 — 운영 / 인력 / HCROI 관련
  if (d.hcroi != null && d.hcroi < 0.3 && (a.headcount ?? 0) >= 3) {
    cards.push({
      title: '인건비 1원당 영업이익을 점검하십시오',
      fact: `HCROI ${d.hcroi}배. 인건비 1원을 쓸 때 영업이익 ${Math.max(0, d.hcroi * 100).toFixed(0)}원이 남습니다.`,
      insight: 'HCROI 0.3 미만은 인력 효율이 낮다는 신호입니다. 이건 사람 탓이 아니라 업무 구조 문제인 경우가 많습니다. 반복 업무가 많거나 결정권이 대표 한 명에게 몰려있으면 인력을 늘려도 개선되지 않습니다.',
      action: '이번 달 안에 팀별 주간 업무 중 "대표 확인·결재가 필요한 것" 비율을 세어보십시오. 30% 이상이면 권한 위임 구조가 없어서 생산성이 낮은 것입니다.',
      checklist: ['주간 업무 리스트 작성', '대표 결재 필요 비율 계산', '3가지 결재를 팀장급에 위임'],
    });
  } else {
    cards.push({
      title: '다음 분기의 단 하나의 숫자를 정하십시오',
      fact: `현재 상태는 분명하지만 "다음 분기의 한 숫자" 가 정해지지 않으면 팀도 방향을 잃습니다.`,
      insight: '모든 진단 결과는 결국 "이번 분기에 어떤 숫자를 올릴 것인가" 로 이어집니다. 진단을 받고도 숫자가 정해지지 않으면 진단이 사장됩니다.',
      action: '이번 주 안에 팀과 회의해 다음 분기 집중 숫자 1개를 정하고 모든 주간 보고에 그 숫자를 넣으십시오.',
      checklist: ['다음 분기 핵심 숫자 1개 확정', '주간 보고 템플릿에 포함', '매주 같은 숫자 추적'],
    });
  }

  return cards.slice(0, 3);
}

function formulaLabel(f?: FormulaCategory): string {
  return { A: '반복구매형', B: '신규획득형', C: '객단가 레버형', D: 'B2B 거래처형', E: '가동률형' }[f ?? 'A'] ?? '반복구매형';
}

function buildCashAdvice(stage: GcsStage) {
  if (stage === 'SURVIVE') {
    return {
      stage: '지금은 생존이 최우선인 단계입니다',
      priorities: [
        '월 고정비 1~2개월치를 별도 계좌로 분리해 현금 방어선 확보',
        '고정비 항목별로 연기·축소·재협상 가능한 3건 실행',
        '성장 투자·신규 채용·장기 계약은 전면 중단',
      ],
      avoid: [
        '신규 제품 라인 확장',
        '사무실 이전·확장',
        '광고비 증액',
      ],
    };
  }
  if (stage === 'CASH') {
    return {
      stage: '지금은 생존은 안정적이지만 공격 단계는 아닙니다',
      priorities: [
        '3개월치 고정비를 별도 계좌로 분리해 방어선 확보',
        '마진 개선에 직결되는 운영 시스템 정비 (재고·수불·결제 자동화)',
        'ROI 확인된 채널에만 마케팅 추가 투입',
      ],
      avoid: [
        '새 제품 라인 대규모 확장',
        '신규 채용 2명 이상',
        '1년 이상 장기 임대차 계약',
      ],
    };
  }
  return {
    stage: '지금은 다음 성장에 투자할 수 있는 단계입니다',
    priorities: [
      '검증된 매출 공식을 2배로 확대 (광고비·인력·재고)',
      '시스템화로 대표 병목 제거 (SOP 문서화, 결재 권한 위임)',
      '다음 분기 핵심 숫자 1개를 팀 전체의 주간 추적 지표로 설정',
    ],
    avoid: [
      '검증되지 않은 완전 신규 사업 진입',
      '현금 잔고의 30% 이상을 한 투자에 집중',
      '대표 개인 보증 기반 대규모 차입',
    ],
  };
}

function buildDashboard(a: Answers, d: Derived, bm: Benchmark) {
  const arr: { label: string; value: string; note?: string }[] = [];

  const bmMargin = d.isSME ? bm.operatingMarginSME : bm.operatingMargin;
  arr.push({
    label: '영업이익률',
    value: d.operatingMargin != null ? `${d.operatingMargin}%` : '—',
    note: `${bm.label} 중소기업 평균 ${bmMargin.toFixed(1)}%`,
  });

  arr.push({
    label: '현금 런웨이',
    value: d.runwayMonths != null ? `${d.runwayMonths}개월` : '—',
    note: '3개월 미만: 방어 / 3~6: 경계 / 6+: 안정',
  });

  arr.push({
    label: '인당 매출',
    value: d.revenuePerHead != null ? formatWon(d.revenuePerHead) : '—',
    note: '업종별 편차가 커서 평균 제시 안 함. 지난 분기 대비 추세로 판단',
  });

  arr.push({
    label: '인건비 1원당 영업이익',
    value: d.hcroi != null ? `${d.hcroi}배` : '—',
    note: '0.3 미만: 점검 신호 (공식 통계 없음, 경영 판단 기준)',
  });

  if (d.govDependency != null) {
    arr.push({
      label: '지원금 의존도',
      value: `${d.govDependency}%`,
      note: '50% 이상이면 자체 매출 기반 약화 신호',
    });
  }

  return arr;
}

/* ============================================================================
 *  Part 7 — UI 컴포넌트
 * ==========================================================================*/

export default function Page() {
  const [step, setStep] = useState<number>(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [showResult, setShowResult] = useState(false);

  const setA = <K extends keyof Answers>(k: K, v: Answers[K]) =>
    setAnswers((prev) => ({ ...prev, [k]: v }));

  const bm = answers.industry ? getBenchmark(answers.industry) : BENCHMARKS.ALL;
  const derived = useMemo(() => computeDerived(answers), [answers]);
  const mainType = useMemo(
    () => (answers.industry ? classify(answers, derived, bm) : null),
    [answers, derived, bm],
  );
  const diagnosis = useMemo(
    () => (mainType && answers.industry ? buildDiagnosis(answers, derived, bm, mainType) : null),
    [answers, derived, bm, mainType],
  );

  if (showResult && diagnosis) {
    return <ResultView diagnosis={diagnosis} onRestart={() => {
      setAnswers({}); setStep(0); setShowResult(false);
    }} />;
  }

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">
        <Brand />
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_20px_60px_rgba(28,25,23,0.08)] backdrop-blur sm:p-8">
            <StepIndicator step={step} total={totalSteps(answers)} />
            <div className="mt-8">
              <StepView
                step={step}
                answers={answers}
                setA={setA}
                onNext={() => setStep((s) => s + 1)}
                onPrev={() => setStep((s) => Math.max(0, s - 1))}
                onFinish={() => setShowResult(true)}
              />
            </div>
          </div>
          <aside className="rounded-[2rem] border border-[#eadfce] bg-[#fbf7f2] p-6 shadow-[0_20px_50px_rgba(28,25,23,0.06)]">
            <div className="mono text-[11px] uppercase tracking-[0.24em] text-stone-400">Preview</div>
            <h3 className="mt-3 text-lg font-semibold leading-snug">숫자를 넣으면 바로 대표용 결과지로 정리됩니다.</h3>
            <p className="mt-2 text-sm leading-relaxed text-stone-600">
              입력 중에도 핵심 숫자가 어떻게 쌓이는지 한눈에 보이도록 카드형 레이아웃으로 구성했습니다.
            </p>
            <div className="mt-6 rounded-[1.6rem] border border-stone-200 bg-white p-4 shadow-sm">
              <div className="rounded-[1.3rem] border border-stone-200 bg-[#fffaf3] p-4">
                <div className="text-xs text-stone-500">현재 계산 미리보기</div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-stone-900 p-3 text-white">
                    <div className="text-[11px] text-stone-300">영업이익률</div>
                    <div className="mt-1 text-lg font-semibold">{derived.operatingMargin != null ? `${derived.operatingMargin}%` : '—'}</div>
                  </div>
                  <div className="rounded-2xl border border-stone-200 bg-white p-3">
                    <div className="text-[11px] text-stone-500">현금 런웨이</div>
                    <div className="mt-1 text-lg font-semibold">{derived.runwayMonths != null ? `${derived.runwayMonths}개월` : '—'}</div>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
        <Footer />
      </div>
    </Layout>
  );
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f6f1ea] text-stone-900" style={{ fontFamily: '"Noto Serif KR", "IBM Plex Serif", serif' }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@300;400;500;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap');
        body { -webkit-font-smoothing: antialiased; }
        .mono { font-family: 'IBM Plex Mono', monospace; }
      `}</style>
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,_rgba(255,255,255,0.95),_rgba(246,241,234,0.45)_48%,_transparent_72%)]" />
        <div className="pointer-events-none absolute -left-16 top-52 h-72 w-72 rounded-full bg-white/70 blur-3xl" />
        <div className="pointer-events-none absolute -right-16 top-12 h-72 w-72 rounded-full bg-[#f7c78b]/30 blur-3xl" />
        {children}
      </div>
    </div>
  );
}

function Brand() {
  return (
    <div className="mb-8">
      <div className="mono text-[11px] uppercase tracking-[0.28em] text-stone-400">Founders Inbody</div>
      <div className="mt-3 flex items-baseline gap-3">
        <h1 className="text-4xl font-bold tracking-tight">대표님의 경영 숫자를 한 장으로 읽어드립니다</h1>
        <span className="mono text-xs text-stone-500">v3</span>
      </div>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">
        금액은 원 단위로, 인원과 거래처는 각 단위에 맞게 입력받습니다. 결과는 계기판이 먼저 나오고 그 숫자를 해석하는 진단 문장이 뒤따릅니다.
      </p>
    </div>
  );
}

function totalSteps(a: Answers): number {
  let base = 8; // 1차 7문항 + 공식 선택 1
  if (a.primaryFormula === 'A' || a.primaryFormula === 'B') base += 3;
  if (a.primaryFormula === 'C') base += 2;
  if (a.primaryFormula === 'D') base += 2;
  if (a.primaryFormula === 'E') base += 3;
  if (a.revenueSource === 'MIX') base += 1;
  if (a.revenueSource === 'GOV') base += 2;
  if (a.revenueSource === 'PUBLIC') base += 1;
  return base;
}

function StepIndicator({ step, total }: { step: number; total: number }) {
  const pct = Math.min(100, Math.round((step / Math.max(1, total - 1)) * 100));
  return (
    <div>
      <div className="flex items-center justify-between text-xs text-stone-500">
        <span className="mono">{step + 1} / {total}</span>
        <span className="mono">{pct}%</span>
      </div>
      <div className="mt-2 h-1 w-full rounded-full bg-stone-200">
        <div className="h-1 rounded-full bg-stone-900 transition-all" style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

/* ============================================================================
 *  Part 8 — 질문 흐름 제어
 * ==========================================================================*/

function StepView(props: {
  step: number;
  answers: Answers;
  setA: <K extends keyof Answers>(k: K, v: Answers[K]) => void;
  onNext: () => void;
  onPrev: () => void;
  onFinish: () => void;
}) {
  const { step, answers, setA, onNext, onPrev, onFinish } = props;
  const a = answers;

  // 질문 리스트를 동적으로 구성
  const questions: (() => React.ReactNode)[] = [];

  // Q1. 업종
  questions.push(() => (
    <Question
      num={1}
      title="대표님 회사의 업종은 무엇일까요?"
      subtitle="가장 가까운 하나를 골라주시면 됩니다."
    >
      <div className="grid grid-cols-2 gap-2">
        {INDUSTRIES.map((ind) => (
          <PillSelect
            key={ind.code}
            active={a.industry === ind.code}
            onClick={() => setA('industry', ind.code)}
          >
            <div className="flex items-start gap-2">
              <span className="text-lg">{ind.emoji}</span>
              <div>
                <div className="text-sm font-medium">{ind.label}</div>
                {ind.hint && <div className="mt-0.5 text-xs text-stone-500">{ind.hint}</div>}
              </div>
            </div>
          </PillSelect>
        ))}
      </div>
      <NavBtns onNext={onNext} canNext={!!a.industry} />
    </Question>
  ));

  // Q2. 매출 유형
  questions.push(() => (
    <Question
      num={2}
      title="매출은 주로 어디서 나올까요?"
      subtitle="가장 큰 매출원을 골라주시면 됩니다."
    >
      <div className="space-y-2">
        {[
          { code: 'PRIVATE', label: '민간 고객 매출 중심', hint: '일반 고객·기업 대상 판매' },
          { code: 'PUBLIC', label: '공공수주 중심', hint: '지자체·공공기관 용역·납품' },
          { code: 'MIX', label: '민간 + 정부지원 병행', hint: '매출 + 지원사업비 혼합' },
          { code: 'GOV', label: '정부지원 중심 / Pre-revenue', hint: '지원사업 위주, 유료 고객 적음' },
        ].map((o) => (
          <PillSelect
            key={o.code}
            active={a.revenueSource === o.code}
            onClick={() => setA('revenueSource', o.code as RevenueSource)}
          >
            <div className="text-sm font-medium">{o.label}</div>
            <div className="mt-0.5 text-xs text-stone-500">{o.hint}</div>
          </PillSelect>
        ))}
      </div>
      <NavBtns onPrev={onPrev} onNext={onNext} canNext={!!a.revenueSource} />
    </Question>
  ));

  // Q3. 연 매출
  questions.push(() => (
    <Question num={3} title="지난 1년 매출은 얼마입니까?" subtitle="정부지원금·과제비 포함 총 수입 기준입니다. 세무 자료를 참고해주시면 정확합니다.">
      <NumInput
        value={a.annualRevenue}
        onChange={(v) => setA('annualRevenue', v)}
        placeholder="예: 300,000,000"
        unit="원"
      />
      <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.annualRevenue != null && a.annualRevenue > 0} />
    </Question>
  ));

  // Q4. 영업이익
  questions.push(() => (
    <Question num={4} title="지난 1년 영업이익은 얼마입니까?" subtitle="적자면 앞에 마이너스(−)를 붙여주시면 됩니다.">
      <NumInput
        value={a.annualOperatingProfit}
        onChange={(v) => setA('annualOperatingProfit', v)}
        placeholder="예: 15,000,000 또는 -5,000,000"
        unit="원"
        allowNegative
      />
      <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.annualOperatingProfit != null} />
    </Question>
  ));

  // Q5. 현금
  questions.push(() => (
    <Question num={5} title="지금 바로 사용 가능한 현금은 얼마입니까?" subtitle="통장 잔액 기준이면 충분합니다.">
      <NumInput
        value={a.cash}
        onChange={(v) => setA('cash', v)}
        placeholder="예: 50,000,000"
        unit="원"
      />
      <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.cash != null && a.cash >= 0} />
    </Question>
  ));

  // Q6. 월 고정비
  questions.push(() => (
    <Question num={6} title="월 고정비는 대략 얼마입니까?" subtitle="월급·임대료·고정 구독료 합계입니다. 정확히 몰라도 대략이면 됩니다.">
      <NumInput
        value={a.monthlyFixedCost}
        onChange={(v) => setA('monthlyFixedCost', v)}
        placeholder="예: 10,000,000"
        unit="원"
      />
      <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.monthlyFixedCost != null && a.monthlyFixedCost > 0} />
    </Question>
  ));

  // Q7. 인원수
  questions.push(() => (
    <Question num={7} title="정규 인원은 몇 명입니까?" subtitle="대표 포함. 외주·파트타임은 제외해주세요.">
      <NumInput
        value={a.headcount}
        onChange={(v) => setA('headcount', v)}
        placeholder="예: 5"
        unit="명"
      />
      <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.headcount != null && a.headcount >= 1} />
    </Question>
  ));

  // Q8. 매출 공식
  questions.push(() => (
    <Question
      num={8}
      title="우리 회사 매출이 가장 크게 움직이는 축은 무엇일까요?"
      subtitle="하나를 골라주시면 이후 질문이 맞춤으로 바뀝니다."
    >
      <div className="space-y-2">
        {[
          { code: 'A', label: '기존 고객이 반복 결제하는 구조',       hint: '재구매·멤버십·구독' },
          { code: 'B', label: '신규 고객 획득이 매출을 만듭니다',     hint: '광고·마케팅·유입 기반' },
          { code: 'C', label: '고객 한 명당 단가가 매출을 좌우합니다', hint: '객단가 중심' },
          { code: 'D', label: '몇 곳의 거래처가 매출을 만듭니다',      hint: 'B2B·납품' },
          { code: 'E', label: '가용 시간·인력이 매출을 결정합니다',    hint: '시간 기반 서비스' },
        ].map((o) => (
          <PillSelect
            key={o.code}
            active={a.primaryFormula === o.code}
            onClick={() => setA('primaryFormula', o.code as FormulaCategory)}
          >
            <div className="text-sm font-medium">{o.label}</div>
            <div className="mt-0.5 text-xs text-stone-500">{o.hint}</div>
          </PillSelect>
        ))}
      </div>
      <NavBtns onPrev={onPrev} onNext={onNext} canNext={!!a.primaryFormula} />
    </Question>
  ));

  // 공식별 분기 질문
  if (a.primaryFormula === 'A') {
    questions.push(() => (
      <Question num={9} title="지난 3개월간 한 번이라도 결제한 고객은 몇 명입니까?" subtitle="대략이어도 괜찮습니다.">
        <NumInput value={a.activeCustomers3m} onChange={(v) => setA('activeCustomers3m', v)} unit="명" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.activeCustomers3m != null && a.activeCustomers3m >= 0} />
      </Question>
    ));
    questions.push(() => (
      <Question num={10} title="그중 2회 이상 결제한 고객은 몇 명입니까?" subtitle="재구매율을 자동 계산합니다.">
        <NumInput value={a.repeatCustomers3m} onChange={(v) => setA('repeatCustomers3m', v)} unit="명" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.repeatCustomers3m != null && a.repeatCustomers3m >= 0} />
      </Question>
    ));
    questions.push(() => (
      <Question num={11} title="평균 1회 결제 금액은 얼마입니까?">
        <NumInput value={a.avgOrderValue} onChange={(v) => setA('avgOrderValue', v)} unit="원" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.avgOrderValue != null && a.avgOrderValue >= 0} />
      </Question>
    ));
  } else if (a.primaryFormula === 'B') {
    questions.push(() => (
      <Question num={9} title="지난달 신규 상담·가입·문의는 몇 건입니까?">
        <NumInput value={a.newLeadsLastMonth} onChange={(v) => setA('newLeadsLastMonth', v)} unit="건" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.newLeadsLastMonth != null && a.newLeadsLastMonth >= 0} />
      </Question>
    ));
    questions.push(() => (
      <Question num={10} title="그중 유료 전환된 고객은 몇 명입니까?">
        <NumInput value={a.newPaidLastMonth} onChange={(v) => setA('newPaidLastMonth', v)} unit="명" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.newPaidLastMonth != null && a.newPaidLastMonth >= 0} />
      </Question>
    ));
    questions.push(() => (
      <Question num={11} title="신규 고객 평균 결제 금액은 얼마입니까?">
        <NumInput value={a.newCustomerAOV} onChange={(v) => setA('newCustomerAOV', v)} unit="원" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.newCustomerAOV != null && a.newCustomerAOV >= 0} />
      </Question>
    ));
  } else if (a.primaryFormula === 'C') {
    questions.push(() => (
      <Question num={9} title="지난 1년 누적 고객은 대략 몇 명입니까?">
        <NumInput value={a.annualCustomers} onChange={(v) => setA('annualCustomers', v)} unit="명" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.annualCustomers != null && a.annualCustomers >= 0} />
      </Question>
    ));
    questions.push(() => (
      <Question num={10} title="평균 객단가는 얼마입니까?">
        <NumInput value={a.avgTicket} onChange={(v) => setA('avgTicket', v)} unit="원" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.avgTicket != null && a.avgTicket >= 0} />
      </Question>
    ));
  } else if (a.primaryFormula === 'D') {
    questions.push(() => (
      <Question num={9} title="현재 매출이 발생하는 거래처는 몇 개입니까?">
        <NumInput value={a.activeAccounts} onChange={(v) => setA('activeAccounts', v)} unit="개" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.activeAccounts != null && a.activeAccounts >= 0} />
      </Question>
    ));
    questions.push(() => (
      <Question num={10} title="작년 거래처 중 올해도 거래가 이어지는 곳은 몇 개입니까?" subtitle="재계약률을 자동 계산합니다.">
        <NumInput value={a.retainedAccounts} onChange={(v) => setA('retainedAccounts', v)} unit="개" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.retainedAccounts != null && a.retainedAccounts >= 0} />
      </Question>
    ));
  } else if (a.primaryFormula === 'E') {
    questions.push(() => (
      <Question num={9} title="매출을 만드는 핵심 인력은 몇 명입니까?">
        <NumInput value={a.coreStaffCount} onChange={(v) => setA('coreStaffCount', v)} unit="명" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.coreStaffCount != null && a.coreStaffCount >= 0} />
      </Question>
    ));
    questions.push(() => (
      <Question num={10} title="이 인력의 현재 가동 상태는 어떠합니까?">
        <div className="space-y-2">
          {[
            { code: 'SLACK', label: '여유 있음', hint: '일이 부족함' },
            { code: 'OK', label: '적정', hint: '정상 가동' },
            { code: 'OVERLOAD', label: '초과 근무', hint: '일이 넘침' },
          ].map((o) => (
            <PillSelect
              key={o.code}
              active={a.capacityStatus === o.code}
              onClick={() => setA('capacityStatus', o.code as 'SLACK' | 'OK' | 'OVERLOAD')}
            >
              <div className="text-sm font-medium">{o.label}</div>
              <div className="mt-0.5 text-xs text-stone-500">{o.hint}</div>
            </PillSelect>
          ))}
        </div>
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={!!a.capacityStatus} />
      </Question>
    ));
    questions.push(() => (
      <Question num={11} title="시간당 또는 일당 단가는 얼마입니까?">
        <NumInput value={a.hourlyRate} onChange={(v) => setA('hourlyRate', v)} unit="원" />
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={a.hourlyRate != null && a.hourlyRate >= 0} />
      </Question>
    ));
  }

  // 매출 유형별 분기
  if (a.revenueSource === 'MIX') {
    questions.push(() => (
      <Question title="지난 1년 수입 중 정부지원금 합계는 얼마입니까?">
        <NumInput value={a.govSubsidyAnnual} onChange={(v) => setA('govSubsidyAnnual', v)} unit="원" />
        <NavBtns onPrev={onPrev} onNext={onFinish} nextLabel="결과 보기" canNext={a.govSubsidyAnnual != null && a.govSubsidyAnnual >= 0} />
      </Question>
    ));
  } else if (a.revenueSource === 'GOV') {
    questions.push(() => (
      <Question title="다음 지원사업 확보 상태는 어떠합니까?">
        <div className="space-y-2">
          {[
            { code: 'SECURED', label: '확보됨' },
            { code: 'APPLIED', label: '신청·심사 중' },
            { code: 'NONE', label: '없음' },
          ].map((o) => (
            <PillSelect
              key={o.code}
              active={a.nextGrant === o.code}
              onClick={() => setA('nextGrant', o.code as 'SECURED' | 'APPLIED' | 'NONE')}
            >
              <div className="text-sm font-medium">{o.label}</div>
            </PillSelect>
          ))}
        </div>
        <NavBtns onPrev={onPrev} onNext={onNext} canNext={!!a.nextGrant} />
      </Question>
    ));
    questions.push(() => (
      <Question title="유료 민간 고객은 몇 명입니까?" subtitle="정부·지원사업 아닌, 자기 돈으로 결제한 고객 수입니다.">
        <NumInput value={a.paidCustomers} onChange={(v) => setA('paidCustomers', v)} unit="명" />
        <NavBtns onPrev={onPrev} onNext={onFinish} nextLabel="결과 보기" canNext={a.paidCustomers != null && a.paidCustomers >= 0} />
      </Question>
    ));
  } else if (a.revenueSource === 'PUBLIC') {
    questions.push(() => (
      <Question title="다음 공공수주 확보 상태는 어떠합니까?">
        <div className="space-y-2">
          {[
            { code: 'SECURED', label: '확보됨' },
            { code: 'PIPELINE', label: '파이프라인에 있음' },
            { code: 'NONE', label: '없음' },
          ].map((o) => (
            <PillSelect
              key={o.code}
              active={a.nextPublicDeal === o.code}
              onClick={() => setA('nextPublicDeal', o.code as 'SECURED' | 'PIPELINE' | 'NONE')}
            >
              <div className="text-sm font-medium">{o.label}</div>
            </PillSelect>
          ))}
        </div>
        <NavBtns onPrev={onPrev} onNext={onFinish} nextLabel="결과 보기" canNext={!!a.nextPublicDeal} />
      </Question>
    ));
  } else {
    // PRIVATE 은 분기 없음 — 마지막 질문을 결과로 전환
    // 이전 마지막 질문의 onNext 를 onFinish 로 바꿀 수 없으므로 별도 "결과 보기" 버튼 페이지 추가
    questions.push(() => (
      <Question title="진단을 완료하겠습니다" subtitle="모든 답변이 준비됐습니다. 결과 화면으로 이동합니다.">
        <div className="rounded-xl border border-stone-200 bg-white p-4 text-sm text-stone-600">
          입력하신 자료로 업종 평균과 비교한 맞춤 진단을 생성합니다.
        </div>
        <NavBtns onPrev={onPrev} onNext={onFinish} nextLabel="결과 보기" canNext={true} />
      </Question>
    ));
  }

  const current = questions[Math.min(step, questions.length - 1)];
  return <div>{current?.()}</div>;
}

/* ============================================================================
 *  Part 9 — 공통 UI 요소
 * ==========================================================================*/

function Question({ num, title, subtitle, children }: {
  num?: number; title: string; subtitle?: string; children: React.ReactNode;
}) {
  return (
    <div>
      {num != null && <div className="mono text-xs text-stone-500">Q{num}.</div>}
      <h2 className="mt-2 text-2xl font-medium leading-tight">{title}</h2>
      {subtitle && <p className="mt-3 max-w-2xl text-sm leading-relaxed text-stone-600">{subtitle}</p>}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function PillSelect({ active, onClick, children }: {
  active?: boolean; onClick: () => void; children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-xl border px-4 py-3 text-left transition ${
        active
          ? 'border-stone-900 bg-stone-900 text-white shadow-lg'
          : 'border-stone-200 bg-[#fffdf9] hover:border-stone-400'
      }`}
    >
      {children}
    </button>
  );
}

function NumInput({ value, onChange, placeholder, unit, allowNegative }: {
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
  unit?: string;
  allowNegative?: boolean;
}) {
  const helperText = unit === '원' ? toKoreanMoney(value) : '';
  return (
    <div className="relative">
      <input
        type="text"
        inputMode={allowNegative ? 'text' : 'numeric'}
        value={value == null ? '' : formatNumber(value)}
        placeholder={placeholder ?? '숫자를 입력해주십시오'}
        onChange={(e) => {
          const raw = e.target.value.replace(/[^\d\-]/g, '');
          if (raw === '' || raw === '-') return onChange(undefined);
          const n = Number(raw);
          if (!isNaN(n)) {
            if (!allowNegative && n < 0) return;
            onChange(n);
          }
        }}
        className="mono w-full rounded-[1.25rem] border border-stone-200 bg-[#fffdf9] px-5 py-4 text-xl outline-none transition focus:border-stone-900"
      />
      {unit && (
        <span className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-sm text-stone-500">
          {unit}
        </span>
      )}
      {helperText && <p className="mt-3 text-xs leading-relaxed text-stone-500">{helperText}</p>}
    </div>
  );
}

function NavBtns({ onPrev, onNext, canNext, nextLabel = '다음' }: {
  onPrev?: () => void; onNext: () => void; canNext: boolean; nextLabel?: string;
}) {
  return (
    <div className="mt-6 flex items-center gap-3">
      {onPrev && (
        <button
          onClick={onPrev}
          className="rounded-xl border border-stone-200 bg-white px-5 py-3 text-sm hover:border-stone-400"
        >
          이전
        </button>
      )}
      <button
        disabled={!canNext}
        onClick={onNext}
        className="flex-1 rounded-xl bg-stone-900 px-5 py-3 text-sm font-medium text-white transition disabled:bg-stone-300"
      >
        {nextLabel}
      </button>
    </div>
  );
}

function Footer() {
  return (
    <div className="mt-12 border-t border-stone-200 pt-6">
      <p className="text-xs text-stone-500">
        원자료만 입력하시면 영업이익률·런웨이·HCROI 등은 앱이 자동 계산합니다. 저장되지 않으며 새로 고침하면 초기화됩니다.
      </p>
    </div>
  );
}

/* ============================================================================
 *  Part 10 — 결과 화면
 * ==========================================================================*/

function ResultView({ diagnosis, onRestart }: { diagnosis: Diagnosis; onRestart: () => void }) {
  const d = diagnosis;
  return (
    <Layout>
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/80 bg-white/85 p-6 shadow-[0_24px_80px_rgba(28,25,23,0.08)] backdrop-blur sm:p-8 lg:p-10">
          <div className="flex items-baseline justify-between">
            <div>
              <div className="mono text-[11px] uppercase tracking-[0.28em] text-stone-400">Result Sheet</div>
              <h1 className="mt-2 text-3xl font-bold tracking-tight">진단 결과</h1>
              <p className="mt-1 text-sm text-stone-600">원자료 기반 · 한국은행 2024 업종 평균 반영</p>
            </div>
            <button onClick={onRestart} className="mono text-xs text-stone-500 underline">다시 진단</button>
          </div>

          <Section num="01" title="경영 계기판">
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
              {d.dashboard.map((m, i) => (
                <div key={i} className={`${i === 0 ? 'border-stone-900 bg-stone-900 text-white' : 'border-stone-200 bg-[#fffdf9] text-stone-900'} rounded-[1.6rem] border p-5 shadow-sm`}>
                  <div className={`${i === 0 ? 'text-stone-300' : 'text-stone-500'} text-xs`}>{m.label}</div>
                  <div className="mono mt-3 text-2xl font-semibold">{m.value}</div>
                  {m.note && <div className={`${i === 0 ? 'text-stone-300' : 'text-stone-500'} mt-3 text-[11px] leading-relaxed`}>{m.note}</div>}
                </div>
              ))}
            </div>
          </Section>

          <Section num="02" title="한 줄 진단">
            <div className="rounded-[1.8rem] border border-stone-900 bg-stone-900 p-6 text-white shadow-[0_24px_60px_rgba(28,25,23,0.18)]">
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

          <Section num="03" title="이번 달 집중 지표">
            <div className="rounded-[1.6rem] border border-stone-200 bg-[#fffdf9] p-6">
              <div className="text-xs text-stone-500">{d.mainLever.name}</div>
              <div className="mono mt-2 text-4xl font-semibold">{d.mainLever.value}</div>
              <div className="mt-3 text-xs leading-relaxed text-stone-500">{d.mainLever.benchmark}</div>
              {d.mainLever.benchmarkNote && (
                <div className="mt-3 rounded-2xl bg-stone-50 p-4 text-xs leading-relaxed text-stone-600">
                  💡 {d.mainLever.benchmarkNote}
                </div>
              )}
            </div>
          </Section>

          <Section num="04" title="행동 전략 3가지">
            <div className="space-y-4">
              {d.actions.map((ac, i) => (
                <ActionCardView key={i} card={ac} idx={i + 1} />
              ))}
            </div>
          </Section>

          <Section num="05" title="잉여금·현금 운용 우선순위">
            <div className="rounded-[1.6rem] border border-stone-200 bg-[#fffdf9] p-6">
              <div className="text-sm font-medium">{d.cashAdvice.stage}</div>
              <div className="mt-4">
                <div className="text-xs font-medium text-stone-500">먼저 하실 것</div>
                <ol className="mt-2 space-y-2">
                  {d.cashAdvice.priorities.map((p, i) => (
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
                  {d.cashAdvice.avoid.map((x, i) => (
                    <li key={i} className="text-sm text-stone-600">✕ {x}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section num="" title="" hideTitle>
            <div className="mt-4 rounded-[1.6rem] border border-stone-200 bg-stone-50 p-5">
              <div className="mono text-xs text-stone-500">참고 출처</div>
              <p className="mt-2 text-xs leading-relaxed text-stone-600">
                · 업종 평균 영업이익률: <strong>{d.sources}</strong><br />
                · 인건비 추정: 통계청 KOSIS 임금근로자 평균 + 4대보험·복리후생 가산<br />
                <br />
                이 진단은 경영 판단 참고 자료이며 법적·재무적 조언이 아닙니다. 재구매율·전환율·재계약률 등은 국내 공식 통계가 없어 비교 기준을 제공하지 않습니다. 회사의 분기별 추세를 함께 보시기 바랍니다.
              </p>
            </div>
          </Section>

          <button
            onClick={onRestart}
            className="mt-8 w-full rounded-xl border border-stone-900 bg-white px-4 py-3 text-sm font-medium transition hover:bg-stone-900 hover:text-white"
          >
            처음부터 다시 진단하기
          </button>
        </div>
      </div>
    </Layout>
  );
}

function Section({ num, title, children, hideTitle }: {
  num: string; title: string; children: React.ReactNode; hideTitle?: boolean;
}) {
  return (
    <section className="mt-10">
      {!hideTitle && (
        <div className="flex items-baseline gap-3 border-b border-stone-200 pb-2">
          <span className="mono text-xs text-stone-400">{num}</span>
          <h3 className="text-sm font-medium tracking-wide text-stone-700">{title}</h3>
        </div>
      )}
      <div className={hideTitle ? '' : 'mt-4'}>{children}</div>
    </section>
  );
}

function ActionCardView({ card, idx }: { card: ActionCard; idx: number }) {
  return (
    <div className="rounded-[1.6rem] border border-stone-200 bg-[#fffdf9] p-5 shadow-sm">
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
            {card.checklist.map((c, i) => (
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
