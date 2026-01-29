import { useState, useEffect } from 'react'
import { callAIAgent, type NormalizedAgentResponse } from '@/utils/aiAgent'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Progress } from '@/components/ui/progress'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card'
import {
  LayoutDashboard,
  Users,
  Inbox,
  FileText,
  GitBranch,
  Settings,
  Plus,
  Send,
  Calendar,
  TrendingUp,
  CheckCircle,
  Clock,
  Mail,
  MessageSquare,
  Loader2,
  ArrowRight,
  Target,
  Zap,
  BarChart,
  Sparkles,
  Edit,
  Trash2,
  Download,
  Upload,
  Filter,
  Search,
  X,
  ChevronDown,
  Building,
  User,
  Globe,
  Star,
  AlertCircle,
  ExternalLink,
  Eye,
  Phone,
  Linkedin,
  Activity,
  TrendingDown,
  Database,
  Brain,
  RefreshCw,
  ArrowUpDown,
  MoreHorizontal,
  ChevronRight,
  Flame,
  Droplet,
  Snowflake,
  Beaker,
  Network,
  Layers,
  MousePointer
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// AGENT IDS - ALL 15 AGENTS
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
  MULTI_CHANNEL_ORCHESTRATOR: '697ad587bc6eb6293f550417'
}

// =============================================================================
// TYPE DEFINITIONS
// =============================================================================

interface IntentSignal {
  type: 'website_visit' | 'content_download' | 'tech_change' | 'funding' | 'hiring' | 'competitor_switch'
  strength: 'hot' | 'warm' | 'cold'
  timestamp: string
  details: string
}

interface Lead {
  id: string
  name: string
  company: string
  title: string
  email: string
  phone?: string
  linkedin?: string
  status: 'new' | 'enriched' | 'qualified' | 'contacted' | 'engaged' | 'meeting_scheduled' | 'opportunity' | 'closed'
  intent_score: number
  icp_score: number
  signals: IntentSignal[]
  last_activity: string
  channel: 'email' | 'linkedin' | 'multi-channel' | 'phone'
  next_action: string
  enrichment_data?: {
    company_size?: string
    industry?: string
    revenue?: string
    technologies?: string[]
    funding_stage?: string
    recent_news?: string[]
  }
  engagement_history?: Array<{
    date: string
    channel: string
    action: string
    result: string
  }>
}

interface Campaign {
  id: string
  name: string
  status: 'active' | 'paused' | 'completed'
  leads_count: number
  response_rate: number
}

// =============================================================================
// MOCK DATA
// =============================================================================

const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    name: 'Sarah Chen',
    company: 'TechVision Inc',
    title: 'VP of Engineering',
    email: 'sarah.chen@techvision.com',
    linkedin: 'linkedin.com/in/sarahchen',
    status: 'engaged',
    intent_score: 92,
    icp_score: 88,
    signals: [
      { type: 'website_visit', strength: 'hot', timestamp: '2h ago', details: 'Visited pricing page 5 times' },
      { type: 'content_download', strength: 'hot', timestamp: '1d ago', details: 'Downloaded ROI calculator' },
      { type: 'tech_change', strength: 'warm', timestamp: '3d ago', details: 'Migrated to AWS' }
    ],
    last_activity: '2 hours ago',
    channel: 'multi-channel',
    next_action: 'Send pricing proposal',
    enrichment_data: {
      company_size: '500-1000',
      industry: 'SaaS',
      revenue: '$50M-$100M',
      technologies: ['Salesforce', 'AWS', 'Slack', 'HubSpot'],
      funding_stage: 'Series B',
      recent_news: ['Raised $25M Series B', 'Expanded to EMEA']
    },
    engagement_history: [
      { date: '2h ago', channel: 'email', action: 'Opened', result: 'Pricing email opened 3 times' },
      { date: '1d ago', channel: 'linkedin', action: 'Engaged', result: 'Liked and commented on post' }
    ]
  },
  {
    id: '2',
    name: 'Michael Torres',
    company: 'Enterprise Solutions Corp',
    title: 'CTO',
    email: 'michael.t@enterprisesol.com',
    status: 'contacted',
    intent_score: 75,
    icp_score: 92,
    signals: [
      { type: 'hiring', strength: 'warm', timestamp: '5h ago', details: 'Hiring 3 DevOps engineers' },
      { type: 'funding', strength: 'warm', timestamp: '2d ago', details: 'Announced Series C round' }
    ],
    last_activity: '5 hours ago',
    channel: 'email',
    next_action: 'Schedule demo call',
    enrichment_data: {
      company_size: '1000-5000',
      industry: 'Enterprise Software',
      revenue: '$100M+',
      technologies: ['Azure', 'Snowflake', 'Tableau'],
      funding_stage: 'Series C'
    }
  },
  {
    id: '3',
    name: 'Emily Rodriguez',
    company: 'DataFlow Systems',
    title: 'Director of Operations',
    email: 'emily.r@dataflow.io',
    status: 'qualified',
    intent_score: 68,
    icp_score: 71,
    signals: [
      { type: 'competitor_switch', strength: 'hot', timestamp: '1d ago', details: 'Unhappy with current vendor' }
    ],
    last_activity: '1 day ago',
    channel: 'linkedin',
    next_action: 'Send case study',
    enrichment_data: {
      company_size: '200-500',
      industry: 'Data Analytics',
      technologies: ['Google Cloud', 'Looker']
    }
  },
  {
    id: '4',
    name: 'James Wilson',
    company: 'CloudScale Ltd',
    title: 'Head of IT',
    email: 'j.wilson@cloudscale.co',
    status: 'enriched',
    intent_score: 45,
    icp_score: 55,
    signals: [
      { type: 'website_visit', strength: 'cold', timestamp: '1w ago', details: 'Visited homepage once' }
    ],
    last_activity: '1 week ago',
    channel: 'email',
    next_action: 'First touchpoint email',
    enrichment_data: {
      company_size: '50-200',
      industry: 'Cloud Services'
    }
  },
  {
    id: '5',
    name: 'Priya Sharma',
    company: 'FinTech Innovations',
    title: 'Chief Product Officer',
    email: 'priya@fintechinno.com',
    status: 'meeting_scheduled',
    intent_score: 95,
    icp_score: 94,
    signals: [
      { type: 'funding', strength: 'hot', timestamp: '3h ago', details: 'Just raised $50M Series C' },
      { type: 'hiring', strength: 'hot', timestamp: '6h ago', details: 'Hiring 10+ engineers' },
      { type: 'website_visit', strength: 'hot', timestamp: '4h ago', details: 'Viewed demo video 3 times' }
    ],
    last_activity: '3 hours ago',
    channel: 'multi-channel',
    next_action: 'Demo call scheduled tomorrow',
    enrichment_data: {
      company_size: '200-500',
      industry: 'FinTech',
      revenue: '$20M-$50M',
      technologies: ['Stripe', 'Plaid', 'AWS'],
      funding_stage: 'Series C',
      recent_news: ['Raised $50M Series C led by Sequoia', 'Launched new payment product']
    }
  }
]

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getIntentColor(score: number): string {
  if (score >= 80) return 'text-red-500'
  if (score >= 60) return 'text-orange-500'
  if (score >= 40) return 'text-yellow-500'
  return 'text-blue-500'
}

