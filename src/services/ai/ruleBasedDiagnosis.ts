import { Campaign, AIDiagnosisResult, RecommendationItem, BenchmarkComparison } from '../../types/campaign';
import { calculateCampaignMetrics, PLATFORM_BENCHMARKS } from '../../utils/metrics';

/**
 * Deterministic, rule-based marketing intelligence engine that acts as a reliable fallback
 * or standalone diagnostic tool when external AI services are unreachable.
 */
export function generateRuleBasedDiagnosis(campaign: Campaign): AIDiagnosisResult {
  const metrics = calculateCampaignMetrics(campaign);
  const benchmark = PLATFORM_BENCHMARKS[campaign.platform] || PLATFORM_BENCHMARKS['Other'];

  const strengths: string[] = [];
  const performance_concerns: string[] = [];
  const possible_causes: string[] = [];
  const recommendations: RecommendationItem[] = [];
  const missing_data: string[] = [];
  const benchmark_comparisons: BenchmarkComparison[] = [];

  // Compare CTR
  const ctrDiff = metrics.ctr - benchmark.ctr;
  benchmark_comparisons.push({
    metric: 'CTR (Click-Through Rate)',
    campaignValue: `${metrics.ctr.toFixed(2)}%`,
    benchmarkValue: `${benchmark.ctr.toFixed(2)}%`,
    status: ctrDiff >= 0.2 ? 'above' : ctrDiff <= -0.2 ? 'below' : 'on_par',
  });

  if (metrics.ctr > benchmark.ctr * 1.15) {
    strengths.push(`Strong ad engagement: Click-Through Rate is ${metrics.ctr.toFixed(2)}%, outperforming the ${campaign.platform} benchmark (${benchmark.ctr}%).`);
  } else if (metrics.ctr < benchmark.ctr * 0.75) {
    performance_concerns.push(`Low ad engagement: Click-Through Rate of ${metrics.ctr.toFixed(2)}% is significantly below industry average (${benchmark.ctr}%).`);
    possible_causes.push('Hypothesis: Ad creative fatigue, suboptimal headline messaging, or audience targeting misalignment may be dampening click intent.');
    recommendations.push({
      id: `rec-rule-ctr-${Date.now()}`,
      title: 'A/B Test 2–3 New Creative Variations & Hook Angles',
      explanation: `CTR is currently ${metrics.ctr.toFixed(2)}% vs ${benchmark.ctr}% platform benchmark. Fresh hooks can rekindle audience interest.`,
      metric_evidence: `CTR is ${metrics.ctr.toFixed(2)}% (benchmark: ${benchmark.ctr.toFixed(2)}%)`,
      priority: 'High',
      category: 'creative',
      implementation_steps: [
        'Design 2 distinct visual variants (lifestyle image vs clean product demo graphic).',
        'Draft contrasting headline hooks (benefit-driven vs pain-point resolution).',
        'Run both against the current winner for 5–7 days before reallocating budget.',
      ],
      expected_impact: 'Estimated to restore click engagement closer to platform averages without budget increase.',
      status: 'pending',
    });
  }

  // Compare CVR
  const cvrDiff = metrics.cvr - benchmark.cvr;
  benchmark_comparisons.push({
    metric: 'CVR (Conversion Rate)',
    campaignValue: `${metrics.cvr.toFixed(2)}%`,
    benchmarkValue: `${benchmark.cvr.toFixed(2)}%`,
    status: cvrDiff >= 0.3 ? 'above' : cvrDiff <= -0.3 ? 'below' : 'on_par',
  });

  if (metrics.cvr > benchmark.cvr * 1.2) {
    strengths.push(`High post-click efficiency: On-site Conversion Rate of ${metrics.cvr.toFixed(2)}% strongly exceeds the ${benchmark.cvr}% benchmark.`);
  } else if (metrics.cvr < benchmark.cvr * 0.6) {
    performance_concerns.push(`Post-click drop-off: Conversion Rate is ${metrics.cvr.toFixed(2)}%, well under the expected ${benchmark.cvr}%. Users click but fail to complete actions.`);
    possible_causes.push('Hypothesis: Destination landing page may suffer from slow mobile load times, unexpected price revelation, or broken message match with the ad promise.');
    recommendations.push({
      id: `rec-rule-cvr-${Date.now()}`,
      title: 'Audit Landing Page Friction & Mobile Checkout Flow',
      explanation: `Ad is delivering traffic (${campaign.clicks} clicks), but only ${campaign.conversions} converted (${metrics.cvr.toFixed(2)}% CVR).`,
      metric_evidence: `CVR is ${metrics.cvr.toFixed(2)}% vs ${benchmark.cvr.toFixed(2)}% expected`,
      priority: 'High',
      category: 'landing_page',
      implementation_steps: [
        'Verify that the landing page headline matches the specific ad copy promise verbatim.',
        'Run Google PageSpeed Insights on the destination URL to identify mobile latency bottlenecks.',
        'Streamline required form fields down to essential fields only (e.g. email + name).',
      ],
      expected_impact: 'A reduction in on-site friction directly lowers CPA without needing extra ad spend.',
      status: 'pending',
    });
  }

  // ROAS evaluation
  benchmark_comparisons.push({
    metric: 'ROAS (Return on Ad Spend)',
    campaignValue: `${metrics.roas.toFixed(2)}x`,
    benchmarkValue: `${benchmark.roas.toFixed(2)}x`,
    status: metrics.roas >= benchmark.roas ? 'above' : metrics.roas >= 1.5 ? 'on_par' : 'below',
  });

  if (metrics.roas >= 3.0) {
    strengths.push(`Exceptional return on investment: ROAS of ${metrics.roas.toFixed(2)}x indicates profitable revenue generation ($${metrics.profit.toLocaleString()} net margin).`);
    recommendations.push({
      id: `rec-rule-scale-${Date.now()}`,
      title: 'Gradually Scale Daily Budget by 15–20%',
      explanation: `With a strong ${metrics.roas.toFixed(2)}x ROAS, this campaign has room for incremental budget expansion while monitoring CPA stability.`,
      metric_evidence: `ROAS is ${metrics.roas.toFixed(2)}x with $${metrics.profit.toFixed(0)} gross profit`,
      priority: 'Medium',
      category: 'budget',
      implementation_steps: [
        'Increase daily spend by no more than 15% every 3 days to preserve algorithmic bidding stability.',
        'Monitor whether CPA stays below maximum target threshold as volume scales.',
      ],
      expected_impact: 'Increased total conversion volume while maintaining profitable acquisition costs.',
      status: 'pending',
    });
  } else if (metrics.roas > 0 && metrics.roas < 1.0) {
    performance_concerns.push(`Unprofitable ad spend: ROAS is ${metrics.roas.toFixed(2)}x, generating less revenue ($${campaign.revenue.toLocaleString()}) than spent ($${campaign.spend.toLocaleString()}).`);
    possible_causes.push('Hypothesis: Product pricing may be too low relative to customer acquisition cost, or the campaign is attracting non-buying exploration traffic.');
    recommendations.push({
      id: `rec-rule-budget-${Date.now()}`,
      title: 'Cap Spend on Underperforming Placements or Tighten Audience Segments',
      explanation: `Campaign is currently losing $${Math.abs(metrics.profit).toFixed(2)}. Spend must be focused strictly on proven segments.`,
      metric_evidence: `Net loss is -$${Math.abs(metrics.profit).toFixed(2)} at ${metrics.roas.toFixed(2)}x ROAS`,
      priority: 'High',
      category: 'budget',
      implementation_steps: [
        'Audit placement breakdown (e.g., Audience Network vs Search vs Feed) and pause unprofitable placements.',
        'Exclude audiences that have visited in the last 7 days without converting.',
      ],
      expected_impact: 'Prevents capital bleed while root causes are investigated.',
      status: 'pending',
    });
  }

  // Trend detection from dailyMetrics if available
  if (campaign.dailyMetrics && campaign.dailyMetrics.length >= 4) {
    const dm = campaign.dailyMetrics;
    const firstHalf = dm.slice(0, Math.floor(dm.length / 2));
    const secondHalf = dm.slice(Math.floor(dm.length / 2));

    const avgConvFirst = firstHalf.reduce((sum, d) => sum + d.conversions, 0) / firstHalf.length;
    const avgConvSecond = secondHalf.reduce((sum, d) => sum + d.conversions, 0) / secondHalf.length;

    if (avgConvSecond < avgConvFirst * 0.5) {
      performance_concerns.push(`Sharp mid-campaign conversion velocity drop: Average daily conversions declined from ${avgConvFirst.toFixed(1)} to ${avgConvSecond.toFixed(1)} in the latter period.`);
      possible_causes.push('Hypothesis: An external site change, broken tracking pixel, or landing page deployment coincided with the drop.');
      recommendations.push({
        id: `rec-rule-pixel-${Date.now()}`,
        title: 'Verify Pixel & Tracking Event Fire Rates',
        explanation: 'Sudden drops in daily conversions often point to tag manager errors or tracking token expirations rather than natural audience fatigue.',
        metric_evidence: `Daily conversions plummeted by ${(((avgConvFirst - avgConvSecond) / avgConvFirst) * 100).toFixed(0)}%`,
        priority: 'High',
        category: 'conversion',
        implementation_steps: [
          'Inspect Google Tag Manager or Meta Pixel Helper in browser dev tools on the conversion page.',
          'Review server logs or checkout error rates starting around the date of the drop.',
        ],
        expected_impact: 'Rule out technical false alarms before altering campaign strategy.',
        status: 'pending',
      });
    }
  }

  // Data gaps
  if (!campaign.audienceNotes) {
    missing_data.push('Target audience demographic or keyword definition (add in campaign notes for deeper context).');
  }
  missing_data.push('Device breakdown data (mobile vs desktop split) to verify screen-specific friction.');
  missing_data.push('Attribution window specification (e.g. 7-day click vs 1-day view).');

  // Executive summary synthesis
  const executive_summary = `Campaign "${campaign.name}" on ${campaign.platform} has generated ${campaign.clicks.toLocaleString()} clicks and ${campaign.conversions.toLocaleString()} conversions against $${campaign.spend.toLocaleString()} spend. Overall ROAS sits at ${metrics.roas.toFixed(2)}x with a ${metrics.ctr.toFixed(2)}% CTR and ${metrics.cvr.toFixed(2)}% CVR. ${performance_concerns.length > 0 ? 'Primary attention is required on ' + performance_concerns[0] : 'The campaign is operating with healthy unit economics.'}`;

  return {
    id: `diag-rule-${Date.now()}`,
    campaignId: campaign.id,
    campaignName: campaign.name,
    timestamp: new Date().toISOString(),
    provider: 'rule_based',
    executive_summary,
    strengths: strengths.length > 0 ? strengths : ['Sufficient impressions collected to establish baseline statistical confidence.'],
    performance_concerns: performance_concerns.length > 0 ? performance_concerns : ['No critical anomalies identified in the current reporting period.'],
    possible_causes: possible_causes.length > 0 ? possible_causes : ['Performance is consistent with expected platform engagement rates.'],
    recommendations,
    confidence: campaign.clicks > 500 ? 'High' : campaign.clicks > 100 ? 'Medium' : 'Low',
    missing_data,
    benchmark_comparisons,
  };
}
