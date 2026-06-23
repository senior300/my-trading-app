import { NextResponse } from 'next/server';

interface AnalysisRequest {
  digitPercentages?: number[];
  totalTicks?: number;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => ({}))) as AnalysisRequest;
  const percentages = Array.isArray(body.digitPercentages) && body.digitPercentages.length === 10
    ? body.digitPercentages.map(Number)
    : Array.from({ length: 10 }, () => 0);

  const strongestDigit = percentages.indexOf(Math.max(...percentages));
  const weakestDigit = percentages.indexOf(Math.min(...percentages));
  const evenPressure = percentages.filter((_, digit) => digit % 2 === 0).reduce((sum, pct) => sum + pct, 0);
  const oddPressure = 100 - evenPressure;
  const totalTicks = Number(body.totalTicks ?? 0);

  return NextResponse.json({
    status: 'ok',
    source: 'senior-trader-backend',
    totalTicks,
    strongestDigit,
    weakestDigit,
    parityBias: evenPressure >= oddPressure ? 'even' : 'odd',
    message: 'Backend analysis ready. Live execution is handled through the Deriv WebSocket session.',
  });
}