function getIntentBg(score: number): string {
  if (score >= 80) return 'bg-red-500/10 border-red-500/20'
  if (score >= 60) return 'bg-orange-500/10 border-orange-500/20'
  if (score >= 40) return 'bg-yellow-500/10 border-yellow-500/20'
  return 'bg-blue-500/10 border-blue-500/20'
}

function getSignalIcon(type: string) {
  switch (type) {
    case 'website_visit': return Eye
    case 'content_download': return Download
    case 'tech_change': return Database
    case 'funding': return TrendingUp
    case 'hiring': return Users
    case 'competitor_switch': return RefreshCw
    default: return Activity
  }
}

function getSignalColor(strength: string): string {
  switch (strength) {
    case 'hot': return 'text-red-500'
    case 'warm': return 'text-orange-500'
    case 'cold': return 'text-blue-500'
    default: return 'text-gray-500'
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'new': return 'bg-gray-500'
    case 'enriched': return 'bg-blue-500'
    case 'qualified': return 'bg-cyan-500'
    case 'contacted': return 'bg-yellow-500'
    case 'engaged': return 'bg-orange-500'
    case 'meeting_scheduled': return 'bg-purple-500'
    case 'opportunity': return 'bg-green-500'
    case 'closed': return 'bg-emerald-500'
    default: return 'bg-gray-500'
  }
}

// =============================================================================
// SIDEBAR COMPONENT
// =============================================================================

