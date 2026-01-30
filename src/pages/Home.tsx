import { useState } from 'react'
import { callAIAgent, type NormalizedAgentResponse } from '@/utils/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import {
  MdDashboard as LayoutDashboard,
  MdInbox as Inbox,
  MdSettings as Settings,
  MdShowChart as Activity,
  MdLocalFireDepartment as Flame,
  MdBusiness as Building,
  MdStar as Star,
  MdError as AlertCircle,
  MdExpandMore as ChevronDown,
  MdPerson as User,
  MdPeople as Users,
  MdHub as Network,
  MdTrendingUp as TrendingUp,
  MdTrendingDown as TrendingDown,
  MdBarChart as BarChart,
  MdGpsFixed as Target,
  MdMessage as MessageSquare,
  MdPublic as Globe,
  MdFlashOn as Zap,
  MdAutorenew as Loader2
} from 'react-icons/md'
import { cn } from '@/lib/utils'

// =============================================================================
// AGENT IDS - ALL 27 AGENTS (15 ORIGINAL + 11 SIGNAL-TO-ACTION + 1 ORCHESTRATOR)
// =============================================================================

const AGENT_IDS = {
  // Original Agents (8)
  LEAD_PROCESSING_COORDINATOR: '697ace4fbc6eb6293f5503f1',
  LEAD_ENRICHMENT: '697acded814f1038c09862c5',
  ICP_SCORING: '697ace07814f1038c09862c6',
  MESSAGE_GENERATION: '697ace27c03792e039e5ada5',
  EMAIL_DELIVERY: '697ace6bc03792e039e5adaa',
  LINKEDIN_CONTENT: '697ace8623e56dc88c1ff0c6',
  MEETING_SCHEDULER: '697acea3814f1038c09862d1',
  WRITING_STYLE_ANALYZER: '697acec2814f1038c09862d2',

  // New Agents (7)
  CLAY_ENRICHMENT_INTENT: '697ad49223e56dc88c1ff0f0',
  INSTANTLY_EMAIL_SENDER: '697ad4a9bc6eb6293f55040b',
  LINKEDIN_SALES_NAVIGATOR: '697ad4c2c03792e039e5add8',
  GENSPARK_RESEARCH: '697ad4ddbc6eb6293f55040f',
  CLAUDE_COWORK: '697ad52bbc6eb6293f550413',
  GEMINI_DEEP_RESEARCH: '697ad557814f1038c09862ef',
  MULTI_CHANNEL_ORCHESTRATOR: '697ad587bc6eb6293f550417',

  // Signal-to-Action Agents (11 new)
  LINKEDIN_SIGNAL_LISTENER: '697b9dda23e56dc88c2033a1',
  COMPOUND_INTENT_SCORE_MANAGER: '697b9dfb23e56dc88c2033b7',
  DAY_0_STRATEGIC_MEMO: '697b9e2a23e56dc88c2033de',
  TEXT_A_FRIEND_MESSAGE_WRITER: '697b9e5a23e56dc88c20340c',
  STYLE_VIBE_CHECK: '697b9e89814f1038c098a5c5',
  KNOWLEDGE_GRAPH: '697b9eba23e56dc88c20349f',
  RESPONSE_CLASSIFIER: '697b9efcbc6eb6293f5547f4',
  FOLLOW_UP_SEQUENCE_ENGINE: '697b9f35c03792e039e5f116',
  GLOBAL_TIME_ZONE_ORCHESTRATOR: '697b9f71c03792e039e5f16d',
  HUBSPOT_GHOST_WRITER: '697ba016bc6eb6293f554937',
  MULTI_CHANNEL_LOAD_BALANCER: '697ba06abc6eb6293f5549bb'
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface IntentSignal {
  id: string
  leadName: string
  title: string
  company: string
  description: string
  strength: 'hot' | 'warm' | 'cold'
  signalType: string
  timeAgo: string
  intentScore: number
  detectedAt: string
  source: string
}

interface FunnelStage {
  name: string
  count: number
  percentage: number
  dropoff: number
  icon: any
}

// =============================================================================
// MOCK DATA FOR MISSION CONTROL
// =============================================================================

const MOCK_SIGNALS: IntentSignal[] = [
  {
    id: '1',
    leadName: 'Sarah Martinez',
    title: 'VP of Sales',
    company: 'TechFlow Inc',
    description: 'Commented on competitor post about pricing issues - mentioned "looking for alternatives"',
    strength: 'hot',
    signalType: 'competitor_comment',
    timeAgo: '3 min ago',
    intentScore: 127,
    detectedAt: '2026-01-29T14:57:00Z',
    source: 'linkedin'
  },
  {
    id: '2',
    leadName: 'Michael Chen',
    title: 'CRO',
    company: 'SalesForce Pro',
    description: 'Posted about scaling challenges + changed job title to CRO (promotion signal)',
    strength: 'hot',
    signalType: 'job_change',
    timeAgo: '12 min ago',
    intentScore: 143,
    detectedAt: '2026-01-29T14:48:00Z',
    source: 'linkedin'
  },
  {
    id: '3',
    leadName: 'Jessica Thompson',
    title: 'Head of Growth',
    company: 'StartupCo',
    description: 'Engaged with 3 posts about AI sales automation this week',
    strength: 'warm',
    signalType: 'content_engagement',
    timeAgo: '1 hour ago',
    intentScore: 89,
    detectedAt: '2026-01-29T14:00:00Z',
    source: 'linkedin'
  },
  {
    id: '4',
    leadName: 'David Park',
    title: 'Director of Sales Ops',
    company: 'Enterprise Solutions',
    description: 'Company hiring spike: 5 new BDR roles posted in last 2 weeks',
    strength: 'hot',
    signalType: 'hiring_spike',
    timeAgo: '2 hours ago',
    intentScore: 156,
    detectedAt: '2026-01-29T13:00:00Z',
    source: 'linkedin'
  },
  {
    id: '5',
    leadName: 'Emily Rodriguez',
    title: 'VP Marketing',
    company: 'DataScale Inc',
    description: 'Downloaded competitor comparison whitepaper from industry site',
    strength: 'warm',
    signalType: 'content_download',
    timeAgo: '4 hours ago',
    intentScore: 78,
    detectedAt: '2026-01-29T11:00:00Z',
    source: 'website'
  },
  {
    id: '6',
    leadName: 'James Wilson',
    title: 'CEO',
    company: 'CloudNative Labs',
    description: 'Series B funding announced ($30M) - expansion mode detected',
    strength: 'hot',
    signalType: 'funding_round',
    timeAgo: '5 hours ago',
    intentScore: 198,
    detectedAt: '2026-01-29T10:00:00Z',
    source: 'crunchbase'
  },
  {
    id: '7',
    leadName: 'Priya Sharma',
    title: 'Sales Director',
    company: 'FinTech Innovations',
    description: 'Visited pricing page 3x + demo video watched to completion',
    strength: 'hot',
    signalType: 'website_visit',
    timeAgo: '6 hours ago',
    intentScore: 134,
    detectedAt: '2026-01-29T09:00:00Z',
    source: 'website'
  },
  {
    id: '8',
    leadName: 'Robert Kim',
    title: 'Head of RevOps',
    company: 'GrowthTech',
    description: 'Commented on LinkedIn post: "Our current stack is becoming too complex"',
    strength: 'warm',
    signalType: 'pain_point_comment',
    timeAgo: '8 hours ago',
    intentScore: 92,
    detectedAt: '2026-01-29T07:00:00Z',
    source: 'linkedin'
  },
  {
    id: '9',
    leadName: 'Amanda Foster',
    title: 'VP Customer Success',
    company: 'SaaS Dynamics',
    description: 'Shared article about improving sales efficiency - mutual connection alert',
    strength: 'warm',
    signalType: 'content_share',
    timeAgo: '10 hours ago',
    intentScore: 71,
    detectedAt: '2026-01-29T05:00:00Z',
    source: 'linkedin'
  },
  {
    id: '10',
    leadName: 'Kevin Zhang',
    title: 'Chief Revenue Officer',
    company: 'AI Platforms Inc',
    description: 'LinkedIn activity spike: 8 posts this week (up from 1/week average)',
    strength: 'cold',
    signalType: 'activity_spike',
    timeAgo: '12 hours ago',
    intentScore: 54,
    detectedAt: '2026-01-29T03:00:00Z',
    source: 'linkedin'
  },
  {
    id: '11',
    leadName: 'Lisa Anderson',
    title: 'Director of Sales',
    company: 'TechVision Corp',
    description: 'Job change alert: Started new role 30 days ago (honeymoon window)',
    strength: 'hot',
    signalType: 'job_change',
    timeAgo: '14 hours ago',
    intentScore: 112,
    detectedAt: '2026-01-29T01:00:00Z',
    source: 'linkedin'
  },
  {
    id: '12',
    leadName: 'Marcus Johnson',
    title: 'VP of Business Development',
    company: 'Scale Solutions',
    description: 'Engaged with competitor G2 review thread - replied with frustrations',
    strength: 'hot',
    signalType: 'competitor_research',
    timeAgo: '18 hours ago',
    intentScore: 167,
    detectedAt: '2026-01-28T21:00:00Z',
    source: 'g2'
  }
]

const FUNNEL_STAGES: FunnelStage[] = [
  { name: 'Signals Caught', count: 847, percentage: 100, dropoff: 28, icon: Activity },
  { name: 'Qualified by Clay', count: 612, percentage: 72, dropoff: 15, icon: Target },
  { name: 'DMs Sent', count: 523, percentage: 62, dropoff: 35, icon: MessageSquare },
  { name: 'Replies Received', count: 341, percentage: 40, dropoff: 50, icon: TrendingUp },
  { name: 'SQLs Generated', count: 680, percentage: 80, dropoff: 0, icon: Star }
]

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

function Sidebar({ currentPage, onPageChange }: { currentPage: string; onPageChange: (page: string) => void }) {
  const menuItems = [
    { id: 'mission-control', label: 'Mission Control', icon: LayoutDashboard },
    { id: 'qa-inbox', label: 'QA Inbox', icon: Inbox },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-cyan-500" />
          Lyzr Outreach
        </h1>
        <p className="text-xs text-slate-400 mt-1">Signal-to-Action Engine</p>
      </div>

      <ScrollArea className="flex-1">
        <nav className="p-3 space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onPageChange(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  currentPage === item.id
                    ? "bg-cyan-600 text-white shadow-lg shadow-cyan-500/20"
                    : "text-slate-400 hover:bg-slate-800 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </ScrollArea>

      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Activity className="h-3 w-3 text-green-500" />
          <span>27 AI Agents Active</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MISSION CONTROL DASHBOARD PAGE
// =============================================================================

function MissionControlPage() {
  const [signals, setSignals] = useState<IntentSignal[]>(MOCK_SIGNALS)
  const [processingSignal, setProcessingSignal] = useState<string | null>(null)

  const handleApproveSignal = async (signalId: string) => {
    const signal = signals.find(s => s.id === signalId)
    if (!signal) return

    setProcessingSignal(signalId)

    try {
      // Call MANAGER AGENT that orchestrates all child agents internally
      // Compound Intent Score Manager coordinates:
      // 1. LinkedIn Signal Listener Agent (signal validation)
      // 2. Clay Enrichment & Intent Agent (intent scoring)
      // 3. Day 0 Strategic Memo Agent (memo generation)
      // 4. Text-a-Friend Message Writer (message drafting)
      // 5. Style Vibe Check Agent (message validation)
      // 6. Global Time-Zone Orchestrator (delivery scheduling)

      const fullSignalContext = {
        signal_id: signal.id,
        lead_name: signal.leadName,
        company: signal.company,
        title: signal.title,
        signal_type: signal.signalType,
        signal_description: signal.description,
        signal_strength: signal.strength,
        intent_score: signal.intentScore,
        detected_at: signal.detectedAt,
        source: signal.source
      }

      const result = await callAIAgent(
        `Process signal-to-action workflow for lead: ${signal.leadName} (${signal.title}) at ${signal.company}.

Signal Details:
- Type: ${signal.signalType}
- Strength: ${signal.signalStrength}
- Description: ${signal.description}
- Intent Score: ${signal.intentScore}
- Source: ${signal.source}

MANAGER INSTRUCTIONS:
You are the Compound Intent Score Manager. Orchestrate the complete Signal-to-Action workflow:

1. Validate signal via LinkedIn Signal Listener (if applicable)
2. Enrich and score intent via Clay Enrichment Agent
3. If intent score >= 100 (hot signal), execute the following pipeline:
   a. Generate Day 0 Strategic Memo analyzing buyer context
   b. Create Text-a-Friend style message (casual, value-first)
   c. Run Style Vibe Check to ensure authenticity
   d. Schedule delivery via Global Time-Zone Orchestrator

4. Return aggregated results with:
   - Final intent score
   - Memo summary
   - Draft message
   - Style validation status
   - Scheduled delivery time

Signal Context: ${JSON.stringify(fullSignalContext, null, 2)}`,
        AGENT_IDS.COMPOUND_INTENT_SCORE_MANAGER
      )

      console.log('Signal-to-Action Workflow Result:', result)

      // Remove processed signal from list
      setSignals(prev => prev.filter(s => s.id !== signalId))
    } catch (error) {
      console.error('Signal processing error:', error)
    } finally {
      setProcessingSignal(null)
    }
  }

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      {/* THE PULSE HEADER */}
      <div className="grid grid-cols-4 gap-4">
        {/* Active Intent Scans */}
        <Card className="bg-slate-900 border-cyan-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <Activity className="h-8 w-8 text-cyan-400 animate-pulse" />
              <div className="text-right">
                <p className="text-3xl font-bold text-white">47</p>
                <p className="text-sm text-slate-400">Active Scans</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SQL Velocity - Circular Progress */}
        <Card className="bg-slate-900 border-purple-500/20">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="relative h-16 w-16">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold text-purple-400">68%</span>
                </div>
                <svg className="h-16 w-16 transform -rotate-90">
                  <circle cx="32" cy="32" r="28" stroke="rgba(168, 85, 247, 0.2)" strokeWidth="4" fill="none" />
                  <circle cx="32" cy="32" r="28" stroke="#a855f7" strokeWidth="4" fill="none" strokeDasharray="176" strokeDashoffset="56" />
                </svg>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-white">680 / 1000</p>
                <p className="text-sm text-slate-400">SQLs to Target</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Agent Health Grid */}
        <Card className="col-span-2 bg-slate-900 border-slate-700">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-white">Agent Health (27 Active)</h3>
            </div>
            <div className="grid grid-cols-9 gap-1">
              {[...Array(27)].map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-6 w-6 rounded",
                    i < 25 ? "bg-green-500" : "bg-amber-500"
                  )}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MAIN CONTENT - 3 COLUMN LAYOUT */}
      <div className="grid grid-cols-3 gap-6">
        {/* LEFT COLUMN - Intent Heatmap (Live Signal Stream) */}
        <div className="h-[600px] bg-slate-900 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center">
            <Flame className="h-5 w-5 text-red-500 mr-2" />
            Live Intent Signals
          </h2>

          <ScrollArea className="h-[520px]">
            {signals.map((signal) => (
              <Card
                key={signal.id}
                className={cn(
                  "mb-3 border-l-4 cursor-pointer hover:bg-slate-800/50 transition-all",
                  signal.strength === 'hot' ? 'border-l-red-500 bg-red-950/20' :
                  signal.strength === 'warm' ? 'border-l-orange-500 bg-orange-950/20' :
                  'border-l-blue-500 bg-blue-950/20'
                )}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center">
                      <Building className="h-4 w-4 text-slate-400 mr-2" />
                      <span className="font-semibold text-white">{signal.leadName}</span>
                      <Badge className="ml-2 text-xs bg-slate-700">{signal.title}</Badge>
                    </div>
                    <Badge variant={signal.strength === 'hot' ? 'destructive' : 'default'}>
                      {signal.strength.toUpperCase()}
                    </Badge>
                  </div>

                  <p className="text-sm text-slate-300 mb-3">{signal.description}</p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">{signal.timeAgo}</span>
                    <Button
                      size="sm"
                      className={cn(
                        "bg-red-600 hover:bg-red-700",
                        signal.strength === 'hot' && "animate-pulse"
                      )}
                      onClick={() => handleApproveSignal(signal.id)}
                      disabled={processingSignal === signal.id}
                    >
                      {processingSignal === signal.id ? (
                        <>
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Approve Memo'
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </ScrollArea>
        </div>

        {/* CENTER COLUMN - Funnel Analytics */}
        <div className="h-[600px] bg-slate-900 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-4">SQL Funnel Analytics</h2>

          <div className="space-y-4">
            {FUNNEL_STAGES.map((stage, idx) => {
              const Icon = stage.icon
              return (
                <div key={stage.name}>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Icon className="h-5 w-5 text-cyan-400 mr-2" />
                      <span className="text-white font-semibold">{stage.name}</span>
                    </div>
                    <span className="text-2xl font-bold text-white">{stage.count}</span>
                  </div>

                  <Progress value={stage.percentage} className="h-3 mb-2" />

                  {idx < FUNNEL_STAGES.length - 1 && (
                    <div className="flex items-center justify-center my-2">
                      <ChevronDown className="h-5 w-5 text-slate-500" />
                      <span className="text-sm text-red-400 ml-2">
                        {stage.dropoff}% drop-off
                      </span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Conversion Leakage Alert */}
          <Card className="mt-4 bg-red-950/20 border-red-500/30">
            <CardContent className="p-4">
              <div className="flex items-start">
                <AlertCircle className="h-5 w-5 text-red-400 mr-2 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300">Leakage Detected</p>
                  <p className="text-xs text-red-200/70">35% drop from DMs Sent to Replies. Consider Style Vibe Check.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN - Agentic Leaderboard */}
        <div className="h-[600px] bg-slate-900 border border-slate-700 rounded-lg p-4">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center">
            <Star className="h-5 w-5 text-yellow-400 mr-2" />
            Performance Insights
          </h2>

          <ScrollArea className="h-[520px]">
            {/* Top Hook */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Top Hook (Reply Rate)</h3>
              <Card className="bg-purple-950/30 border-purple-500/30">
                <CardContent className="p-4">
                  <p className="text-sm text-white mb-2">
                    "Saw your comment on [Competitor]'s post about [Topic]. We've helped companies like yours with..."
                  </p>
                  <div className="flex items-center justify-between">
                    <Badge className="bg-green-600">47% Reply Rate</Badge>
                    <span className="text-xs text-slate-400">234 sent</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Top Signal Source */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Top Signal Source</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
                  <span className="text-sm text-white">Competitor Comments</span>
                  <Badge className="bg-cyan-600">52% to SQL</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
                  <span className="text-sm text-white">Job Changes</span>
                  <Badge className="bg-blue-600">38% to SQL</Badge>
                </div>
                <div className="flex items-center justify-between p-3 bg-slate-800 rounded">
                  <span className="text-sm text-white">Hiring Spikes</span>
                  <Badge className="bg-purple-600">29% to SQL</Badge>
                </div>
              </div>
            </div>

            {/* Knowledge Graph Preview */}
            <div>
              <h3 className="text-sm font-semibold text-slate-400 mb-3">Most Connected Enterprise</h3>
              <Card className="bg-slate-800 border-slate-700 cursor-pointer hover:border-purple-500/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center">
                      <Building className="h-5 w-5 text-purple-400 mr-2" />
                      <span className="font-semibold text-white">Acme Corp</span>
                    </div>
                    <Network className="h-5 w-5 text-purple-400" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center text-xs">
                      <User className="h-3 w-3 text-slate-400 mr-2" />
                      <span className="text-slate-300">7 Decision Makers Mapped</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Users className="h-3 w-3 text-slate-400 mr-2" />
                      <span className="text-slate-300">12 Mutual Connections</span>
                    </div>
                    <div className="flex items-center text-xs">
                      <Star className="h-3 w-3 text-yellow-400 mr-2" />
                      <span className="text-slate-300">3 Champions Identified</span>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    View Graph
                  </Button>
                </CardContent>
              </Card>
            </div>
          </ScrollArea>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// QA INBOX PAGE (PLACEHOLDER)
// =============================================================================

function QAInboxPage() {
  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">QA Inbox</h2>
        <p className="text-sm text-slate-400">Review and approve AI-generated messages</p>
      </div>
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-12 text-center">
          <Inbox className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">No pending messages for review</p>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// SETTINGS PAGE (PLACEHOLDER)
// =============================================================================

function SettingsPage() {
  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-sm text-slate-400">Configure agents and integrations</p>
      </div>
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-12 text-center">
          <Settings className="h-16 w-16 text-slate-600 mx-auto mb-4" />
          <p className="text-slate-400">Settings panel coming soon</p>
        </CardContent>
      </Card>
    </div>
  )
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

export default function Home() {
  const [currentPage, setCurrentPage] = useState('mission-control')

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 overflow-auto">
        {currentPage === 'mission-control' && <MissionControlPage />}
        {currentPage === 'qa-inbox' && <QAInboxPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}
