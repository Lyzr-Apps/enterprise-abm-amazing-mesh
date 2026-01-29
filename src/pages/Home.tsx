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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
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
  Linkedin,
  Star,
  AlertCircle
} from 'lucide-react'
import { cn } from '@/lib/utils'

// =============================================================================
// AGENT IDS - HARDCODED FROM WORKFLOW
// =============================================================================

const AGENT_IDS = {
  // Manager
  LEAD_PROCESSING_COORDINATOR: '697ace4fbc6eb6293f5503f1',

  // Sub-agents
  LEAD_ENRICHMENT: '697acded814f1038c09862c5',
  ICP_SCORING: '697ace07814f1038c09862c6',
  MESSAGE_GENERATION: '697ace27c03792e039e5ada5',

  // Independent agents
  EMAIL_DELIVERY: '697ace6bc03792e039e5adaa',
  LINKEDIN_CONTENT: '697ace8623e56dc88c1ff0c6',
  MEETING_SCHEDULER: '697acea3814f1038c09862d1',
  WRITING_STYLE_ANALYZER: '697acec2814f1038c09862d2'
}

// =============================================================================
// TYPE DEFINITIONS FROM ACTUAL AGENT RESPONSES
// =============================================================================

interface EmailSequenceStep {
  step?: number
  sequence_number?: number
  subject?: string
  subject_line?: string
  body: string
  personalization_tokens?: {
    company_name?: string
    trigger?: string
  }
}

interface LinkedInMessage {
  connection_request?: string
  follow_up_message?: string
}

interface QualifiedLead {
  lead_id: string
  name: string
  company: string
  title: string
  email: string
  icp_score: number
  icp_reasoning?: string
  email_sequence?: EmailSequenceStep[]
  linkedin_message?: string | LinkedInMessage
  stage?: string
}

interface ProcessingSummary {
  total_leads_processed: number
  qualified_count: number
  disqualified_count: number
  enrichment_status: string
  scoring_status: string
  message_generation_status: string
}

interface LeadProcessingResult {
  qualified_leads: QualifiedLead[]
  processing_summary: ProcessingSummary
}

interface LinkedInPost {
  post_id: string
  ae_name: string
  content: string
  post_type: string
  hashtags: string[]
  estimated_engagement_score: string
  best_time_to_post: string
}

interface LinkedInContentResult {
  posts: LinkedInPost[]
  content_themes: string[]
  style_match_scores: Record<string, number>
  trend_topics_used: string[]
}

interface MeetingTime {
  date: string
  time: string
  timezone: string
  duration_minutes: number
}

interface MeetingSchedulerResult {
  meeting_times: MeetingTime[]
  confirmation_message: string
  calendly_link: string
  meeting_scheduled: boolean
}

interface StyleProfile {
  team_member_name: string
  profile_id: string
  tone_analysis: {
    formality_score: number
    warmth_score: number
    directness_score: number
    primary_tone: string
  }
  structure_patterns: {
    avg_sentence_length: number
    avg_paragraph_length: number
    opening_style: string
    closing_style: string
    uses_questions: boolean
    uses_storytelling: boolean
  }
  vocabulary_profile: {
    reading_level: string
    signature_phrases: string[]
    common_words: string[]
    avoided_words: any[]
    emoji_usage: string
  }
  unique_characteristics: string[]
  sample_count_analyzed: number
  confidence_score: number
}

interface WritingStyleResult {
  style_profile: StyleProfile
}

interface Campaign {
  id: string
  name: string
  status: 'active' | 'draft' | 'paused'
  leads: QualifiedLead[]
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

function getScoreBadgeColor(score: number): string {
  if (score >= 70) return 'bg-green-500'
  if (score >= 40) return 'bg-yellow-500'
  return 'bg-red-500'
}

function getScoreBadgeVariant(score: number): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (score >= 70) return 'default'
  if (score >= 40) return 'secondary'
  return 'destructive'
}

// =============================================================================
// MOCK DATA FOR DEMO
// =============================================================================