function Sidebar({ currentPage, onPageChange }: { currentPage: string; onPageChange: (page: string) => void }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { id: 'enrichment', label: 'Enrichment Lab', icon: Beaker },
    { id: 'outreach', label: 'Outreach Center', icon: Send },
    { id: 'research', label: 'Research Hub', icon: Brain },
    { id: 'qa-inbox', label: 'QA Inbox', icon: Inbox },
    { id: 'content', label: 'Content Studio', icon: Sparkles },
    { id: 'settings', label: 'Settings', icon: Settings }
  ]

  return (
    <div className="w-64 bg-slate-950 border-r border-slate-800 h-screen flex flex-col">
      <div className="p-6 border-b border-slate-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-purple-500" />
          Lyzr Outreach
        </h1>
        <p className="text-xs text-slate-400 mt-1">AI-Powered ABM Platform</p>
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
                    ? "bg-purple-600 text-white shadow-lg shadow-purple-500/20"
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
          <Activity className="h-3 w-3" />
          <span>15 AI Agents Active</span>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// DASHBOARD PAGE
// =============================================================================

function DashboardPage() {
  const metrics = [
    { label: 'MQLs This Month', value: '147', change: '+12%', trend: 'up', icon: Users },
    { label: 'SQLs Generated', value: '89', change: '+8%', trend: 'up', icon: Target },
    { label: 'Intent Signals Detected', value: '234', change: '+23%', trend: 'up', icon: Activity },
    { label: 'Meetings Booked', value: '23', change: '+15%', trend: 'up', icon: Calendar }
  ]

  const highIntentLeads = MOCK_LEADS.filter(l => l.intent_score >= 80).slice(0, 5)

  return (
    <div className="p-6 space-y-6 bg-slate-950 min-h-screen">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Command Center</h2>
        <p className="text-sm text-slate-400">Real-time insights across all channels</p>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="bg-slate-900 border-slate-800 hover:border-purple-500/50 transition-all hover:shadow-lg hover:shadow-purple-500/10">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Icon className="h-4 w-4 text-purple-500" />
                  </div>
                  <TrendingUp className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-2xl font-bold text-white mb-1">{metric.value}</div>
                <p className="text-xs text-slate-400 mb-1">{metric.label}</p>
                <p className="text-xs text-green-500">{metric.change} vs last month</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* High-Intent Leads */}
        <div className="col-span-2">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Flame className="h-5 w-5 text-red-500" />
                    High-Intent Leads
                  </CardTitle>
                  <CardDescription className="text-slate-400">Leads showing strong buying signals</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-purple-400 hover:text-purple-300">
                  View All
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {highIntentLeads.map((lead) => (
                  <div key={lead.id} className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800 hover:border-purple-500/50 transition-all cursor-pointer">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-white">{lead.name}</p>
                        <Badge className={cn("text-xs", getStatusColor(lead.status))}>{lead.status}</Badge>
                      </div>
                      <p className="text-xs text-slate-400">{lead.title} at {lead.company}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-right mr-2">
                        <p className={cn("text-sm font-bold", getIntentColor(lead.intent_score))}>{lead.intent_score}</p>
                        <p className="text-xs text-slate-500">intent</p>
                      </div>
                      <div className="flex gap-1">
                        {lead.signals.slice(0, 3).map((signal, idx) => {
                          const Icon = getSignalIcon(signal.type)
                          return (
                            <div key={idx} className={cn("p-1 rounded", signal.strength === 'hot' ? 'bg-red-500/20' : signal.strength === 'warm' ? 'bg-orange-500/20' : 'bg-blue-500/20')}>
                              <Icon className={cn("h-3 w-3", getSignalColor(signal.strength))} />
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Insights */}
        <div>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Brain className="h-5 w-5 text-cyan-500" />
                AI Insights
              </CardTitle>
              <CardDescription className="text-slate-400">Strategic recommendations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-purple-400 mt-0.5" />
                    <p className="text-xs font-medium text-purple-300">Claude Strategic</p>
                  </div>
                  <p className="text-xs text-slate-300">Focus on FinTech vertical - 3 high-intent leads with recent funding</p>
                </div>
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <TrendingUp className="h-4 w-4 text-cyan-400 mt-0.5" />
                    <p className="text-xs font-medium text-cyan-300">Gemini Market</p>
                  </div>
                  <p className="text-xs text-slate-300">Enterprise SaaS segment shows 45% higher engagement</p>
                </div>
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-start gap-2 mb-2">
                    <Activity className="h-4 w-4 text-orange-400 mt-0.5" />
                    <p className="text-xs font-medium text-orange-300">Intent Pattern</p>
                  </div>
                  <p className="text-xs text-slate-300">Content downloads spike on Tuesdays 10-11 AM</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Multi-Channel Activity Feed */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Network className="h-5 w-5 text-purple-500" />
            Multi-Channel Activity Feed
          </CardTitle>
          <CardDescription className="text-slate-400">Recent engagement across all channels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <ActivityItem
              icon={Mail}
              color="text-blue-500"
              title="Email opened"
              lead="Sarah Chen - TechVision Inc"
              time="2 min ago"
            />
            <ActivityItem
              icon={Linkedin}
              color="text-cyan-500"
              title="LinkedIn engagement"
              lead="Michael Torres liked your post"
              time="15 min ago"
            />
            <ActivityItem
              icon={Calendar}
              color="text-green-500"
              title="Meeting scheduled"
              lead="Priya Sharma - FinTech Innovations"
              time="1 hour ago"
            />
            <ActivityItem
              icon={Download}
              color="text-purple-500"
              title="Content downloaded"
              lead="Sarah Chen downloaded ROI Calculator"
              time="2 hours ago"
            />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function ActivityItem({ icon: Icon, color, title, lead, time }: { icon: any, color: string, title: string, lead: string, time: string }) {
  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-slate-800/50 transition-colors">
      <div className={cn("p-2 rounded-lg bg-slate-800")}>
        <Icon className={cn("h-4 w-4", color)} />
      </div>
      <div className="flex-1">
        <p className="text-sm text-white">{title}</p>
        <p className="text-xs text-slate-400">{lead}</p>
      </div>
      <p className="text-xs text-slate-500">{time}</p>
    </div>
  )
}

// =============================================================================
// PIPELINE PAGE - TABULAR FORMAT (CRITICAL!)
// =============================================================================

function PipelinePage() {
  const [leads, setLeads] = useState<Lead[]>(MOCK_LEADS)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [detailPanelOpen, setDetailPanelOpen] = useState(false)
  const [sortField, setSortField] = useState<string>('intent_score')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [filterStatus, setFilterStatus] = useState<string>('all')
  const [filterChannel, setFilterChannel] = useState<string>('all')
  const [signalModalOpen, setSignalModalOpen] = useState(false)
  const [selectedSignals, setSelectedSignals] = useState<IntentSignal[]>([])

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('desc')
    }
  }

  const sortedLeads = [...leads].sort((a, b) => {
    let aVal = a[sortField as keyof Lead]
    let bVal = b[sortField as keyof Lead]

    if (sortField === 'intent_score' || sortField === 'icp_score') {
      aVal = Number(aVal)
      bVal = Number(bVal)
    }

    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredLeads = sortedLeads.filter(lead => {
    if (filterStatus !== 'all' && lead.status !== filterStatus) return false
    if (filterChannel !== 'all' && lead.channel !== filterChannel) return false
    return true
  })

  const openSignalModal = (signals: IntentSignal[]) => {
    setSelectedSignals(signals)
    setSignalModalOpen(true)
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Pipeline</h2>
        <p className="text-sm text-slate-400">Tabular view with interactive hover and click-through details</p>
      </div>

      {/* Filters */}
      <Card className="bg-slate-900 border-slate-800 mb-4">
        <CardContent className="pt-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-400">Filters:</span>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px] bg-slate-950 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="enriched">Enriched</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="engaged">Engaged</SelectItem>
                <SelectItem value="meeting_scheduled">Meeting Scheduled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterChannel} onValueChange={setFilterChannel}>
              <SelectTrigger className="w-[180px] bg-slate-950 border-slate-700 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 border-slate-700">
                <SelectItem value="all">All Channels</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="linkedin">LinkedIn</SelectItem>
                <SelectItem value="multi-channel">Multi-Channel</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
              </SelectContent>
            </Select>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="outline" size="sm" className="border-slate-700 text-slate-300">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabular Pipeline */}
      <Card className="bg-slate-900 border-slate-800">
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-slate-800 hover:bg-slate-900">
                  <TableHead className="text-slate-400">
                    <button onClick={() => handleSort('status')} className="flex items-center gap-1 hover:text-white">
                      Status
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-slate-400">
                    <button onClick={() => handleSort('name')} className="flex items-center gap-1 hover:text-white">
                      Lead / Company
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-slate-400">Contact</TableHead>
                  <TableHead className="text-slate-400">
                    <button onClick={() => handleSort('intent_score')} className="flex items-center gap-1 hover:text-white">
                      Intent Score
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-slate-400">Signals</TableHead>
                  <TableHead className="text-slate-400">
                    <button onClick={() => handleSort('icp_score')} className="flex items-center gap-1 hover:text-white">
                      ICP Score
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-slate-400">
                    <button onClick={() => handleSort('last_activity')} className="flex items-center gap-1 hover:text-white">
                      Last Activity
                      <ArrowUpDown className="h-3 w-3" />
                    </button>
                  </TableHead>
                  <TableHead className="text-slate-400">Channel</TableHead>
                  <TableHead className="text-slate-400">Next Action</TableHead>
                  <TableHead className="text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLeads.map((lead) => (
                  <HoverCard key={lead.id} openDelay={200}>
                    <HoverCardTrigger asChild>
                      <TableRow
                        className="border-slate-800 hover:bg-slate-800/50 cursor-pointer transition-all hover:border-l-4 hover:border-l-purple-500"
                        onClick={() => {
                          setSelectedLead(lead)
                          setDetailPanelOpen(true)
                        }}
                      >
                        <TableCell>
                          <Badge className={cn("text-xs", getStatusColor(lead.status))}>
                            {lead.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="text-sm font-medium text-white">{lead.name}</p>
                            <p className="text-xs text-slate-400">{lead.company}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-400">
                            <p>{lead.title}</p>
                            <p className="text-slate-500">{lead.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className={cn("text-sm font-bold", getIntentColor(lead.intent_score))}>
                            {lead.intent_score}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {lead.signals.slice(0, 3).map((signal, idx) => {
                              const Icon = getSignalIcon(signal.type)
                              return (
                                <button
                                  key={idx}
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    openSignalModal(lead.signals)
                                  }}
                                  className={cn(
                                    "p-1.5 rounded border transition-all hover:scale-110",
                                    signal.strength === 'hot' ? 'bg-red-500/20 border-red-500/40 hover:bg-red-500/30' :
                                    signal.strength === 'warm' ? 'bg-orange-500/20 border-orange-500/40 hover:bg-orange-500/30' :
                                    'bg-blue-500/20 border-blue-500/40 hover:bg-blue-500/30'
                                  )}
                                >
                                  <Icon className={cn("h-3 w-3", getSignalColor(signal.strength))} />
                                </button>
                              )
                            })}
                            {lead.signals.length > 3 && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  openSignalModal(lead.signals)
                                }}
                                className="px-1.5 py-1 text-xs text-slate-400 hover:text-white"
                              >
                                +{lead.signals.length - 3}
                              </button>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium text-white">{lead.icp_score}</div>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-400">{lead.last_activity}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs border-slate-600">
                            {lead.channel}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-xs text-slate-400">{lead.next_action}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Send email to', lead.email)
                              }}
                            >
                              <Mail className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={(e) => {
                                e.stopPropagation()
                                console.log('Schedule meeting with', lead.name)
                              }}
                            >
                              <Calendar className="h-3 w-3" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    </HoverCardTrigger>
                    <HoverCardContent side="right" className="w-80 bg-slate-900 border-slate-700">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="text-sm font-semibold text-white">{lead.name}</h4>
                          <Badge className={cn("text-xs", getStatusColor(lead.status))}>{lead.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-400">{lead.title} at {lead.company}</p>
                        <Separator className="bg-slate-700" />
                        {lead.enrichment_data && (
                          <div className="space-y-1">
                            <p className="text-xs text-slate-500">Company Size: {lead.enrichment_data.company_size}</p>
                            <p className="text-xs text-slate-500">Industry: {lead.enrichment_data.industry}</p>
                            {lead.enrichment_data.revenue && (
                              <p className="text-xs text-slate-500">Revenue: {lead.enrichment_data.revenue}</p>
                            )}
                            {lead.enrichment_data.technologies && (
                              <div className="flex flex-wrap gap-1 mt-2">
                                {lead.enrichment_data.technologies.slice(0, 4).map((tech, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs border-slate-600">{tech}</Badge>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="pt-2">
                          <p className="text-xs text-purple-400 flex items-center gap-1">
                            <MousePointer className="h-3 w-3" />
                            Click row for full details
                          </p>
                        </div>
                      </div>
                    </HoverCardContent>
                  </HoverCard>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Lead Detail Slide-Out Panel */}
      <Sheet open={detailPanelOpen} onOpenChange={setDetailPanelOpen}>
        <SheetContent side="right" className="w-[600px] bg-slate-900 border-slate-800 overflow-y-auto">
          {selectedLead && (
            <>
              <SheetHeader>
                <SheetTitle className="text-white text-xl">{selectedLead.name}</SheetTitle>
                <SheetDescription className="text-slate-400">
                  {selectedLead.title} at {selectedLead.company}
                </SheetDescription>
              </SheetHeader>

              <div className="mt-6 space-y-6">
                {/* Scores */}
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-slate-950 border-slate-800">
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-400 mb-1">Intent Score</p>
                      <p className={cn("text-3xl font-bold", getIntentColor(selectedLead.intent_score))}>
                        {selectedLead.intent_score}
                      </p>
                    </CardContent>
                  </Card>
                  <Card className="bg-slate-950 border-slate-800">
                    <CardContent className="pt-4">
                      <p className="text-xs text-slate-400 mb-1">ICP Score</p>
                      <p className="text-3xl font-bold text-white">{selectedLead.icp_score}</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Contact Info */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-slate-400" />
                      <span className="text-slate-300">{selectedLead.email}</span>
                    </div>
                    {selectedLead.phone && (
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300">{selectedLead.phone}</span>
                      </div>
                    )}
                    {selectedLead.linkedin && (
                      <div className="flex items-center gap-2 text-sm">
                        <Linkedin className="h-4 w-4 text-slate-400" />
                        <span className="text-slate-300">{selectedLead.linkedin}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Intent Signals Timeline */}
                <div>
                  <h4 className="text-sm font-semibold text-white mb-3">Intent Signals</h4>
                  <div className="space-y-2">
                    {selectedLead.signals.map((signal, idx) => {
                      const Icon = getSignalIcon(signal.type)
                      return (
                        <div key={idx} className={cn("p-3 rounded-lg border", getIntentBg(signal.strength === 'hot' ? 90 : signal.strength === 'warm' ? 60 : 40))}>
                          <div className="flex items-start gap-3">
                            <Icon className={cn("h-4 w-4 mt-0.5", getSignalColor(signal.strength))} />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-white capitalize">{signal.type.replace('_', ' ')}</p>
                              <p className="text-xs text-slate-400 mt-1">{signal.details}</p>
                              <p className="text-xs text-slate-500 mt-1">{signal.timestamp}</p>
                            </div>
                            <Badge className={cn("text-xs", signal.strength === 'hot' ? 'bg-red-500' : signal.strength === 'warm' ? 'bg-orange-500' : 'bg-blue-500')}>
                              {signal.strength}
                            </Badge>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Enrichment Data */}
                {selectedLead.enrichment_data && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Clay Enrichment Data</h4>
                    <Card className="bg-slate-950 border-slate-800">
                      <CardContent className="pt-4 space-y-3">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-xs text-slate-500">Company Size</p>
                            <p className="text-sm text-white">{selectedLead.enrichment_data.company_size}</p>
                          </div>
                          <div>
                            <p className="text-xs text-slate-500">Industry</p>
                            <p className="text-sm text-white">{selectedLead.enrichment_data.industry}</p>
                          </div>
                          {selectedLead.enrichment_data.revenue && (
                            <div>
                              <p className="text-xs text-slate-500">Revenue</p>
                              <p className="text-sm text-white">{selectedLead.enrichment_data.revenue}</p>
                            </div>
                          )}
                          {selectedLead.enrichment_data.funding_stage && (
                            <div>
                              <p className="text-xs text-slate-500">Funding Stage</p>
                              <p className="text-sm text-white">{selectedLead.enrichment_data.funding_stage}</p>
                            </div>
                          )}
                        </div>
                        {selectedLead.enrichment_data.technologies && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Tech Stack</p>
                            <div className="flex flex-wrap gap-1">
                              {selectedLead.enrichment_data.technologies.map((tech, idx) => (
                                <Badge key={idx} variant="outline" className="text-xs border-slate-600">{tech}</Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {selectedLead.enrichment_data.recent_news && (
                          <div>
                            <p className="text-xs text-slate-500 mb-2">Recent News</p>
                            <ul className="space-y-1">
                              {selectedLead.enrichment_data.recent_news.map((news, idx) => (
                                <li key={idx} className="text-xs text-slate-400 flex items-start gap-2">
                                  <TrendingUp className="h-3 w-3 mt-0.5 text-green-500" />
                                  {news}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                )}

                {/* Engagement History */}
                {selectedLead.engagement_history && (
                  <div>
                    <h4 className="text-sm font-semibold text-white mb-3">Activity Timeline</h4>
                    <div className="space-y-2">
                      {selectedLead.engagement_history.map((activity, idx) => (
                        <div key={idx} className="flex items-start gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
                          <div className="p-2 bg-slate-800 rounded">
                            {activity.channel === 'email' ? <Mail className="h-3 w-3 text-blue-500" /> : <Linkedin className="h-3 w-3 text-cyan-500" />}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm text-white">{activity.action}</p>
                            <p className="text-xs text-slate-400 mt-1">{activity.result}</p>
                            <p className="text-xs text-slate-500 mt-1">{activity.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-3">
                  <Button className="bg-purple-600 hover:bg-purple-700">
                    <Send className="h-4 w-4 mr-2" />
                    Send Email
                  </Button>
                  <Button variant="outline" className="border-slate-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    Schedule Meeting
                  </Button>
                  <Button variant="outline" className="border-slate-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Add Note
                  </Button>
                  <Button variant="outline" className="border-slate-700">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Change Status
                  </Button>
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      {/* Intent Signal Detail Modal */}
      <Dialog open={signalModalOpen} onOpenChange={setSignalModalOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Intent Signals Detail</DialogTitle>
            <DialogDescription className="text-slate-400">
              All detected buying signals for this lead
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {selectedSignals.map((signal, idx) => {
              const Icon = getSignalIcon(signal.type)
              return (
                <div key={idx} className={cn("p-4 rounded-lg border", getIntentBg(signal.strength === 'hot' ? 90 : signal.strength === 'warm' ? 60 : 40))}>
                  <div className="flex items-start gap-3">
                    <Icon className={cn("h-5 w-5 mt-0.5", getSignalColor(signal.strength))} />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm font-medium text-white capitalize">{signal.type.replace('_', ' ')}</p>
                        <Badge className={cn("text-xs", signal.strength === 'hot' ? 'bg-red-500' : signal.strength === 'warm' ? 'bg-orange-500' : 'bg-blue-500')}>
                          {signal.strength}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-300 mb-2">{signal.details}</p>
                      <p className="text-xs text-slate-500">{signal.timestamp}</p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// ENRICHMENT LAB PAGE
// =============================================================================

function EnrichmentLabPage() {
  const [enriching, setEnriching] = useState(false)
  const [activeTab, setActiveTab] = useState('clay')

  const handleClayEnrichment = async () => {
    setEnriching(true)
    try {
      const result = await callAIAgent(
        'Enrich lead data with firmographics and intent signals for sarah.chen@techvision.com',
        AGENT_IDS.CLAY_ENRICHMENT_INTENT
      )
      console.log('Clay enrichment result:', result)
    } catch (error) {
      console.error('Enrichment error:', error)
    } finally {
      setEnriching(false)
    }
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Enrichment Lab</h2>
        <p className="text-sm text-slate-400">Centralized data enrichment and intent detection hub</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="clay" className="data-[state=active]:bg-purple-600">Clay Enrichment</TabsTrigger>
          <TabsTrigger value="linkedin" className="data-[state=active]:bg-purple-600">LinkedIn Intel</TabsTrigger>
          <TabsTrigger value="intent" className="data-[state=active]:bg-purple-600">Intent Detection</TabsTrigger>
          <TabsTrigger value="queue" className="data-[state=active]:bg-purple-600">Enrichment Queue</TabsTrigger>
        </TabsList>

        <TabsContent value="clay" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Configuration</CardTitle>
                <CardDescription className="text-slate-400">Upload CSV and select fields to enrich</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Upload CSV</Label>
                  <div className="mt-2 border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-purple-500/50 transition-all cursor-pointer">
                    <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
                    <p className="text-sm text-slate-400">Drop CSV file or click to browse</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Enrichment Fields</Label>
                  <div className="mt-2 space-y-2">
                    {['Company Size', 'Industry', 'Technologies', 'Funding Stage', 'Recent News'].map((field) => (
                      <label key={field} className="flex items-center gap-2 text-sm text-slate-300">
                        <Checkbox defaultChecked className="border-slate-600" />
                        {field}
                      </label>
                    ))}
                  </div>
                </div>
                <Button
                  onClick={handleClayEnrichment}
                  disabled={enriching}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {enriching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Enriching...
                    </>
                  ) : (
                    <>
                      <Beaker className="h-4 w-4 mr-2" />
                      Start Enrichment
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Results Preview</CardTitle>
                <CardDescription className="text-slate-400">Enriched data will appear here</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-slate-500 py-12">
                  <Database className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No enrichment results yet</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="linkedin" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">LinkedIn Sales Navigator Search</CardTitle>
              <CardDescription className="text-slate-400">Search and enrich leads from LinkedIn</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Job Title</Label>
                  <Input placeholder="e.g., VP Engineering" className="mt-1 bg-slate-950 border-slate-700 text-white" />
                </div>
                <div>
                  <Label className="text-slate-300">Company Size</Label>
                  <Select>
                    <SelectTrigger className="mt-1 bg-slate-950 border-slate-700 text-white">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="1-50">1-50</SelectItem>
                      <SelectItem value="51-200">51-200</SelectItem>
                      <SelectItem value="201-500">201-500</SelectItem>
                      <SelectItem value="501-1000">501-1000</SelectItem>
                      <SelectItem value="1000+">1000+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button className="bg-cyan-600 hover:bg-cyan-700">
                <Search className="h-4 w-4 mr-2" />
                Search LinkedIn
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intent" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Real-Time Intent Monitoring</CardTitle>
              <CardDescription className="text-slate-400">Active intent signals across all leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_LEADS.filter(l => l.signals.length > 0).map((lead) => (
                  <div key={lead.id} className="p-4 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="text-sm font-medium text-white">{lead.name}</p>
                        <p className="text-xs text-slate-400">{lead.company}</p>
                      </div>
                      <div className={cn("text-sm font-bold", getIntentColor(lead.intent_score))}>
                        {lead.intent_score} intent
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {lead.signals.map((signal, idx) => {
                        const Icon = getSignalIcon(signal.type)
                        return (
                          <div key={idx} className={cn("flex items-center gap-2 px-2 py-1 rounded text-xs border", getIntentBg(signal.strength === 'hot' ? 90 : signal.strength === 'warm' ? 60 : 40))}>
                            <Icon className={cn("h-3 w-3", getSignalColor(signal.strength))} />
                            <span className="text-slate-300">{signal.type.replace('_', ' ')}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="queue" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Enrichment Queue</CardTitle>
              <CardDescription className="text-slate-400">Pending and completed enrichment jobs</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <EnrichmentQueueItem status="completed" name="techvision_leads.csv" count={147} />
                <EnrichmentQueueItem status="processing" name="enterprise_prospects.csv" count={89} progress={67} />
                <EnrichmentQueueItem status="pending" name="fintech_targets.csv" count={234} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function EnrichmentQueueItem({ status, name, count, progress }: { status: string, name: string, count: number, progress?: number }) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
      <div className={cn("p-2 rounded", status === 'completed' ? 'bg-green-500/20' : status === 'processing' ? 'bg-purple-500/20' : 'bg-slate-800')}>
        {status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-500" /> :
         status === 'processing' ? <Loader2 className="h-4 w-4 text-purple-500 animate-spin" /> :
         <Clock className="h-4 w-4 text-slate-500" />}
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{name}</p>
        <p className="text-xs text-slate-400">{count} leads</p>
        {status === 'processing' && progress && (
          <Progress value={progress} className="h-1 mt-2" />
        )}
      </div>
      <Badge className={cn("text-xs", status === 'completed' ? 'bg-green-500' : status === 'processing' ? 'bg-purple-500' : 'bg-slate-600')}>
        {status}
      </Badge>
    </div>
  )
}

// =============================================================================
// OUTREACH CENTER PAGE
// =============================================================================

function OutreachCenterPage() {
  const [activeTab, setActiveTab] = useState('email')
  const [generating, setGenerating] = useState(false)

  const handleGenerateEmail = async () => {
    setGenerating(true)
    try {
      const result = await callAIAgent(
        'Generate personalized email for enterprise software campaign targeting VPs of Engineering',
        AGENT_IDS.MESSAGE_GENERATION
      )
      console.log('Email generated:', result)
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Outreach Center</h2>
        <p className="text-sm text-slate-400">Multi-channel orchestration hub</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="email" className="data-[state=active]:bg-purple-600">Email Campaigns</TabsTrigger>
          <TabsTrigger value="linkedin" className="data-[state=active]:bg-purple-600">LinkedIn Outreach</TabsTrigger>
          <TabsTrigger value="multi" className="data-[state=active]:bg-purple-600">Multi-Channel Sequences</TabsTrigger>
        </TabsList>

        <TabsContent value="email" className="mt-6">
          <div className="grid grid-cols-3 gap-6">
            <div className="col-span-2">
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white">Email Campaign Builder</CardTitle>
                  <CardDescription className="text-slate-400">Create and manage email sequences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-slate-300">Campaign Name</Label>
                    <Input placeholder="e.g., Enterprise Q1 Outreach" className="mt-1 bg-slate-950 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-300">Subject Line</Label>
                    <Input placeholder="Enter subject line" className="mt-1 bg-slate-950 border-slate-700 text-white" />
                  </div>
                  <div>
                    <Label className="text-slate-300">Email Body</Label>
                    <Textarea
                      placeholder="Write your email or click Generate to use AI"
                      className="mt-1 min-h-[200px] bg-slate-950 border-slate-700 text-white"
                    />
                  </div>
                  <div className="flex gap-3">
                    <Button
                      onClick={handleGenerateEmail}
                      disabled={generating}
                      className="bg-purple-600 hover:bg-purple-700"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate with AI
                        </>
                      )}
                    </Button>
                    <Button variant="outline" className="border-slate-700">
                      <Eye className="h-4 w-4 mr-2" />
                      Preview
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div>
              <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Send via</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 justify-start">
                    <Mail className="h-4 w-4 mr-2" />
                    Gmail
                  </Button>
                  <Button className="w-full bg-cyan-600 hover:bg-cyan-700 justify-start">
                    <Send className="h-4 w-4 mr-2" />
                    Instantly
                  </Button>
                  <Separator className="bg-slate-700" />
                  <div className="space-y-2">
                    <p className="text-xs text-slate-400">Deliverability Score</p>
                    <div className="flex items-center gap-2">
                      <Progress value={87} className="flex-1" />
                      <span className="text-xs font-medium text-white">87%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="linkedin" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">LinkedIn Outreach</CardTitle>
              <CardDescription className="text-slate-400">Sales Navigator and engagement tracking</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-slate-300">Connection Request Message</Label>
                <Textarea
                  placeholder="Personalized connection request message"
                  className="mt-1 bg-slate-950 border-slate-700 text-white"
                />
              </div>
              <div className="flex gap-3">
                <Button className="bg-cyan-600 hover:bg-cyan-700">
                  <Linkedin className="h-4 w-4 mr-2" />
                  Send Connection Requests
                </Button>
                <Button variant="outline" className="border-slate-700">
                  <Activity className="h-4 w-4 mr-2" />
                  Track Engagement
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Multi-Channel Sequence Builder</CardTitle>
              <CardDescription className="text-slate-400">Orchestrate email + LinkedIn + phone sequences</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <SequenceStep step={1} channel="email" action="Initial outreach email" delay="Day 0" />
                <SequenceStep step={2} channel="linkedin" action="LinkedIn connection request" delay="Day 2" />
                <SequenceStep step={3} channel="email" action="Follow-up email" delay="Day 5" />
                <SequenceStep step={4} channel="linkedin" action="Engage with post" delay="Day 7" />
                <SequenceStep step={5} channel="email" action="Case study share" delay="Day 10" />
              </div>
              <div className="mt-4 flex gap-3">
                <Button className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Step
                </Button>
                <Button variant="outline" className="border-slate-700">
                  <Send className="h-4 w-4 mr-2" />
                  Launch Sequence
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function SequenceStep({ step, channel, action, delay }: { step: number, channel: string, action: string, delay: string }) {
  const channelIcon = channel === 'email' ? Mail : channel === 'linkedin' ? Linkedin : Phone
  const Icon = channelIcon
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-950 rounded-lg border border-slate-800">
      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/20 text-purple-400 text-sm font-bold">
        {step}
      </div>
      <Icon className={cn("h-4 w-4", channel === 'email' ? 'text-blue-500' : channel === 'linkedin' ? 'text-cyan-500' : 'text-green-500')} />
      <div className="flex-1">
        <p className="text-sm font-medium text-white">{action}</p>
        <p className="text-xs text-slate-400">{delay}</p>
      </div>
      <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  )
}

// =============================================================================
// RESEARCH HUB PAGE
// =============================================================================

function ResearchHubPage() {
  const [researching, setResearching] = useState(false)
  const [selectedAccount, setSelectedAccount] = useState<string>('TechVision Inc')

  const handleGensparkResearch = async () => {
    setResearching(true)
    try {
      const result = await callAIAgent(
        'Research TechVision Inc for competitive intelligence and recent developments',
        AGENT_IDS.GENSPARK_RESEARCH
      )
      console.log('Genspark research:', result)
    } catch (error) {
      console.error('Research error:', error)
    } finally {
      setResearching(false)
    }
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Research Hub</h2>
        <p className="text-sm text-slate-400">AI-powered account intelligence</p>
      </div>

      <div className="grid grid-cols-4 gap-6">
        {/* Account Search/Select */}
        <div>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm">Accounts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['TechVision Inc', 'Enterprise Solutions', 'DataFlow Systems', 'FinTech Innovations'].map((account) => (
                  <button
                    key={account}
                    onClick={() => setSelectedAccount(account)}
                    className={cn(
                      "w-full p-2 rounded text-left text-sm transition-all",
                      selectedAccount === account ? 'bg-purple-600 text-white' : 'bg-slate-950 text-slate-300 hover:bg-slate-800'
                    )}
                  >
                    {account}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Research Dashboard */}
        <div className="col-span-2">
          <div className="space-y-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{selectedAccount}</CardTitle>
                    <CardDescription className="text-slate-400">Account research dashboard</CardDescription>
                  </div>
                  <Button
                    onClick={handleGensparkResearch}
                    disabled={researching}
                    size="sm"
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    {researching ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Researching...
                      </>
                    ) : (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="genspark">
                  <TabsList className="bg-slate-950 border-slate-800">
                    <TabsTrigger value="genspark" className="data-[state=active]:bg-purple-600">Genspark Intel</TabsTrigger>
                    <TabsTrigger value="claude" className="data-[state=active]:bg-purple-600">Claude Strategy</TabsTrigger>
                    <TabsTrigger value="gemini" className="data-[state=active]:bg-purple-600">Gemini Insights</TabsTrigger>
                  </TabsList>
                  <TabsContent value="genspark" className="mt-4">
                    <div className="space-y-3">
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Company Overview</p>
                        <p className="text-sm text-slate-300">SaaS platform focused on enterprise workflow automation. 500-1000 employees, Series B funded.</p>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Key Competitors</p>
                        <div className="flex flex-wrap gap-1">
                          {['Competitor A', 'Competitor B', 'Competitor C'].map((comp) => (
                            <Badge key={comp} variant="outline" className="text-xs border-slate-600">{comp}</Badge>
                          ))}
                        </div>
                      </div>
                      <Separator className="bg-slate-700" />
                      <div>
                        <p className="text-xs text-slate-400 mb-2">Recent Developments</p>
                        <ul className="space-y-1">
                          <li className="text-xs text-slate-300 flex items-start gap-2">
                            <TrendingUp className="h-3 w-3 text-green-500 mt-0.5" />
                            Raised $25M Series B funding
                          </li>
                          <li className="text-xs text-slate-300 flex items-start gap-2">
                            <Globe className="h-3 w-3 text-blue-500 mt-0.5" />
                            Expanded to EMEA region
                          </li>
                        </ul>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="claude" className="mt-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                        <p className="text-xs font-medium text-purple-300 mb-1">Account Strategy</p>
                        <p className="text-sm text-slate-300">Focus on their recent expansion into EMEA. They likely need scalable infrastructure solutions.</p>
                      </div>
                      <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                        <p className="text-xs font-medium text-cyan-300 mb-1">Objection Handling</p>
                        <p className="text-sm text-slate-300">May have existing vendor relationships. Emphasize integration capabilities and migration support.</p>
                      </div>
                    </div>
                  </TabsContent>
                  <TabsContent value="gemini" className="mt-4">
                    <div className="space-y-3">
                      <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                        <p className="text-xs font-medium text-orange-300 mb-1">Market Trends</p>
                        <p className="text-sm text-slate-300">Enterprise SaaS market growing 23% YoY. Automation demand increasing post-pandemic.</p>
                      </div>
                      <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                        <p className="text-xs font-medium text-green-300 mb-1">Opportunity Assessment</p>
                        <p className="text-sm text-slate-300">High - Perfect timing with their expansion phase and new funding round.</p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* AI Insights Sidebar */}
        <div>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white text-sm flex items-center gap-2">
                <Brain className="h-4 w-4 text-cyan-500" />
                AI Insights
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg">
                  <p className="text-xs font-medium text-purple-300 mb-1">Claude</p>
                  <p className="text-xs text-slate-300">High buying intent detected. Schedule demo within 48 hours.</p>
                </div>
                <div className="p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
                  <p className="text-xs font-medium text-cyan-300 mb-1">Gemini</p>
                  <p className="text-xs text-slate-300">Similar companies converted at 34% rate with case study approach.</p>
                </div>
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <p className="text-xs font-medium text-orange-300 mb-1">Genspark</p>
                  <p className="text-xs text-slate-300">Key decision maker: VP Engineering. Active on LinkedIn.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// QA INBOX PAGE
// =============================================================================

function QAInboxPage() {
  const [selectedDraft, setSelectedDraft] = useState<Lead | null>(null)
  const [approving, setApproving] = useState(false)

  const handleApprove = async () => {
    if (!selectedDraft) return
    setApproving(true)
    try {
      const result = await callAIAgent(
        `Send approved email to ${selectedDraft.email}`,
        AGENT_IDS.INSTANTLY_EMAIL_SENDER
      )
      console.log('Email sent:', result)
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setApproving(false)
    }
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">QA Inbox</h2>
        <p className="text-sm text-slate-400">Review and approve AI-generated messages</p>
      </div>

      <div className="grid grid-cols-3 gap-6">
        {/* Drafts List */}
        <div>
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-sm">Pending Drafts</CardTitle>
                <Badge variant="secondary">{MOCK_LEADS.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-280px)]">
                <div className="space-y-2">
                  {MOCK_LEADS.map((lead) => (
                    <button
                      key={lead.id}
                      onClick={() => setSelectedDraft(lead)}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-all",
                        selectedDraft?.id === lead.id ? 'bg-purple-600 border-purple-500' : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm font-medium text-white">{lead.name}</p>
                          <p className="text-xs text-slate-400">{lead.company}</p>
                        </div>
                        <Badge variant="outline" className="text-xs border-slate-600">{lead.channel}</Badge>
                      </div>
                      <p className="text-xs text-slate-500">AI confidence: 92%</p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Draft Preview & Edit */}
        <div className="col-span-2">
          {selectedDraft ? (
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{selectedDraft.name}</CardTitle>
                    <CardDescription className="text-slate-400">{selectedDraft.title} at {selectedDraft.company}</CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Badge className="bg-purple-500">Email</Badge>
                    <Badge variant="outline" className="border-green-500 text-green-500">92% AI Score</Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-slate-300">Subject Line</Label>
                  <Input
                    defaultValue="Scaling infrastructure for your EMEA expansion"
                    className="mt-1 bg-slate-950 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300">Message Body</Label>
                  <Textarea
                    defaultValue={`Hi ${selectedDraft.name},\n\nI noticed TechVision recently expanded to EMEA - congratulations!\n\nAs you scale infrastructure across regions, I wanted to share how companies like yours reduced deployment time by 40% with our platform.\n\nWould you be open to a 15-minute call next week?\n\nBest regards`}
                    className="mt-1 min-h-[250px] bg-slate-950 border-slate-700 text-white"
                  />
                </div>
                <div className="bg-slate-950 border border-slate-800 rounded-lg p-3">
                  <p className="text-xs font-medium text-slate-400 mb-2">Personalization Tokens</p>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline" className="text-xs border-slate-600">Company: {selectedDraft.company}</Badge>
                    <Badge variant="outline" className="text-xs border-slate-600">Recent News: EMEA Expansion</Badge>
                    <Badge variant="outline" className="text-xs border-slate-600">Intent Score: {selectedDraft.intent_score}</Badge>
                  </div>
                </div>
                <div className="flex gap-3">
                  <Button
                    onClick={handleApprove}
                    disabled={approving}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    {approving ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve & Send
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="border-slate-700">
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="outline" className="border-red-700 text-red-500 hover:bg-red-500/10">
                    <X className="h-4 w-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-slate-900 border-slate-800 h-full flex items-center justify-center">
              <div className="text-center text-slate-400">
                <Inbox className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Select a draft to review</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CONTENT STUDIO PAGE
// =============================================================================

function ContentStudioPage() {
  const [generating, setGenerating] = useState(false)

  const handleGenerateContent = async () => {
    setGenerating(true)
    try {
      const result = await callAIAgent(
        'Generate LinkedIn thought leadership post about AI in sales automation',
        AGENT_IDS.LINKEDIN_CONTENT
      )
      console.log('Content generated:', result)
    } catch (error) {
      console.error('Generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Content Studio</h2>
          <p className="text-sm text-slate-400">AI-generated content for LinkedIn and email campaigns</p>
        </div>
        <Button
          onClick={handleGenerateContent}
          disabled={generating}
          className="bg-purple-600 hover:bg-purple-700"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Content
            </>
          )}
        </Button>
      </div>

      <Tabs defaultValue="linkedin">
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="linkedin" className="data-[state=active]:bg-purple-600">LinkedIn Posts</TabsTrigger>
          <TabsTrigger value="email" className="data-[state=active]:bg-purple-600">Email Templates</TabsTrigger>
          <TabsTrigger value="battlecards" className="data-[state=active]:bg-purple-600">Competitive Battlecards</TabsTrigger>
        </TabsList>

        <TabsContent value="linkedin" className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="bg-slate-900 border-slate-800">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs border-slate-600">Thought Leadership</Badge>
                    <Badge className="bg-green-500 text-xs">87% engagement</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="bg-slate-950 border border-slate-800 rounded p-3 max-h-40 overflow-auto">
                    <p className="text-sm text-slate-300">
                      AI is transforming B2B sales in ways we couldn't imagine 5 years ago. Here are 3 trends every sales leader should watch...
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {['#AI', '#Sales', '#B2B'].map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs border-slate-600">{tag}</Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" className="flex-1 bg-purple-600 hover:bg-purple-700">
                      <Edit className="h-3 w-3 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="outline" className="border-slate-700">
                      <Calendar className="h-3 w-3 mr-1" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="email" className="mt-6">
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Cold Outreach Template</CardTitle>
                <CardDescription className="text-slate-400 text-xs">First touchpoint</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-300 space-y-2">
                  <p>Subject: Quick question about [Company]</p>
                  <p>Hi [Name],</p>
                  <p>I noticed [trigger event]...</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white text-sm">Follow-Up Template</CardTitle>
                <CardDescription className="text-slate-400 text-xs">Day 3 follow-up</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-300 space-y-2">
                  <p>Subject: Re: Quick question</p>
                  <p>Hi [Name],</p>
                  <p>Following up on my previous email...</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="battlecards" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">Competitive Battlecards</CardTitle>
              <CardDescription className="text-slate-400">Genspark-generated competitive intelligence</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                {['Competitor A', 'Competitor B', 'Competitor C'].map((comp) => (
                  <div key={comp} className="p-4 bg-slate-950 border border-slate-800 rounded-lg">
                    <h4 className="text-sm font-semibold text-white mb-2">{comp}</h4>
                    <p className="text-xs text-slate-400 mb-3">Primary enterprise platform competitor</p>
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs text-green-500">Our Advantage</p>
                        <p className="text-xs text-slate-300">Better integration support</p>
                      </div>
                      <div>
                        <p className="text-xs text-red-500">Their Strength</p>
                        <p className="text-xs text-slate-300">Longer market presence</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

// =============================================================================
// SETTINGS PAGE
// =============================================================================

function SettingsPage() {
  const [analyzing, setAnalyzing] = useState(false)

  const handleAnalyzeStyle = async () => {
    setAnalyzing(true)
    try {
      const result = await callAIAgent(
        'Analyze writing style from email samples',
        AGENT_IDS.WRITING_STYLE_ANALYZER
      )
      console.log('Style analysis:', result)
    } catch (error) {
      console.error('Analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="p-6 bg-slate-950 min-h-screen">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-1">Settings</h2>
        <p className="text-sm text-slate-400">Configure team settings and integrations</p>
      </div>

      <Tabs defaultValue="styles">
        <TabsList className="bg-slate-900 border-slate-800">
          <TabsTrigger value="styles" className="data-[state=active]:bg-purple-600">Writing Styles</TabsTrigger>
          <TabsTrigger value="icp" className="data-[state=active]:bg-purple-600">ICP Definitions</TabsTrigger>
          <TabsTrigger value="integrations" className="data-[state=active]:bg-purple-600">Integrations</TabsTrigger>
          <TabsTrigger value="team" className="data-[state=active]:bg-purple-600">Team Members</TabsTrigger>
        </TabsList>

        <TabsContent value="styles" className="mt-6">
          <div className="grid grid-cols-2 gap-6">
            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Analyze Writing Style</CardTitle>
                <CardDescription className="text-slate-400">Upload samples to extract style profile</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Paste 3-5 writing samples here..."
                  className="min-h-[200px] bg-slate-950 border-slate-700 text-white"
                />
                <Button
                  onClick={handleAnalyzeStyle}
                  disabled={analyzing}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                >
                  {analyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Analyze Style
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-slate-900 border-slate-800">
              <CardHeader>
                <CardTitle className="text-white">Style Profiles</CardTitle>
                <CardDescription className="text-slate-400">Saved writing styles</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {['Professional & Formal', 'Friendly & Casual', 'Technical & Detailed'].map((style) => (
                    <div key={style} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                      <p className="text-sm text-white">{style}</p>
                      <Badge variant="secondary" className="text-xs">Active</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="icp" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <CardTitle className="text-white">ICP Scoring Criteria</CardTitle>
              <CardDescription className="text-slate-400">Define your ideal customer profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300">Company Size</Label>
                  <div className="mt-2">
                    <Slider defaultValue={[500]} max={10000} step={100} />
                    <p className="text-xs text-slate-400 mt-1">100 - 10,000 employees</p>
                  </div>
                </div>
                <div>
                  <Label className="text-slate-300">Revenue Range</Label>
                  <Select>
                    <SelectTrigger className="mt-2 bg-slate-950 border-slate-700 text-white">
                      <SelectValue placeholder="Select range" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900 border-slate-700">
                      <SelectItem value="1-10m">$1M - $10M</SelectItem>
                      <SelectItem value="10-50m">$10M - $50M</SelectItem>
                      <SelectItem value="50-100m">$50M - $100M</SelectItem>
                      <SelectItem value="100m+">$100M+</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations" className="mt-6">
          <div className="grid grid-cols-3 gap-4">
            <IntegrationCard name="Gmail" status="connected" icon={Mail} />
            <IntegrationCard name="LinkedIn" status="connected" icon={Linkedin} />
            <IntegrationCard name="Calendly" status="connected" icon={Calendar} />
            <IntegrationCard name="Clay" status="connected" icon={Database} />
            <IntegrationCard name="Instantly" status="connected" icon={Send} />
            <IntegrationCard name="Genspark" status="connected" icon={Brain} />
          </div>
        </TabsContent>

        <TabsContent value="team" className="mt-6">
          <Card className="bg-slate-900 border-slate-800">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Team Members</CardTitle>
                <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Member
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {['Sarah Johnson - Admin', 'Mike Chen - Sales Rep', 'Emily Davis - Sales Rep'].map((member) => (
                  <div key={member} className="flex items-center justify-between p-3 bg-slate-950 rounded-lg border border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/20 rounded-full">
                        <User className="h-4 w-4 text-purple-400" />
                      </div>
                      <p className="text-sm text-white">{member}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function IntegrationCard({ name, status, icon: Icon }: { name: string, status: string, icon: any }) {
  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardContent className="pt-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-purple-500/20 rounded-lg">
            <Icon className="h-5 w-5 text-purple-400" />
          </div>
          <div>
            <p className="text-sm font-medium text-white">{name}</p>
            <Badge className={cn("text-xs mt-1", status === 'connected' ? 'bg-green-500' : 'bg-slate-600')}>
              {status}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-slate-950 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'pipeline' && <PipelinePage />}
        {currentPage === 'enrichment' && <EnrichmentLabPage />}
        {currentPage === 'outreach' && <OutreachCenterPage />}
        {currentPage === 'research' && <ResearchHubPage />}
        {currentPage === 'qa-inbox' && <QAInboxPage />}
        {currentPage === 'content' && <ContentStudioPage />}
        {currentPage === 'settings' && <SettingsPage />}
      </main>
    </div>
  )
}