const MOCK_LEADS: QualifiedLead[] = [
  {
    lead_id: 'lead-1',
    name: 'John Doe',
    company: 'Acme Corp',
    title: 'VP Engineering',
    email: 'john@acmecorp.com',
    icp_score: 92,
    icp_reasoning: 'Strong fit - enterprise decision maker',
    stage: 'contacted',
    email_sequence: [
      {
        step: 1,
        subject: 'Unlocking Operational Efficiency at Acme Corp',
        body: 'Hi John, I\'m reaching out to introduce how our platform can help...'
      }
    ]
  },
  {
    lead_id: 'lead-2',
    name: 'Sarah Smith',
    company: 'TechStart Inc',
    title: 'CTO',
    email: 'sarah@techstart.com',
    icp_score: 85,
    icp_reasoning: 'Good fit - technical decision maker',
    stage: 'enriched'
  },
  {
    lead_id: 'lead-3',
    name: 'Mike Johnson',
    company: 'Enterprise Solutions',
    title: 'Director of Operations',
    email: 'mike@enterprise.com',
    icp_score: 45,
    icp_reasoning: 'Medium fit - operational influence',
    stage: 'new'
  }
]

// =============================================================================
// MAIN LAYOUT COMPONENT
// =============================================================================

function Sidebar({ currentPage, onPageChange }: { currentPage: string; onPageChange: (page: string) => void }) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'campaigns', label: 'Campaigns', icon: Target },
    { id: 'qa-inbox', label: 'QA Inbox', icon: Inbox },
    { id: 'content-hub', label: 'Content Hub', icon: Sparkles },
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { id: 'team-settings', label: 'Team Settings', icon: Settings }
  ]

  return (
    <div className="w-64 bg-gray-900 border-r border-gray-800 h-screen flex flex-col">
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-xl font-bold text-white flex items-center gap-2">
          <Zap className="h-6 w-6 text-blue-500" />
          Gojberry ABM
        </h1>
      </div>

      <nav className="flex-1 p-4">
        {menuItems.map((item) => {
          const Icon = item.icon
          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors",
                currentPage === item.id
                  ? "bg-blue-500 text-white"
                  : "text-gray-400 hover:bg-gray-800 hover:text-white"
              )}
            >
              <Icon className="h-5 w-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}

// =============================================================================
// DASHBOARD PAGE
// =============================================================================

function DashboardPage() {
  const metrics = [
    { label: 'MQLs This Month', value: '147', change: '+12%', icon: Users },
    { label: 'SQLs Generated', value: '89', change: '+8%', icon: TrendingUp },
    { label: 'Response Rate', value: '34%', change: '+5%', icon: Mail },
    { label: 'Meetings Booked', value: '23', change: '+15%', icon: Calendar }
  ]

  const actionItems = [
    { type: 'qa', title: '12 messages pending QA review', time: '2h ago' },
    { type: 'followup', title: '5 leads ready for follow-up', time: '4h ago' },
    { type: 'schedule', title: '3 content posts scheduled for today', time: '6h ago' }
  ]

  return (
    <div className="p-8 space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-white mb-2">Dashboard</h2>
        <p className="text-gray-400">Welcome back! Here's what's happening today.</p>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric) => {
          const Icon = metric.icon
          return (
            <Card key={metric.label} className="bg-gray-800 border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">
                  {metric.label}
                </CardTitle>
                <Icon className="h-4 w-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{metric.value}</div>
                <p className="text-xs text-green-500 mt-1">{metric.change} from last month</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Items */}
        <div className="lg:col-span-2">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Action Items</CardTitle>
              <CardDescription className="text-gray-400">Tasks requiring your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {actionItems.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      item.type === 'qa' ? 'bg-yellow-500' : item.type === 'followup' ? 'bg-blue-500' : 'bg-green-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm text-white">{item.title}</p>
                      <p className="text-xs text-gray-500">{item.time}</p>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Today's Schedule */}
        <div>
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Today's Schedule</CardTitle>
              <CardDescription className="text-gray-400">Upcoming meetings</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Demo Call - Acme Corp</p>
                    <p className="text-xs text-gray-400">2:00 PM - 2:30 PM</p>
                  </div>
                </div>
                <div className="flex items-start gap-3 p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <Calendar className="h-4 w-4 text-blue-500 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-white">Follow-up - TechStart</p>
                    <p className="text-xs text-gray-400">4:00 PM - 4:15 PM</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-3">
        <Button className="bg-blue-500 hover:bg-blue-600 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Process New Leads
        </Button>
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Inbox className="h-4 w-4 mr-2" />
          Open QA Inbox
        </Button>
        <Button variant="outline" className="border-gray-700 text-gray-300 hover:bg-gray-800">
          <Sparkles className="h-4 w-4 mr-2" />
          View Content Queue
        </Button>
      </div>
    </div>
  )
}

// =============================================================================
// CAMPAIGNS PAGE
// =============================================================================

function CampaignsPage() {
  const [activeTab, setActiveTab] = useState('brief')
  const [processing, setProcessing] = useState(false)
  const [processingResult, setProcessingResult] = useState<LeadProcessingResult | null>(null)
  const [campaignBrief, setCampaignBrief] = useState('')
  const [leads, setLeads] = useState<QualifiedLead[]>(MOCK_LEADS)

  const processLeads = async () => {
    setProcessing(true)
    try {
      const result = await callAIAgent(
        'Process leads for enterprise software campaign',
        AGENT_IDS.LEAD_PROCESSING_COORDINATOR
      )

      if (result.success && result.response.status === 'success') {
        const data = result.response.result as LeadProcessingResult
        setProcessingResult(data)
        if (data.qualified_leads && data.qualified_leads.length > 0) {
          setLeads(data.qualified_leads)
        }
      }
    } catch (error) {
      console.error('Lead processing error:', error)
    } finally {
      setProcessing(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Campaigns</h2>
        <p className="text-gray-400">Manage your ABM campaigns and lead pipeline</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-gray-800 border-gray-700">
          <TabsTrigger value="brief" className="data-[state=active]:bg-blue-500">Brief</TabsTrigger>
          <TabsTrigger value="icp" className="data-[state=active]:bg-blue-500">ICP Definition</TabsTrigger>
          <TabsTrigger value="context" className="data-[state=active]:bg-blue-500">Context Board</TabsTrigger>
          <TabsTrigger value="pipeline" className="data-[state=active]:bg-blue-500">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-500">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="brief" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Campaign Brief</CardTitle>
              <CardDescription className="text-gray-400">Define your campaign objectives and strategy</CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder="Enter your campaign brief, objectives, and key messaging..."
                className="min-h-[200px] bg-gray-900 border-gray-700 text-white"
                value={campaignBrief}
                onChange={(e) => setCampaignBrief(e.target.value)}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="icp" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">ICP Definition</CardTitle>
              <CardDescription className="text-gray-400">Define your ideal customer profile</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-gray-300">Industry</Label>
                  <Select>
                    <SelectTrigger className="bg-gray-900 border-gray-700 text-white">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent className="bg-gray-800 border-gray-700">
                      <SelectItem value="saas">SaaS</SelectItem>
                      <SelectItem value="fintech">FinTech</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="enterprise">Enterprise Software</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-300">Company Size</Label>
                  <div className="pt-2">
                    <Slider defaultValue={[500]} max={10000} step={100} className="text-blue-500" />
                    <p className="text-xs text-gray-400 mt-1">100 - 10,000 employees</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-gray-300">Technologies Used</Label>
                <div className="grid grid-cols-3 gap-2">
                  {['Salesforce', 'AWS', 'Slack', 'HubSpot', 'Zendesk', 'Snowflake'].map((tech) => (
                    <label key={tech} className="flex items-center gap-2 text-sm text-gray-300">
                      <Checkbox className="border-gray-600" />
                      {tech}
                    </label>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="context" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Context Board</CardTitle>
              <CardDescription className="text-gray-400">Upload documents and context for the campaign</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border-2 border-dashed border-gray-700 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-500 mx-auto mb-4" />
                <p className="text-gray-400 mb-2">Drag and drop files here, or click to browse</p>
                <p className="text-xs text-gray-500">Supports: PDF, DOCX, TXT</p>
                <Button className="mt-4 bg-blue-500 hover:bg-blue-600">
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Documents
                </Button>
              </div>

              <div className="mt-4 space-y-2">
                <div className="flex items-center justify-between p-3 bg-gray-900 rounded-lg border border-gray-700">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-500" />
                    <span className="text-sm text-white">Product_Brief_2024.pdf</span>
                  </div>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Lead Pipeline</h3>
            <Button
              onClick={processLeads}
              disabled={processing}
              className="bg-blue-500 hover:bg-blue-600"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Process Leads
                </>
              )}
            </Button>
          </div>

          {processingResult && (
            <Card className="bg-gray-800 border-gray-700 mb-4">
              <CardHeader>
                <CardTitle className="text-white">Processing Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-400">Total Processed</p>
                    <p className="text-2xl font-bold text-white">{processingResult.processing_summary.total_leads_processed}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Qualified</p>
                    <p className="text-2xl font-bold text-green-500">{processingResult.processing_summary.qualified_count}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-400">Disqualified</p>
                    <p className="text-2xl font-bold text-red-500">{processingResult.processing_summary.disqualified_count}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {['new', 'enriched', 'contacted', 'replied'].map((stage) => (
              <div key={stage}>
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  <h4 className="font-semibold text-white mb-3 capitalize">{stage}</h4>
                  <div className="space-y-2">
                    {leads
                      .filter(lead => (lead.stage || 'new') === stage)
                      .map((lead) => (
                        <LeadCard key={lead.lead_id} lead={lead} />
                      ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Campaign Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400 mb-2">Conversion Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={34} className="flex-1" />
                    <span className="text-sm font-medium text-white">34%</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-gray-400 mb-2">Engagement Rate</p>
                  <div className="flex items-center gap-2">
                    <Progress value={67} className="flex-1" />
                    <span className="text-sm font-medium text-white">67%</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LeadCard({ lead }: { lead: QualifiedLead }) {
  return (
    <Card className="bg-gray-900 border-gray-700 p-3">
      <div className="space-y-2">
        <div className="flex items-start justify-between">
          <div>
            <p className="font-medium text-white text-sm">{lead.name}</p>
            <p className="text-xs text-gray-400">{lead.title}</p>
          </div>
          <Badge
            variant={getScoreBadgeVariant(lead.icp_score)}
            className={cn(getScoreBadgeColor(lead.icp_score), "text-white")}
          >
            {lead.icp_score}
          </Badge>
        </div>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Building className="h-3 w-3" />
          {lead.company}
        </div>
      </div>
    </Card>
  )
}

// =============================================================================
// QA INBOX PAGE
// =============================================================================

function QAInboxPage() {
  const [selectedLead, setSelectedLead] = useState<QualifiedLead | null>(null)
  const [draftMessage, setDraftMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [leads] = useState(MOCK_LEADS)

  const handleApproveAndSend = async () => {
    if (!selectedLead) return

    setSending(true)
    try {
      const result = await callAIAgent(
        `Send email to ${selectedLead.email}: ${draftMessage}`,
        AGENT_IDS.EMAIL_DELIVERY
      )

      if (result.success) {
        console.log('Email sent:', result.response)
      }
    } catch (error) {
      console.error('Send error:', error)
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">QA Inbox</h2>
        <p className="text-gray-400">Review and approve draft messages before sending</p>
      </div>

      <div className="grid grid-cols-3 gap-6 h-[calc(100vh-200px)]">
        {/* Lead List */}
        <div className="col-span-1">
          <Card className="bg-gray-800 border-gray-700 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Pending Drafts</CardTitle>
                <Badge variant="secondary">{leads.length}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-320px)]">
                <div className="space-y-2">
                  {leads.map((lead) => (
                    <button
                      key={lead.lead_id}
                      onClick={() => {
                        setSelectedLead(lead)
                        setDraftMessage(lead.email_sequence?.[0]?.body || '')
                      }}
                      className={cn(
                        "w-full p-3 rounded-lg border text-left transition-colors",
                        selectedLead?.lead_id === lead.lead_id
                          ? "bg-blue-500 border-blue-400"
                          : "bg-gray-900 border-gray-700 hover:border-gray-600"
                      )}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-medium text-white text-sm">{lead.name}</p>
                          <p className="text-xs text-gray-400">{lead.company}</p>
                        </div>
                        <Badge variant={getScoreBadgeVariant(lead.icp_score)} className="text-xs">
                          {lead.icp_score}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {lead.email_sequence?.[0]?.subject || 'No subject'}
                      </p>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>

        {/* Message Editor */}
        <div className="col-span-2">
          {selectedLead ? (
            <Card className="bg-gray-800 border-gray-700 h-full">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-white">{selectedLead.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {selectedLead.title} at {selectedLead.company}
                    </CardDescription>
                  </div>
                  <Badge variant={getScoreBadgeVariant(selectedLead.icp_score)}>
                    Score: {selectedLead.icp_score}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Subject Line</Label>
                  <Input
                    value={selectedLead.email_sequence?.[0]?.subject || selectedLead.email_sequence?.[0]?.subject_line || ''}
                    className="bg-gray-900 border-gray-700 text-white mt-1"
                    readOnly
                  />
                </div>

                <div>
                  <Label className="text-gray-300">Message Body</Label>
                  <Textarea
                    value={draftMessage}
                    onChange={(e) => setDraftMessage(e.target.value)}
                    className="min-h-[300px] bg-gray-900 border-gray-700 text-white mt-1"
                  />
                </div>

                <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-white mb-2">ICP Reasoning</h4>
                  <p className="text-sm text-gray-400">{selectedLead.icp_reasoning}</p>
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={handleApproveAndSend}
                    disabled={sending}
                    className="bg-blue-500 hover:bg-blue-600 flex-1"
                  >
                    {sending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Approve & Send
                      </>
                    )}
                  </Button>
                  <Button variant="outline" className="border-gray-700">
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="bg-gray-800 border-gray-700 h-full flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Inbox className="h-12 w-12 mx-auto mb-4" />
                <p>Select a lead to review the draft message</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// CONTENT HUB PAGE
// =============================================================================

function ContentHubPage() {
  const [generating, setGenerating] = useState(false)
  const [posts, setPosts] = useState<LinkedInPost[]>([])
  const [selectedPost, setSelectedPost] = useState<LinkedInPost | null>(null)
  const [editModalOpen, setEditModalOpen] = useState(false)

  const generatePosts = async () => {
    setGenerating(true)
    try {
      const result = await callAIAgent(
        'Generate LinkedIn posts for enterprise software thought leadership',
        AGENT_IDS.LINKEDIN_CONTENT
      )

      if (result.success && result.response.status === 'success') {
        const data = result.response.result as LinkedInContentResult
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error('Content generation error:', error)
    } finally {
      setGenerating(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-white mb-2">Content Hub</h2>
          <p className="text-gray-400">Generate and manage LinkedIn content for your team</p>
        </div>
        <Button
          onClick={generatePosts}
          disabled={generating}
          className="bg-blue-500 hover:bg-blue-600"
        >
          {generating ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Posts
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {posts.length > 0 ? (
          posts.map((post) => (
            <Card key={post.post_id} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-white text-sm">{post.ae_name}</CardTitle>
                    <CardDescription className="text-gray-400 text-xs">{post.post_type}</CardDescription>
                  </div>
                  <Badge className="bg-blue-500 text-white">
                    {post.estimated_engagement_score}% engagement
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="bg-gray-900 border border-gray-700 rounded p-3 max-h-40 overflow-auto">
                  <p className="text-sm text-gray-300 whitespace-pre-wrap">{post.content}</p>
                </div>

                <div className="flex flex-wrap gap-1">
                  {post.hashtags.slice(0, 3).map((tag, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs border-gray-600 text-gray-400">
                      #{tag}
                    </Badge>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <Clock className="h-3 w-3" />
                  Best time: {new Date(post.best_time_to_post).toLocaleString()}
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-blue-500 hover:bg-blue-600"
                    onClick={() => {
                      setSelectedPost(post)
                      setEditModalOpen(true)
                    }}
                  >
                    <Edit className="h-3 w-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="border-gray-700">
                    <Calendar className="h-3 w-3 mr-1" />
                    Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full">
            <Card className="bg-gray-800 border-gray-700 p-12">
              <div className="text-center text-gray-400">
                <Sparkles className="h-12 w-12 mx-auto mb-4" />
                <p className="text-lg mb-2">No posts generated yet</p>
                <p className="text-sm">Click "Generate Posts" to create LinkedIn content</p>
              </div>
            </Card>
          </div>
        )}
      </div>

      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="bg-gray-800 border-gray-700 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Post</DialogTitle>
            <DialogDescription className="text-gray-400">
              Adjust the tone and content of the post
            </DialogDescription>
          </DialogHeader>
          {selectedPost && (
            <div className="space-y-4">
              <Textarea
                value={selectedPost.content}
                className="min-h-[200px] bg-gray-900 border-gray-700 text-white"
                onChange={(e) => setSelectedPost({ ...selectedPost, content: e.target.value })}
              />
              <div className="flex gap-2">
                <Button className="bg-blue-500 hover:bg-blue-600">Save Changes</Button>
                <Button variant="outline" className="border-gray-700" onClick={() => setEditModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

// =============================================================================
// PIPELINE PAGE
// =============================================================================

function PipelinePage() {
  const [leads] = useState(MOCK_LEADS)
  const stages = [
    { id: 'new', label: 'New', color: 'bg-gray-500' },
    { id: 'enriched', label: 'Enriched', color: 'bg-blue-500' },
    { id: 'contacted', label: 'Contacted', color: 'bg-yellow-500' },
    { id: 'replied', label: 'Replied', color: 'bg-green-500' },
    { id: 'meeting', label: 'Meeting', color: 'bg-purple-500' },
    { id: 'opportunity', label: 'Opportunity', color: 'bg-orange-500' }
  ]

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Pipeline</h2>
        <p className="text-gray-400">Full view of all leads across campaigns</p>
      </div>

      <div className="grid grid-cols-6 gap-4">
        {stages.map((stage) => (
          <div key={stage.id}>
            <div className="mb-3 flex items-center gap-2">
              <div className={cn("h-2 w-2 rounded-full", stage.color)} />
              <h3 className="font-semibold text-white text-sm">{stage.label}</h3>
              <Badge variant="secondary" className="ml-auto">
                {leads.filter(l => (l.stage || 'new') === stage.id).length}
              </Badge>
            </div>
            <div className="space-y-2">
              {leads
                .filter(lead => (lead.stage || 'new') === stage.id)
                .map((lead) => (
                  <LeadCard key={lead.lead_id} lead={lead} />
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// =============================================================================
// TEAM SETTINGS PAGE
// =============================================================================

function TeamSettingsPage() {
  const [analyzing, setAnalyzing] = useState(false)
  const [styleProfile, setStyleProfile] = useState<StyleProfile | null>(null)
  const [sampleText, setSampleText] = useState('')

  const analyzeStyle = async () => {
    if (!sampleText) return

    setAnalyzing(true)
    try {
      const result = await callAIAgent(
        sampleText,
        AGENT_IDS.WRITING_STYLE_ANALYZER
      )

      if (result.success && result.response.status === 'success') {
        const data = result.response.result as WritingStyleResult
        setStyleProfile(data.style_profile)
      }
    } catch (error) {
      console.error('Style analysis error:', error)
    } finally {
      setAnalyzing(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mb-6">
        <h2 className="text-3xl font-bold text-white mb-2">Team Settings</h2>
        <p className="text-gray-400">Manage team member writing styles and preferences</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Analyze Writing Style</CardTitle>
            <CardDescription className="text-gray-400">
              Paste writing samples to extract style profile
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Paste 3-5 email or LinkedIn message samples here..."
              className="min-h-[200px] bg-gray-900 border-gray-700 text-white"
              value={sampleText}
              onChange={(e) => setSampleText(e.target.value)}
            />
            <Button
              onClick={analyzeStyle}
              disabled={analyzing || !sampleText}
              className="w-full bg-blue-500 hover:bg-blue-600"
            >
              {analyzing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Analyze Style
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {styleProfile && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Style Profile</CardTitle>
              <CardDescription className="text-gray-400">
                Extracted characteristics
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Formality</p>
                  <div className="flex items-center gap-2">
                    <Progress value={styleProfile.tone_analysis.formality_score} className="flex-1" />
                    <span className="text-xs text-white">{styleProfile.tone_analysis.formality_score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Warmth</p>
                  <div className="flex items-center gap-2">
                    <Progress value={styleProfile.tone_analysis.warmth_score} className="flex-1" />
                    <span className="text-xs text-white">{styleProfile.tone_analysis.warmth_score}</span>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Directness</p>
                  <div className="flex items-center gap-2">
                    <Progress value={styleProfile.tone_analysis.directness_score} className="flex-1" />
                    <span className="text-xs text-white">{styleProfile.tone_analysis.directness_score}</span>
                  </div>
                </div>
              </div>

              <Separator className="bg-gray-700" />

              <div>
                <p className="text-sm font-medium text-white mb-2">Primary Tone</p>
                <Badge className="bg-blue-500 text-white">{styleProfile.tone_analysis.primary_tone}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-white mb-2">Signature Phrases</p>
                <div className="flex flex-wrap gap-2">
                  {styleProfile.vocabulary_profile.signature_phrases.map((phrase, idx) => (
                    <Badge key={idx} variant="outline" className="border-gray-600 text-gray-300">
                      {phrase}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-white mb-2">Unique Characteristics</p>
                <ul className="space-y-1">
                  {styleProfile.unique_characteristics.map((char, idx) => (
                    <li key={idx} className="text-sm text-gray-400 flex items-start gap-2">
                      <Star className="h-3 w-3 mt-0.5 text-yellow-500" />
                      {char}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="bg-gray-900 border border-gray-700 rounded-lg p-3">
                <p className="text-xs text-gray-400">Confidence Score</p>
                <p className="text-lg font-bold text-white">{styleProfile.confidence_score}%</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <div className="mt-6">
        <h3 className="text-xl font-semibold text-white mb-4">Team Members</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['Sarah Johnson', 'Mike Chen', 'Emily Davis'].map((name, idx) => (
            <Card key={idx} className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant="secondary" className="text-xs">Style profile active</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  )
}

// =============================================================================
// MAIN APP COMPONENT
// =============================================================================

export default function Home() {
  const [currentPage, setCurrentPage] = useState('dashboard')

  return (
    <div className="min-h-screen bg-gray-900 flex">
      <Sidebar currentPage={currentPage} onPageChange={setCurrentPage} />

      <main className="flex-1 overflow-auto">
        {currentPage === 'dashboard' && <DashboardPage />}
        {currentPage === 'campaigns' && <CampaignsPage />}
        {currentPage === 'qa-inbox' && <QAInboxPage />}
        {currentPage === 'content-hub' && <ContentHubPage />}
        {currentPage === 'pipeline' && <PipelinePage />}
        {currentPage === 'team-settings' && <TeamSettingsPage />}
      </main>
    </div>
  )
}
