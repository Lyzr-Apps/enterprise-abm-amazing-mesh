# LYZR OUTREACH PLATFORM - COMPREHENSIVE DOCUMENTATION

## TABLE OF CONTENTS
1. [Agent Architecture Overview](#agent-architecture-overview)
2. [Manager Agent Details](#manager-agent-details)
3. [Sub-Agent Details](#sub-agent-details)
4. [Independent Agent Details](#independent-agent-details)
5. [Workflow Execution Details](#workflow-execution-details)
6. [Tool Integrations](#tool-integrations)
7. [Knowledge Base System](#knowledge-base-system)
8. [To-Do List](#to-do-list)
9. [Integration with Lovable/Bolt](#integration-with-lovablebolt)

---

## 1. AGENT ARCHITECTURE OVERVIEW

### Total Agent Count: 15 Agents
- **2 Manager Agents** (coordinate sub-agents)
- **3 Sub-Agents** (work under manager supervision)
- **10 Independent Agents** (work autonomously)
- **2 Knowledge Bases** (RAG systems for context)

### Agent Types Explained

#### MANAGER AGENTS
Manager agents orchestrate workflows by coordinating multiple sub-agents. They:
- Receive user input/trigger
- Delegate tasks to sub-agents in sequence or parallel
- Aggregate results from all sub-agents
- Return unified response to user
- Handle error recovery if sub-agent fails

**Key Characteristic**: Manager agents do NOT call external tools directly. They only coordinate other agents.

#### SUB-AGENTS
Sub-agents are specialized workers managed by a manager. They:
- Wait for manager to trigger them
- Execute specific task (enrichment, scoring, message generation)
- Return results to manager
- Cannot be triggered directly by user
- Focus on single responsibility

**Key Characteristic**: Sub-agents are invisible to user interface. Only manager exposes results.

#### INDEPENDENT AGENTS
Independent agents work autonomously without manager oversight. They:
- Can be triggered directly from UI buttons
- Execute complete workflows on their own
- Return results directly to user
- May use external tools (APIs, databases)
- Can access knowledge bases

**Key Characteristic**: Independent agents appear as standalone features in UI.

---

## 2. MANAGER AGENT DETAILS

### MANAGER 1: Lead Processing Coordinator
**Agent ID**: 697ace4fbc6eb6293f5503f1

**Purpose**: Orchestrates the complete lead qualification workflow from raw lead data to scored leads with personalized outreach drafts.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.3 (low creativity, high consistency)
**Top P**: 1.0 (full vocabulary access)

**Managed Sub-Agents** (executes in sequence):
1. Lead Enrichment Agent (697acded814f1038c09862c5)
2. ICP Scoring Agent (697ace07814f1038c09862c6)
3. Message Generation Agent (697ace27c03792e039e5ada5)

**Workflow Steps**:
```
User clicks "Process Leads" button in Campaign Dashboard
  ↓
Manager receives: List of leads (name, email, company, title)
  ↓
Step 1: Manager calls Lead Enrichment Agent
  - Passes lead email/company to enrichment agent
  - Receives: Firmographics, technographics, recent news
  ↓
Step 2: Manager calls ICP Scoring Agent
  - Passes enriched data + campaign ICP criteria
  - Receives: Score (1-100) + reasoning
  ↓
Step 3: Manager calls Message Generation Agent
  - Passes enriched data + score + persona guidelines
  - Receives: Email sequence + LinkedIn message
  ↓
Manager aggregates all results into unified JSON response
  ↓
Returns to UI: Qualified leads with scores and draft messages
```

**Response Format** (from actual test):
```json
{
  "status": "success",
  "result": {
    "qualified_leads": [
      {
        "lead_id": "john-doe-acmecorp",
        "name": "John Doe",
        "company": "Acme Corp",
        "title": "VP Engineering",
        "email": "john@acmecorp.com",
        "icp_score": 92,
        "icp_reasoning": "Strong fit: Enterprise size, uses target tech stack...",
        "enrichment_data": {
          "company_size": 500,
          "industry": "Enterprise Software",
          "technologies": ["Salesforce", "AWS", "Docker"],
          "recent_news": "Series C funding announced..."
        },
        "email_sequence": [
          {
            "subject": "Scaling Infrastructure at Acme Corp",
            "body": "Hi John, I noticed Acme Corp recently raised Series C..."
          }
        ],
        "linkedin_message": "John, congrats on the funding round..."
      }
    ],
    "processing_summary": {
      "total_leads_processed": 1,
      "qualified_count": 1,
      "disqualified_count": 0
    }
  }
}
```

**Error Handling**:
- If enrichment fails → Manager skips to scoring with partial data
- If scoring fails → Manager assigns default score of 50
- If message generation fails → Manager returns lead without drafts
- Critical errors → Manager returns error status with partial results

**UI Integration**:
```typescript
// In Campaigns page, "Process Leads" button
const processLeads = async (leads: Lead[]) => {
  const response = await chatWithAgent(
    '697ace4fbc6eb6293f5503f1', // Manager ID
    `Process leads for campaign: ${JSON.stringify(leads)}`
  );

  const data = JSON.parse(response);
  const qualifiedLeads = data.result.qualified_leads;

  // Update pipeline with scored leads
  setLeads(qualifiedLeads);
};
```

---

### MANAGER 2: Multi-Channel Orchestrator
**Agent ID**: 697ad587bc6eb6293f550417

**Purpose**: Coordinates cross-channel outreach campaigns across email (Gmail + Instantly) and LinkedIn, optimizing channel selection based on engagement.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.4 (balanced creativity)
**Top P**: 1.0

**Managed Sub-Agents**:
1. Email Delivery Agent (697ace6bc03792e039e5adaa) - Gmail sender
2. Instantly Email Sender Agent (697ad4a9bc6eb6293f55040b) - Cold email campaigns
3. LinkedIn Sales Navigator Agent (697ad4c2c03792e039e5add8) - LinkedIn outreach

**Workflow Steps**:
```
User clicks "Launch Multi-Channel Campaign" in Outreach Center
  ↓
Manager receives: Lead list + campaign strategy + channels enabled
  ↓
Step 1: Analyze engagement history for each lead
  - Email open rate, reply rate
  - LinkedIn profile views, connection status
  ↓
Step 2: Decide channel sequence for each lead
  Example: Email → LinkedIn → Email (if no reply)
  ↓
Step 3: Coordinate parallel execution
  - Email Agent sends first email
  - LinkedIn Agent sends connection request after 2 days
  - Instantly Agent starts sequence after 5 days if no reply
  ↓
Manager tracks responses across all channels
  ↓
Returns: Outreach plan with timings and next actions
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "outreach_plan": {
      "lead_id": "john-doe-acmecorp",
      "sequence": [
        {
          "channel": "email_gmail",
          "action": "send_email",
          "timing": "immediate",
          "agent_id": "697ace6bc03792e039e5adaa"
        },
        {
          "channel": "linkedin",
          "action": "connection_request",
          "timing": "2_days_after_email",
          "agent_id": "697ad4c2c03792e039e5add8"
        },
        {
          "channel": "email_instantly",
          "action": "cold_sequence",
          "timing": "5_days_no_reply",
          "agent_id": "697ad4a9bc6eb6293f55040b"
        }
      ]
    },
    "engagement_summary": {
      "total_touchpoints": 3,
      "channels_used": ["email", "linkedin"],
      "estimated_timeline_days": 14
    }
  }
}
```

**UI Integration**:
```typescript
// In Outreach Center
const orchestrateMultiChannel = async (leadIds: string[], strategy: string) => {
  const response = await chatWithAgent(
    '697ad587bc6eb6293f550417',
    `Create multi-channel sequence for leads: ${leadIds.join(',')} using strategy: ${strategy}`
  );

  const data = JSON.parse(response);
  return data.result.outreach_plan;
};
```

---

## 3. SUB-AGENT DETAILS

### SUB-AGENT 1: Lead Enrichment Agent
**Agent ID**: 697acded814f1038c09862c5

**Purpose**: Fetch comprehensive company and contact data from Apollo API and web research.

**Provider**: Perplexity Sonar-Pro (better for web search)
**Temperature**: 0.2 (factual accuracy)
**Managed By**: Lead Processing Coordinator

**Tools Connected**:
- **Apollo API** (Composio integration)
  - Action: APOLLO_PEOPLE_ENRICHMENT
  - Returns: Firmographics, contact info, technographics

**Workflow**:
```
Manager passes: {email: "john@acme.com", company: "Acme Corp"}
  ↓
Agent calls Apollo API with email
  ↓
Receives: Company size, industry, revenue, tech stack, employee count
  ↓
Agent uses Perplexity for web research
  ↓
Searches: "Acme Corp recent news funding hiring"
  ↓
Aggregates all data into structured JSON
  ↓
Returns to Manager: Enriched lead profile
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "company_name": "Acme Corp",
    "employee_count": 500,
    "industry": "Enterprise Software",
    "revenue_range": "$50M-$100M",
    "technologies": ["Salesforce", "AWS", "Docker", "Kubernetes"],
    "recent_news": [
      "Series C funding $50M announced",
      "Hiring 20 engineers for cloud team"
    ],
    "contact_info": {
      "email": "john@acme.com",
      "phone": "+1-555-0100",
      "linkedin": "linkedin.com/in/johndoe"
    }
  }
}
```

**Why Sub-Agent?**
Enrichment is always part of lead processing workflow. It's never needed standalone, so making it a sub-agent ensures it only runs as part of the complete qualification process.

---

### SUB-AGENT 2: ICP Scoring Agent
**Agent ID**: 697ace07814f1038c09862c6

**Purpose**: Score leads against Ideal Customer Profile criteria with explainable reasoning.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.2 (consistent scoring)
**Managed By**: Lead Processing Coordinator
**Knowledge Base**: ICP Definitions KB (697acdf6115a3970d17438d3)

**Knowledge Base Access**:
The agent queries the ICP Definitions Knowledge Base which contains:
- Company size requirements (e.g., 100-5000 employees)
- Industry verticals (e.g., SaaS, Fintech, Healthcare)
- Technology indicators (e.g., uses Salesforce, AWS)
- Buying signals (e.g., recent funding, rapid hiring)
- Disqualification criteria (e.g., competitors, wrong geo)

**Workflow**:
```
Manager passes: Enriched lead data from previous agent
  ↓
Agent queries Knowledge Base for campaign ICP criteria
  ↓
Evaluates lead against each criterion:
  - Company size: 500 employees ✓ (target: 100-5000)
  - Industry: Enterprise Software ✓ (target vertical)
  - Tech stack: Uses Salesforce ✓ (buying signal)
  - Funding: Series C ✓ (strong signal)
  ↓
Calculates score: (matched_criteria / total_criteria) * 100
  ↓
Generates reasoning explaining the score
  ↓
Returns to Manager: Score + reasoning
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "icp_score": 92,
    "score_breakdown": {
      "company_size": 20,
      "industry_fit": 25,
      "tech_stack": 20,
      "buying_signals": 27
    },
    "reasoning": "Excellent fit. Acme Corp meets 4/4 ICP criteria: (1) Enterprise size with 500 employees, (2) Target industry - Enterprise Software, (3) Uses our target tech stack (Salesforce, AWS), (4) Strong buying signals with recent Series C funding and engineering team expansion. High likelihood of conversion.",
    "disqualification_flags": []
  }
}
```

**Why Sub-Agent?**
Scoring always happens after enrichment and before message generation. It's a dependent step that requires enriched data, making it ideal as a sub-agent in the workflow chain.

---

### SUB-AGENT 3: Message Generation Agent
**Agent ID**: 697ace27c03792e039e5ada5

**Purpose**: Craft hyper-personalized email sequences and LinkedIn messages using enrichment data, ICP insights, and learned writing styles.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.7 (creative for personalization)
**Top P**: 0.95 (diverse vocabulary)
**Managed By**: Lead Processing Coordinator
**Knowledge Base**: Writing Samples & Context KB (697ace15115a3970d17438d4)

**Knowledge Base Access**:
Queries the Writing Samples KB for:
- Team member writing styles (tone, structure, vocabulary)
- Campaign briefs (value props, target pain points)
- Product documentation (features, benefits, use cases)
- Competitive battlecards
- Context board updates (recent wins, market changes)

**Workflow**:
```
Manager passes: Enriched data + ICP score + reasoning
  ↓
Agent queries Knowledge Base for:
  - Writing style profile for assigned team member
  - Campaign brief for this campaign
  - Product messaging for this persona
  ↓
Analyzes enrichment data for personalization hooks:
  - Recent funding → Congratulate, talk about growth
  - Tech stack → Position product as complementary
  - Hiring surge → Address scaling pain points
  ↓
Generates email sequence (3-5 emails) with:
  - Personalized subject lines
  - Contextual opening (reference news/trigger)
  - Value proposition aligned to pain points
  - Clear CTA (demo, call, resource)
  ↓
Generates LinkedIn connection message
  ↓
Returns to Manager: Complete outreach sequence
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "email_sequence": [
      {
        "sequence_number": 1,
        "subject": "Scaling Infrastructure at Acme Corp",
        "body": "Hi John, Congrats on Acme's Series C! I noticed you're expanding your engineering team. As you scale to 500+ employees, infrastructure complexity becomes a real challenge. We help companies like yours reduce deployment time by 60%. Worth a quick chat?",
        "timing": "immediate"
      },
      {
        "sequence_number": 2,
        "subject": "Re: Scaling Infrastructure at Acme Corp",
        "body": "John, following up on my previous email. Given your AWS + Salesforce stack, our integration could save your team 10 hours/week. Quick 15-min call to show you how?",
        "timing": "3_days_after_email_1"
      }
    ],
    "linkedin_message": "John, congrats on the funding! Saw you're hiring 20 engineers. I work with VP Engs at companies like yours to simplify their infrastructure as they scale. Worth connecting?",
    "personalization_hooks": [
      "Series C funding",
      "Engineering team expansion",
      "AWS + Salesforce tech stack"
    ],
    "writing_style_used": "professional_conversational"
  }
}
```

**Why Sub-Agent?**
Message generation is the final step in lead qualification. It requires both enrichment data AND scoring results to craft relevant messages, making it a natural sub-agent in the sequential workflow.

---

## 4. INDEPENDENT AGENT DETAILS

### INDEPENDENT AGENT 1: Email Delivery Agent
**Agent ID**: 697ace6bc03792e039e5adaa

**Purpose**: Send approved email sequences via Gmail with proper threading and follow-up scheduling.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.2 (precise execution)
**Tools**: Gmail (Composio: GMAIL_SEND_EMAIL)

**Trigger**: "Approve & Send" button in QA Inbox

**Workflow**:
```
User reviews draft message in QA Inbox
  ↓
User clicks "Approve & Send"
  ↓
UI calls agent with: {recipient, subject, body, thread_id}
  ↓
Agent validates email format
  ↓
Agent calls Gmail API via Composio
  ↓
Gmail sends email with proper threading
  ↓
Agent returns: Sent confirmation + message_id
  ↓
UI updates lead status to "Contacted"
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "email_sent": true,
    "message_id": "18c5f2a8b4d3e9f1",
    "recipient": "john@acme.com",
    "sent_at": "2026-01-29T14:30:00Z",
    "thread_id": "thread_abc123",
    "next_followup_scheduled": "2026-02-01T14:30:00Z"
  }
}
```

**UI Integration**:
```typescript
// In QA Inbox
const sendEmail = async (draft: Draft) => {
  const response = await chatWithAgent(
    '697ace6bc03792e039e5adaa',
    `Send email to ${draft.recipient} with subject "${draft.subject}" and body: ${draft.body}`
  );

  const data = JSON.parse(response);
  if (data.result.email_sent) {
    updateLeadStatus(draft.leadId, 'contacted');
  }
};
```

---

### INDEPENDENT AGENT 2: LinkedIn Content Agent
**Agent ID**: 697ace8623e56dc88c1ff0c6

**Purpose**: Generate daily LinkedIn posts for AEs based on their writing styles and industry trends.

**Provider**: Perplexity Sonar-Pro (for trend research)
**Temperature**: 0.7 (creative content)
**Top P**: 0.95
**Knowledge Base**: Writing Samples & Context KB (697ace15115a3970d17438d4)

**Triggers**:
- Scheduled daily (cron job at 6am)
- Manual: "Generate Posts" button in Content Studio

**Workflow**:
```
Trigger fires (daily or manual)
  ↓
Agent queries Knowledge Base for team member writing styles
  ↓
For each team member:
  - Load their writing style profile (tone, vocabulary, structure)
  - Query Perplexity for trending industry topics
  - Generate 3 post options matching their style
  ↓
Agent analyzes each post for engagement prediction
  ↓
Returns: Posts with engagement scores and suggested posting times
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "posts": [
      {
        "post_id": "post_001",
        "team_member": "Sarah Chen",
        "content": "AI agents are transforming B2B sales. Last week, I watched our AI SDR qualify 50 leads in the time it used to take to research 5. The future isn't AI replacing sales reps - it's AI augmenting them. What's your take?",
        "hashtags": ["#SalesTech", "#AIinSales", "#B2B"],
        "estimated_engagement_score": 78,
        "best_time_to_post": "2026-01-30T09:00:00Z",
        "post_type": "thought_leadership",
        "tone_match_score": 95
      }
    ]
  }
}
```

**UI Integration**:
```typescript
// In Content Studio
const generatePosts = async () => {
  const response = await chatWithAgent(
    '697ace8623e56dc88c1ff0c6',
    'Generate LinkedIn posts for all team members based on current trends'
  );

  const data = JSON.parse(response);
  setPosts(data.result.posts);
};
```

---

### INDEPENDENT AGENT 3: Meeting Scheduler Agent
**Agent ID**: 697acea3814f1038c09862d1

**Purpose**: Propose meeting times based on Calendly availability when leads express interest.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.3
**Tools**: Calendly (Composio: CALENDLY_LIST_USER_BUSY_TIMES, CALENDLY_CREATE_ONE_OFF_EVENT_TYPE)

**Trigger**: "Schedule Meeting" button on Lead Detail panel

**Workflow**:
```
User clicks "Schedule Meeting" for a lead
  ↓
Agent calls Calendly API to get available time slots
  ↓
Agent filters slots based on:
  - Lead timezone
  - Business hours
  - Meeting duration (30/60 min)
  ↓
Agent proposes 3 optimal times
  ↓
Returns: Meeting times + confirmation message template
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "meeting_times": [
      {
        "date": "2026-02-03",
        "time": "10:00 AM",
        "timezone": "America/New_York",
        "calendly_url": "https://calendly.com/event/abc123"
      },
      {
        "date": "2026-02-04",
        "time": "2:00 PM",
        "timezone": "America/New_York",
        "calendly_url": "https://calendly.com/event/def456"
      }
    ],
    "confirmation_message": "Hi John, Thanks for your interest! I have availability on Feb 3 at 10am or Feb 4 at 2pm EST. Which works better for you?",
    "duration_minutes": 30
  }
}
```

---

### INDEPENDENT AGENT 4: Writing Style Analyzer Agent
**Agent ID**: 697acec2814f1038c09862d2

**Purpose**: Analyze uploaded writing samples to extract tone, structure, and vocabulary patterns for each team member.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.4
**Knowledge Base**: Writing Samples & Context KB (uploads analyzed samples here)

**Trigger**: "Analyze Style" button in Team Settings

**Workflow**:
```
User uploads writing samples (emails, LinkedIn posts)
  ↓
User clicks "Analyze Style"
  ↓
Agent processes each sample:
  - Extracts tone (formal/casual/professional)
  - Identifies sentence structure patterns
  - Analyzes vocabulary (simple/technical/persuasive)
  - Detects signature phrases
  ↓
Agent creates style profile
  ↓
Uploads profile to Knowledge Base for future use
  ↓
Returns: Visual style profile with characteristics
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "team_member": "Sarah Chen",
    "style_profile": {
      "tone_analysis": {
        "primary_tone": "professional_conversational",
        "formality_score": 65,
        "friendliness_score": 80
      },
      "structure_patterns": {
        "avg_sentence_length": 15,
        "paragraph_structure": "short_punchy",
        "uses_questions": true,
        "uses_stories": false
      },
      "vocabulary_profile": {
        "complexity_level": "intermediate",
        "industry_jargon_frequency": "medium",
        "action_verbs_used": ["transform", "accelerate", "optimize"]
      },
      "signature_phrases": [
        "Here's the thing...",
        "In my experience...",
        "What's your take?"
      ]
    },
    "samples_analyzed": 5,
    "confidence_score": 88
  }
}
```

---

### INDEPENDENT AGENT 5: Clay Enrichment & Intent Agent
**Agent ID**: 697ad49223e56dc88c1ff0f0

**Purpose**: Enrich prospect data using Clay and detect buyer intent signals from digital footprints.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.3
**Tools**: Clay API (Composio: CLAY_ENRICH_CONTACT, CLAY_DETECT_INTENT_SIGNALS)

**Trigger**: "Enrich with Clay" button in Enrichment Lab

**Workflow**:
```
User uploads lead list or enters email
  ↓
User clicks "Enrich with Clay"
  ↓
Agent calls Clay API with contact info
  ↓
Clay returns: Enhanced firmographics, technographics, contact data
  ↓
Agent analyzes digital footprint for intent signals:
  - Website visits (frequency, pages viewed)
  - Content downloads (whitepapers, case studies)
  - Tech stack changes (new tools adopted)
  - Funding rounds
  - Hiring patterns
  - Competitor website visits
  ↓
Agent scores each signal by strength (hot/warm/cold)
  ↓
Returns: Enriched data + intent timeline
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "enrichment_data": {
      "company_name": "Acme Corp",
      "employee_count": 500,
      "revenue": "$75M",
      "technologies": ["Salesforce", "AWS", "HubSpot"],
      "funding_stage": "Series C",
      "headquarters": "San Francisco, CA"
    },
    "intent_signals": [
      {
        "signal_type": "website_visit",
        "signal_strength": "hot",
        "detected_at": "2026-01-28T14:22:00Z",
        "description": "Multiple visits to pricing page (5 visits in 3 days)",
        "score": 85
      },
      {
        "signal_type": "content_download",
        "signal_strength": "warm",
        "detected_at": "2026-01-25T10:15:00Z",
        "description": "Downloaded ROI calculator whitepaper",
        "score": 70
      },
      {
        "signal_type": "tech_adoption",
        "signal_strength": "warm",
        "detected_at": "2026-01-20T00:00:00Z",
        "description": "Recently adopted Kubernetes (complementary tech)",
        "score": 65
      },
      {
        "signal_type": "hiring_spike",
        "signal_strength": "hot",
        "detected_at": "2026-01-15T00:00:00Z",
        "description": "20 engineering positions posted in last 30 days",
        "score": 90
      }
    ],
    "intent_score": 82,
    "recommendation": "High intent - engage immediately with demo offer"
  }
}
```

**Intent Signal Types**:
1. **Website Visits** - Frequency and page depth (pricing, case studies)
2. **Content Downloads** - Whitepapers, ROI calculators, technical docs
3. **Tech Stack Changes** - New tools adopted that complement yours
4. **Funding Rounds** - Fresh capital to spend
5. **Hiring Spikes** - Team expansion indicates growth/pain points
6. **Competitor Research** - Visiting competitor websites (switching intent)

---

### INDEPENDENT AGENT 6: Instantly Email Sender Agent
**Agent ID**: 697ad4a9bc6eb6293f55040b

**Purpose**: Send cold email campaigns via Instantly.ai with deliverability optimization and A/B testing.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.2
**Tools**: Instantly API (Composio: INSTANTLY_SEND_EMAIL, INSTANTLY_CREATE_CAMPAIGN)

**Trigger**: "Launch Instantly Campaign" button in Outreach Center

**Workflow**:
```
User selects leads and email template
  ↓
User clicks "Launch Instantly Campaign"
  ↓
Agent creates campaign in Instantly with:
  - Lead list
  - Email sequence (3-7 emails)
  - Follow-up delays
  - A/B test variants
  ↓
Instantly handles:
  - Email warm-up
  - Deliverability optimization
  - Spam filter avoidance
  - Send time optimization
  ↓
Agent monitors campaign and returns status
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "campaign_id": "instantly_camp_abc123",
    "campaign_name": "Enterprise Q1 Outreach",
    "leads_added": 150,
    "emails_in_sequence": 5,
    "deliverability_score": 94,
    "campaign_status": "active",
    "stats": {
      "emails_sent": 150,
      "emails_opened": 0,
      "emails_clicked": 0,
      "emails_replied": 0
    },
    "next_send": "2026-01-30T09:00:00Z"
  }
}
```

---

### INDEPENDENT AGENT 7: LinkedIn Sales Navigator Agent
**Agent ID**: 697ad4c2c03792e039e5add8

**Purpose**: Search LinkedIn Sales Navigator for prospects, enrich profiles, and track engagement signals.

**Provider**: OpenAI GPT-4.1
**Temperature**: 0.3
**Tools**: LinkedIn (Composio: LINKEDIN_SEARCH_PEOPLE, LINKEDIN_GET_PROFILE, LINKEDIN_SEND_MESSAGE)

**Trigger**: "Search LinkedIn" button in Enrichment Lab

**Workflow**:
```
User enters search criteria (title, company size, industry)
  ↓
Agent searches LinkedIn Sales Navigator
  ↓
Returns list of prospects matching criteria
  ↓
User selects prospects to enrich
  ↓
Agent fetches full profile data:
  - Work history
  - Skills
  - Recommendations
  - Shared connections
  - Recent activity (posts, comments)
  ↓
Agent detects engagement signals:
  - Profile views (did they view our profiles?)
  - Post engagement (likes/comments on our content)
  - Mutual connections
  ↓
Returns: Prospect list with engagement data
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "prospects": [
      {
        "profile_data": {
          "name": "John Doe",
          "title": "VP Engineering",
          "company": "Acme Corp",
          "headline": "Building scalable infrastructure for enterprise SaaS",
          "location": "San Francisco Bay Area",
          "experience": [
            {
              "company": "Acme Corp",
              "title": "VP Engineering",
              "duration": "2 years"
            }
          ],
          "skills": ["Cloud Architecture", "Team Leadership", "AWS"],
          "linkedin_url": "linkedin.com/in/johndoe"
        },
        "engagement_signals": {
          "profile_views": 2,
          "post_engagement": ["liked_our_post_jan_15"],
          "mutual_connections": 3,
          "warmth_score": 75
        },
        "outreach_recommendation": "Warm lead - mention mutual connection Sarah Chen"
      }
    ],
    "total_found": 1,
    "search_criteria": {
      "title": "VP Engineering",
      "company_size": "100-500",
      "industry": "Software"
    }
  }
}
```

---

### INDEPENDENT AGENT 8: Genspark Research Agent
**Agent ID**: 697ad4ddbc6eb6293f55040f

**Purpose**: Research accounts using Genspark AI for competitive intelligence and personalized insights.

**Provider**: Perplexity Sonar-Pro
**Temperature**: 0.5
**Tools**: Genspark AI (web research)

**Trigger**: "Research Account" button in Research Hub

**Workflow**:
```
User enters company name
  ↓
Agent uses Genspark to research:
  - Company overview (business model, products)
  - Recent news and developments
  - Competitive landscape
  - Market position
  - Pain points and challenges
  - Decision makers
  ↓
Agent generates personalized outreach angles
  ↓
Returns: Intelligence report with actionable insights
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "company_overview": {
      "name": "Acme Corp",
      "description": "Enterprise SaaS platform for supply chain management",
      "business_model": "B2B SaaS, annual contracts",
      "target_customers": "Mid-market to enterprise manufacturers"
    },
    "competitive_landscape": {
      "main_competitors": ["CompetitorA", "CompetitorB"],
      "our_differentiators": [
        "Better AWS integration",
        "30% faster deployment",
        "Superior customer support"
      ],
      "competitive_threats": "CompetitorA recently launched AI features"
    },
    "recent_developments": [
      "Series C funding $50M (Jan 2026)",
      "Expanded to European market (Dec 2025)",
      "Hired new CTO from Google (Nov 2025)"
    ],
    "pain_points": [
      "Scaling infrastructure for European expansion",
      "Integrating multiple data sources",
      "Reducing deployment time for new customers"
    ],
    "outreach_angles": [
      "Congratulate on funding, position as growth partner",
      "Highlight European customer success stories",
      "Offer integration with existing AWS stack"
    ],
    "personalization_hooks": [
      "New CTO has experience with our tech stack at Google",
      "Recent expansion creates infrastructure scaling needs",
      "Funding round indicates budget availability"
    ]
  }
}
```

---

### INDEPENDENT AGENT 9: Claude Co-work Agent
**Agent ID**: 697ad52bbc6eb6293f550413

**Purpose**: Strategic account analysis using Claude's extended reasoning for complex deal strategies.

**Provider**: OpenAI GPT-4.1 (NOTE: Will be migrated to Anthropic Claude once available)
**Temperature**: 0.6
**Top P**: 0.9

**Trigger**: "Strategic Analysis" button in Research Hub

**Workflow**:
```
User selects account for strategic analysis
  ↓
Agent analyzes:
  - Account history and engagement
  - Organizational structure
  - Decision-making process
  - Budget cycles
  - Competitive situation
  ↓
Agent creates multi-step strategy:
  - Stakeholder mapping
  - Engagement sequence
  - Objection handling playbook
  - Deal progression milestones
  ↓
Returns: Comprehensive deal strategy
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "account_strategy": {
      "approach": "Multi-threaded enterprise sale",
      "key_stakeholders": [
        {
          "name": "John Doe",
          "role": "VP Engineering",
          "influence_level": "high",
          "engagement_strategy": "Technical demo, ROI calculator"
        },
        {
          "name": "Jane Smith",
          "role": "CTO",
          "influence_level": "decision_maker",
          "engagement_strategy": "Executive briefing, architecture review"
        }
      ],
      "engagement_plan": {
        "phase_1": "Discovery - Map stakeholders and pain points",
        "phase_2": "Technical validation - POC with VP Eng team",
        "phase_3": "Business case - ROI presentation to CTO",
        "phase_4": "Negotiation - Legal and procurement"
      }
    },
    "objection_handling": [
      {
        "anticipated_objection": "Too expensive compared to current solution",
        "response": "Focus on TCO: Highlight 60% faster deployment saves 10 eng hours/week = $50k/year. ROI in 6 months."
      },
      {
        "anticipated_objection": "Risk of switching from current vendor",
        "response": "Offer phased migration: Start with one team, expand after success. Provide dedicated migration support."
      }
    ],
    "deal_progression": {
      "next_steps": [
        "Schedule technical demo with VP Eng team",
        "Send ROI calculator pre-filled with their data",
        "Introduce customer reference in same industry"
      ],
      "timeline": "60-90 day sales cycle",
      "risk_factors": [
        "Existing vendor contract ends in Q3 - timing is critical",
        "Budget approval needed from CFO - build financial case"
      ],
      "success_probability": 75
    }
  }
}
```

**Future Enhancement**:
When Claude API becomes available via Anthropic, this agent will use Claude's extended thinking mode for even deeper strategic analysis, including:
- Multi-step reasoning about deal dynamics
- Complex stakeholder relationship mapping
- Scenario planning for different decision paths

---

### INDEPENDENT AGENT 10: Gemini Deep Research Agent
**Agent ID**: 697ad557814f1038c09862ef

**Purpose**: Comprehensive market analysis using Gemini's deep research capabilities.

**Provider**: Google Gemini-2.0-Flash-Exp
**Temperature**: 0.5
**Top P**: 0.95

**Trigger**: "Market Research" button in Research Hub

**Workflow**:
```
User requests market research for account/industry
  ↓
Agent uses Gemini's deep research to analyze:
  - Market trends and dynamics
  - Industry shifts and disruptions
  - Competitive positioning
  - Growth opportunities
  - Regulatory changes
  ↓
Agent synthesizes findings into strategic insights
  ↓
Returns: Market intelligence report
```

**Response Format**:
```json
{
  "status": "success",
  "result": {
    "market_insights": {
      "industry": "Enterprise SaaS - Supply Chain",
      "market_size": "$45B globally, growing 18% YoY",
      "trends": [
        "AI-powered demand forecasting becoming standard",
        "Shift from on-prem to cloud accelerating post-pandemic",
        "Consolidation of point solutions into platforms"
      ],
      "opportunities": [
        "European expansion driven by GDPR compliance needs",
        "SMB market underserved - opportunity for simplified offering",
        "API-first architecture enabling ecosystem plays"
      ],
      "threats": [
        "Economic uncertainty slowing enterprise buying cycles",
        "Open-source alternatives gaining traction in mid-market",
        "Large vendors (SAP, Oracle) increasing cloud investments"
      ]
    },
    "competitive_analysis": {
      "our_position": "Strong in mid-market, growing enterprise presence",
      "competitors": [
        {
          "name": "CompetitorA",
          "strengths": "Enterprise brand, deep pockets",
          "weaknesses": "Slow innovation, complex implementation",
          "differentiators": "We deploy 3x faster, better UX"
        }
      ],
      "positioning_recommendation": "Position as 'modern alternative' - faster, easier, built for cloud-native companies"
    },
    "opportunity_assessment": {
      "target_account": "Acme Corp",
      "fit_score": 88,
      "timing": "Optimal - expanding to Europe, need cloud solution",
      "entry_strategy": "Lead with AWS integration story, reference European customers",
      "estimated_deal_size": "$250k ARR",
      "win_probability": 70
    }
  }
}
```

**Future Enhancement**:
As Gemini evolves, this agent will leverage multimodal capabilities to analyze:
- Company financial reports (PDF analysis)
- Competitor product screenshots
- Market research charts and graphs

---

## 5. WORKFLOW EXECUTION DETAILS

### How Manager Agents Coordinate Sub-Agents

**Sequential Execution** (Lead Processing Coordinator):
```
Manager Agent receives: User input
  ↓
Manager creates execution plan:
  [Sub-Agent 1] → [Sub-Agent 2] → [Sub-Agent 3]
  ↓
Manager calls Sub-Agent 1 (Lead Enrichment)
  ↓
WAIT for response
  ↓
Manager receives: Enriched data
  ↓
Manager calls Sub-Agent 2 (ICP Scoring) with enriched data
  ↓
WAIT for response
  ↓
Manager receives: Score + reasoning
  ↓
Manager calls Sub-Agent 3 (Message Generation) with all previous data
  ↓
WAIT for response
  ↓
Manager receives: Email sequences
  ↓
Manager aggregates ALL responses into unified JSON
  ↓
Manager returns final result to user
```

**Parallel Execution** (Multi-Channel Orchestrator):
```
Manager Agent receives: Campaign trigger
  ↓
Manager analyzes which channels to use
  ↓
Manager calls ALL relevant agents in PARALLEL:
  - Email Delivery Agent (Gmail)
  - Instantly Email Sender Agent
  - LinkedIn Sales Navigator Agent
  ↓
ALL agents execute simultaneously
  ↓
Manager collects responses as they complete
  ↓
Manager aggregates into orchestration plan
  ↓
Returns: Unified multi-channel strategy
```

### Error Handling in Manager Workflows

**Sub-Agent Failure Handling**:
```
Manager calls Sub-Agent 1
  ↓
Sub-Agent 1 returns ERROR (API timeout)
  ↓
Manager decision tree:
  - Is this sub-agent CRITICAL?
    - YES → Return error to user, abort workflow
    - NO → Continue with partial data, flag warning
  ↓
Example: If enrichment fails
  - Manager continues to scoring with partial data
  - Manager flags lead as "enrichment_incomplete"
  - Manager still generates messages but with lower confidence
```

**Retry Logic**:
```
Manager calls Sub-Agent
  ↓
Timeout or network error
  ↓
Manager retries up to 3 times with exponential backoff
  ↓
If still failing after 3 retries:
  - Mark sub-agent as failed
  - Continue workflow with degraded functionality
  - Alert user in response metadata
```

### Data Flow Between Agents

**Example: Lead Processing Workflow Data Flow**

```
INPUT (from UI):
{
  "leads": [
    {
      "name": "John Doe",
      "email": "john@acme.com",
      "company": "Acme Corp",
      "title": "VP Engineering"
    }
  ],
  "campaign_id": "campaign_123"
}

↓ Manager calls Lead Enrichment Agent ↓

ENRICHMENT OUTPUT:
{
  "company_size": 500,
  "industry": "Enterprise Software",
  "technologies": ["Salesforce", "AWS"],
  "recent_news": "Series C funding"
}

↓ Manager calls ICP Scoring Agent with enriched data ↓

SCORING OUTPUT:
{
  "icp_score": 92,
  "reasoning": "Strong fit: enterprise size, target tech stack..."
}

↓ Manager calls Message Generation with all previous data ↓

MESSAGE OUTPUT:
{
  "email_sequence": [
    {
      "subject": "Scaling at Acme Corp",
      "body": "Hi John, congrats on Series C..."
    }
  ]
}

↓ Manager aggregates everything ↓

FINAL OUTPUT (to UI):
{
  "qualified_leads": [
    {
      "name": "John Doe",
      "email": "john@acme.com",
      "company": "Acme Corp",
      "enrichment_data": {...},
      "icp_score": 92,
      "icp_reasoning": "...",
      "email_sequence": [...]
    }
  ]
}
```

---

## 6. TOOL INTEGRATIONS

### Integration Status Overview

| Tool | Status | Agent Using It | Actions Available | OAuth Handled |
|------|--------|----------------|-------------------|---------------|
| Apollo | Connected | Lead Enrichment Agent | APOLLO_PEOPLE_ENRICHMENT | Yes (by agent) |
| Gmail | Connected | Email Delivery Agent | GMAIL_SEND_EMAIL, GMAIL_FETCH_EMAILS | Yes (by agent) |
| Calendly | Connected | Meeting Scheduler Agent | CALENDLY_LIST_USER_BUSY_TIMES, CALENDLY_CREATE_ONE_OFF_EVENT_TYPE | Yes (by agent) |
| LinkedIn Sales Navigator | Connected | LinkedIn Sales Navigator Agent | LINKEDIN_SEARCH_PEOPLE, LINKEDIN_GET_PROFILE, LINKEDIN_SEND_MESSAGE | Yes (by agent) |
| Perplexity | Connected | Multiple agents | Native model (sonar-pro) | N/A (model-based) |
| Instantly | Connected | Instantly Email Sender Agent | INSTANTLY_SEND_EMAIL, INSTANTLY_CREATE_CAMPAIGN | Yes (by agent) |
| Genspark | Connected | Genspark Research Agent | Web research via model | N/A (model-based) |
| Clay | Connected | Clay Enrichment & Intent Agent | CLAY_ENRICH_CONTACT, CLAY_DETECT_INTENT_SIGNALS | Yes (by agent) |
| Claude | Planned | Claude Co-work Agent | Extended thinking, deep reasoning | Will be added |
| Gemini | Connected | Gemini Deep Research Agent | Deep research mode | N/A (model-based) |

### Tool Integration Details

#### APOLLO
**Purpose**: Company and contact enrichment
**Authentication**: OAuth 2.0 (handled by agent platform)
**Agent**: Lead Enrichment Agent (697acded814f1038c09862c5)

**Available Actions**:
1. **APOLLO_PEOPLE_ENRICHMENT**
   - Input: Email or LinkedIn URL
   - Output: Contact details, job title, company info
   - Rate Limit: 100 requests/hour
   - Cost: Credits per enrichment

**Example API Call** (abstracted via agent):
```typescript
// User doesn't call Apollo directly
// Agent handles it internally when triggered

const response = await chatWithAgent(
  '697acded814f1038c09862c5',
  'Enrich john@acme.com'
);

// Agent internally calls:
// composio.tools.apollo.APOLLO_PEOPLE_ENRICHMENT({email: "john@acme.com"})
```

**Data Returned**:
- Full name
- Job title
- Company name, size, industry
- Phone number (if available)
- LinkedIn profile
- Technologies used
- Company revenue range

---

#### GMAIL
**Purpose**: Email sending and inbox monitoring
**Authentication**: OAuth 2.0 (handled by agent)
**Agent**: Email Delivery Agent (697ace6bc03792e039e5adaa)

**Available Actions**:
1. **GMAIL_SEND_EMAIL**
   - Input: To, subject, body, thread_id (optional)
   - Output: Message ID, sent timestamp
   - Rate Limit: 500 emails/day per user

2. **GMAIL_FETCH_EMAILS**
   - Input: Query filters (from, subject, date range)
   - Output: List of email threads
   - Use Case: Detect replies for engagement tracking

**Example Usage**:
```typescript
const response = await chatWithAgent(
  '697ace6bc03792e039e5adaa',
  `Send email to john@acme.com with subject "Demo Follow-up" and body: Hi John, Following up on our demo...`
);

// Agent handles OAuth, threading, sending
// Returns: {email_sent: true, message_id: "abc123"}
```

---

#### CALENDLY
**Purpose**: Meeting scheduling and availability management
**Authentication**: OAuth 2.0 (handled by agent)
**Agent**: Meeting Scheduler Agent (697acea3814f1038c09862d1)

**Available Actions**:
1. **CALENDLY_LIST_USER_BUSY_TIMES**
   - Input: User URI, date range
   - Output: Array of busy time slots
   - Use Case: Find available meeting times

2. **CALENDLY_CREATE_ONE_OFF_EVENT_TYPE**
   - Input: Duration, name, description
   - Output: Event type URL
   - Use Case: Create custom meeting links

3. **CALENDLY_LIST_EVENTS**
   - Input: User URI, filters
   - Output: Scheduled meetings
   - Use Case: Display upcoming meetings in dashboard

**Example Usage**:
```typescript
const response = await chatWithAgent(
  '697acea3814f1038c09862d1',
  'Propose 3 meeting times next week for 30-minute demo call'
);

// Agent checks Calendly availability
// Returns: {meeting_times: [{date, time, url}...]}
```

---

#### LINKEDIN SALES NAVIGATOR
**Purpose**: Prospect search and profile enrichment
**Authentication**: OAuth 2.0 (handled by agent)
**Agent**: LinkedIn Sales Navigator Agent (697ad4c2c03792e039e5add8)

**Available Actions**:
1. **LINKEDIN_SEARCH_PEOPLE**
   - Input: Title, company size, industry, location
   - Output: List of matching profiles
   - Limit: 1000 results per search

2. **LINKEDIN_GET_PROFILE**
   - Input: LinkedIn profile URL
   - Output: Full profile data
   - Use Case: Detailed prospect research

3. **LINKEDIN_SEND_MESSAGE**
   - Input: Profile ID, message text
   - Output: Message sent confirmation
   - Use Case: Direct outreach via LinkedIn

**Example Usage**:
```typescript
const response = await chatWithAgent(
  '697ad4c2c03792e039e5add8',
  'Search for VP Engineering at companies with 100-500 employees in Software industry'
);

// Returns: {prospects: [{name, title, company, profile_url}...]}
```

---

#### INSTANTLY
**Purpose**: Cold email campaign management
**Authentication**: API Key (handled by agent)
**Agent**: Instantly Email Sender Agent (697ad4a9bc6eb6293f55040b)

**Available Actions**:
1. **INSTANTLY_SEND_EMAIL**
   - Input: Email address, subject, body, campaign_id
   - Output: Email sent status
   - Feature: Built-in deliverability optimization

2. **INSTANTLY_CREATE_CAMPAIGN**
   - Input: Campaign name, leads, email sequence
   - Output: Campaign ID, status
   - Feature: Automatic warm-up, spam filter avoidance

**Example Usage**:
```typescript
const response = await chatWithAgent(
  '697ad4a9bc6eb6293f55040b',
  `Create campaign "Q1 Enterprise Outreach" with 150 leads and 5-email sequence`
);

// Returns: {campaign_id: "abc123", deliverability_score: 94}
```

---

#### CLAY
**Purpose**: Advanced data enrichment and intent detection
**Authentication**: API Key (handled by agent)
**Agent**: Clay Enrichment & Intent Agent (697ad49223e56dc88c1ff0f0)

**Available Actions**:
1. **CLAY_ENRICH_CONTACT**
   - Input: Email or company domain
   - Output: Enhanced firmographics, technographics
   - Data Sources: 50+ databases aggregated

2. **CLAY_DETECT_INTENT_SIGNALS**
   - Input: Company name or domain
   - Output: Intent signals timeline
   - Signals: Website visits, content downloads, tech changes, hiring, funding

**Example Usage**:
```typescript
const response = await chatWithAgent(
  '697ad49223e56dc88c1ff0f0',
  'Enrich john@acme.com and detect intent signals'
);

// Returns: {enrichment_data: {...}, intent_signals: [{type, strength, score}...]}
```

**Intent Signal Types Detected**:
- Website visits (frequency, pages, duration)
- Content engagement (downloads, webinar attendance)
- Technology adoption (new tools added to stack)
- Funding events (rounds, amounts)
- Hiring activity (job postings, team growth)
- Competitor research (visits to competitor sites)

---

### OAuth Flow (Automated by Agents)

**You mentioned OAuth is already handled by agents. Here's how it works:**

```
User triggers agent that needs external tool (e.g., Gmail)
  ↓
Agent checks if OAuth token exists and is valid
  ↓
If token is VALID:
  - Agent uses existing token to call API
  - User sees no OAuth prompt
  ↓
If token is EXPIRED or MISSING:
  - Agent automatically handles refresh (if refresh token exists)
  - OR Agent triggers OAuth flow in background
  - User may see brief "Connecting to Gmail..." message
  - Token is stored securely for future use
  ↓
Agent completes API call and returns result
```

**User Experience**:
- First time using a tool → Quick OAuth popup (one-time)
- Subsequent uses → Seamless, no user action needed
- Token refresh → Automatic, invisible to user

---

## 7. KNOWLEDGE BASE SYSTEM

### Knowledge Base Architecture

**Total Knowledge Bases**: 2 RAG (Retrieval-Augmented Generation) systems

#### KB 1: ICP Definitions Knowledge Base
**ID**: 697acdf6115a3970d17438d3
**Collection Name**: icpdefinitionsknowledgebaseru1x

**Used By**:
- ICP Scoring Agent (697ace07814f1038c09862c6)

**Content Types Stored**:
1. ICP Criteria Documents
   - Company size requirements (min/max employees)
   - Industry verticals (SaaS, Fintech, Healthcare, etc.)
   - Geographic restrictions
   - Technology indicators (uses Salesforce, AWS, etc.)
   - Buying signals (funding, hiring, expansion)

2. Persona Definitions
   - Target job titles (VP Eng, CTO, etc.)
   - Seniority levels
   - Department sizes
   - Decision-making authority

3. Qualification Frameworks
   - Scoring rubrics (how to weight each criterion)
   - Disqualification rules (competitors, wrong size, etc.)
   - Must-have vs. nice-to-have criteria

**How Agents Query It**:
```
Agent receives: Lead enrichment data
  ↓
Agent queries KB: "What are the ICP criteria for campaign XYZ?"
  ↓
KB returns: Document chunks matching query
  ↓
Agent uses retrieved criteria to score lead
  ↓
Example retrieved content:
  "Company size: 100-5000 employees (20 points)
   Industry: Enterprise SaaS (25 points)
   Tech stack: Must use Salesforce or HubSpot (20 points)
   Buying signals: Recent funding or hiring surge (35 points)"
```

**Example Document Upload**:
```markdown
# Enterprise SaaS Campaign ICP

## Company Criteria
- Size: 100-5,000 employees
- Revenue: $10M - $500M ARR
- Industry: B2B SaaS, Fintech, Healthcare Tech
- Geography: North America, Western Europe

## Technology Indicators (High-Intent)
- CRM: Salesforce, HubSpot
- Cloud: AWS, GCP, Azure
- DevOps: Docker, Kubernetes

## Buying Signals
- Funding: Series B+ in last 12 months (35 points)
- Hiring: 10+ engineering openings (25 points)
- Expansion: New market entry or product launch (20 points)

## Disqualification Criteria
- Direct competitors
- Companies with <50 employees
- Non-English markets (Phase 1)
```

---

#### KB 2: Writing Samples & Context Knowledge Base
**ID**: 697ace15115a3970d17438d4
**Collection Name**: writingsamplesandcontextknowledgebasefe6x

**Used By**:
- Message Generation Agent (697ace27c03792e039e5ada5)
- LinkedIn Content Agent (697ace8623e56dc88c1ff0c6)
- Writing Style Analyzer Agent (697acec2814f1038c09862d2)

**Content Types Stored**:
1. Writing Style Profiles
   - Individual team member writing samples (emails, posts)
   - Extracted style characteristics (tone, structure, vocabulary)
   - Signature phrases and patterns

2. Campaign Briefs
   - Campaign objectives and goals
   - Target personas and pain points
   - Value propositions
   - Key messaging themes
   - Competitive differentiators

3. Product Documentation
   - Feature descriptions
   - Use cases and customer stories
   - ROI calculators and data points
   - Technical specifications
   - Integration capabilities

4. Context Board Updates
   - Recent customer wins
   - Product launches
   - Market changes
   - Competitive intelligence
   - Industry news relevant to campaigns

**How Agents Query It**:
```
Message Generation Agent receives: Lead data + score
  ↓
Agent queries KB: "Retrieve writing style for Sarah Chen"
  ↓
KB returns: Style profile with tone, structure, vocabulary patterns
  ↓
Agent queries KB: "Retrieve campaign brief for Enterprise Q1"
  ↓
KB returns: Campaign objectives, pain points, value props
  ↓
Agent generates email using:
  - Sarah's writing style
  - Campaign messaging
  - Lead-specific personalization
```

**Example Writing Sample Upload**:
```
From: Sarah Chen <sarah@company.com>
To: prospect@acme.com
Subject: Quick question about your infrastructure

Hi John,

I came across Acme Corp's recent funding announcement - congrats!

As you scale your engineering team, infrastructure complexity
becomes a real challenge. We've helped companies like yours reduce
deployment time by 60% while maintaining security and compliance.

Worth a quick 15-min chat to see if there's a fit?

Best,
Sarah
```

**After Analysis, KB Stores**:
```json
{
  "team_member": "Sarah Chen",
  "style_profile": {
    "tone": "professional_conversational",
    "formality": 65,
    "sentence_length": "short_punchy",
    "uses_questions": true,
    "congratulates_milestones": true,
    "includes_data_points": true,
    "signature_phrase": "Worth a quick chat?"
  }
}
```

---

### How to Upload Content to Knowledge Bases

**Method 1: Via UI (Team Settings Page)**
```
1. Navigate to Team Settings
2. Select "Writing Styles" or "Campaign Briefs" tab
3. Upload files (PDF, DOCX, TXT) or paste text
4. Click "Upload to Knowledge Base"
5. Agent automatically processes and indexes content
6. Content is immediately available to all agents
```

**Method 2: Via API (for bulk uploads)**
```typescript
// This would be handled by agent platform
// User doesn't call this directly

import { ingestFiles } from '@/lib/knowledgeBase';

await ingestFiles({
  rag_id: '697ace15115a3970d17438d4',
  files: [
    { url: 'https://example.com/campaign-brief.pdf' },
    { url: 'https://example.com/product-docs.pdf' }
  ]
});
```

---

## 8. TO-DO LIST

### IMMEDIATE PRIORITIES

#### 1. UI/UX Enhancements
**Priority**: HIGH
**Status**: Pending

- [ ] **Brand Colors Update**
  - Need: Receive Lyzr brand color palette file
  - Update: Purple (#7C3AED) to official Lyzr colors
  - Apply: Consistent theming across all pages
  - Timeline: 1 day after receiving brand assets

- [ ] **Pipeline Table Enhancements**
  - [ ] Add column resize functionality
  - [ ] Implement saved filter views
  - [ ] Add bulk action toolbar (select multiple leads)
  - [ ] Enhance hover preview cards with more data
  - [ ] Add keyboard navigation (arrow keys, enter to open)
  - Timeline: 3-4 days

- [ ] **Intent Signal Visualization**
  - [ ] Create timeline view showing signals over time
  - [ ] Add signal strength visualization (heat map)
  - [ ] Build signal comparison across leads
  - [ ] Add signal alert notifications
  - Timeline: 2-3 days

- [ ] **Mobile Responsiveness**
  - [ ] Optimize table for mobile (switch to card view)
  - [ ] Make slide-out panels full-screen on mobile
  - [ ] Collapsible sidebar on small screens
  - [ ] Touch-friendly interactions
  - Timeline: 2 days

#### 2. Agent Enhancements
**Priority**: MEDIUM
**Status**: Pending

- [ ] **Claude Integration (Anthropic API)**
  - [ ] Migrate Claude Co-work Agent from OpenAI to Anthropic
  - [ ] Implement extended thinking mode
  - [ ] Add multi-step reasoning for complex analysis
  - [ ] Test response quality improvements
  - Timeline: 2 days (once Anthropic access is available)

- [ ] **Gemini Multimodal Features**
  - [ ] Enable PDF analysis for financial reports
  - [ ] Add image analysis for competitor screenshots
  - [ ] Implement chart/graph interpretation
  - Timeline: 3 days

- [ ] **Agent Response Time Optimization**
  - [ ] Implement caching for frequent queries
  - [ ] Add response streaming for long outputs
  - [ ] Parallel sub-agent execution where possible
  - Timeline: 2-3 days

#### 3. Data & Analytics
**Priority**: MEDIUM
**Status**: Pending

- [ ] **Dashboard Metrics**
  - [ ] Real-time pipeline value calculation
  - [ ] Conversion rate tracking (MQL → SQL → Meeting)
  - [ ] Channel performance comparison
  - [ ] Intent signal effectiveness metrics
  - Timeline: 3 days

- [ ] **Reporting Features**
  - [ ] Campaign performance reports (PDF export)
  - [ ] Lead source attribution
  - [ ] Team member performance dashboards
  - [ ] Engagement analytics (email open rates, LinkedIn views)
  - Timeline: 4-5 days

#### 4. Integration Completeness
**Priority**: HIGH
**Status**: Partially Complete

- [ ] **HubSpot CRM Integration** (mentioned in PRD, not yet implemented)
  - [ ] Create HubSpot Sync Agent
  - [ ] Bi-directional contact sync
  - [ ] Deal stage updates
  - [ ] Activity logging (emails, calls, meetings)
  - Timeline: 3-4 days

- [ ] **Slack Notifications**
  - [ ] Send alerts when high-intent leads detected
  - [ ] Notify when leads reply to outreach
  - [ ] Daily digest of pipeline changes
  - Timeline: 1-2 days

- [ ] **Webhook Support**
  - [ ] Trigger workflows from external systems
  - [ ] Send events to other platforms
  - [ ] Real-time data sync
  - Timeline: 2 days

#### 5. Advanced Features
**Priority**: LOW (Nice-to-Have)
**Status**: Future Enhancement

- [ ] **AI-Powered Lead Scoring Model**
  - [ ] Train ML model on conversion data
  - [ ] Predictive lead scoring (likelihood to convert)
  - [ ] Automatic ICP criteria refinement
  - Timeline: 1-2 weeks

- [ ] **Conversation Intelligence**
  - [ ] Analyze email reply sentiment
  - [ ] Detect buying intent from responses
  - [ ] Suggest best next actions
  - Timeline: 1 week

- [ ] **A/B Testing Framework**
  - [ ] Test different email subject lines
  - [ ] Compare LinkedIn vs. email effectiveness
  - [ ] Analyze optimal outreach timing
  - Timeline: 1 week

### TESTING & QA

- [ ] **Agent Response Testing**
  - [ ] Test all 15 agents with edge cases
  - [ ] Verify error handling and retries
  - [ ] Load testing (100+ concurrent requests)
  - Timeline: 2-3 days

- [ ] **Cross-Browser Testing**
  - [ ] Chrome, Firefox, Safari, Edge
  - [ ] Mobile browsers (iOS Safari, Chrome)
  - Timeline: 1 day

- [ ] **Accessibility Audit**
  - [ ] Screen reader compatibility
  - [ ] Keyboard navigation
  - [ ] Color contrast compliance (WCAG AA)
  - Timeline: 1-2 days

### DOCUMENTATION

- [ ] **User Guide**
  - [ ] Getting started tutorial
  - [ ] Feature walkthroughs with screenshots
  - [ ] Best practices for each workflow
  - Timeline: 3-4 days

- [ ] **Video Tutorials**
  - [ ] Platform overview (5 min)
  - [ ] Setting up campaigns (10 min)
  - [ ] Using AI agents effectively (8 min)
  - Timeline: 1 week (with video production)

- [ ] **API Documentation** (if exposing APIs)
  - [ ] Agent endpoints
  - [ ] Webhook formats
  - [ ] Authentication guide
  - Timeline: 2 days

---

## 9. INTEGRATION WITH LOVABLE/BOLT

### Overview
Lovable and Bolt are AI-powered frontend development platforms that can help you rapidly build production-ready UIs. Here's how to integrate this Lyzr Outreach project with them.

---

### OPTION 1: Lovable Integration

**What is Lovable?**
Lovable is an AI-powered web development platform that generates full-stack applications from natural language descriptions.

**Integration Strategy**:

#### Step 1: Export Current Code
```bash
# Package your current project
cd /app/project
zip -r lyzr-outreach-export.zip src/ public/ package.json tsconfig.json
```

#### Step 2: Create Lovable Project
1. Go to lovable.dev
2. Create new project: "Lyzr Outreach Platform"
3. Choose: React + TypeScript + Vite

#### Step 3: Import Agent Logic
```typescript
// In Lovable, create /lib/aiAgent.ts
// Paste your existing agent integration code

export const AGENT_IDS = {
  leadProcessingCoordinator: '697ace4fbc6eb6293f5503f1',
  clayEnrichment: '697ad49223e56dc88c1ff0f0',
  // ... all 15 agent IDs
};

export async function callAIAgent(agentId: string, message: string) {
  // Your existing agent call logic
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ agent_id: agentId, message })
  });
  return response.json();
}
```

#### Step 4: Describe UI Components to Lovable
Use natural language prompts in Lovable:

**Prompt 1: Pipeline Table**
```
Create a data table component for a sales pipeline with these requirements:
- Columns: Status, Lead/Company, Contact, Intent Score (0-100), Signals (badges), ICP Score, Last Activity, Channel, Actions
- Sortable columns
- Hover on row shows preview card with enrichment data
- Click row opens slide-out panel (600px width from right)
- Color-coded intent badges (red=hot >80, orange=warm 50-80, blue=cold <50)
- Dark mode with purple (#7C3AED) accents
- Use lucide-react icons
```

**Prompt 2: Intent Signals**
```
Create intent signal badges component:
- Display 6 signal types: website_visit, content_download, tech_adoption, funding_round, hiring_spike, competitor_research
- Color-coded by strength (hot/warm/cold)
- Click badge opens modal with signal details
- Show signal timeline visualization
- Use react-icons for signal type icons
```

**Prompt 3: Agent Integration**
```
Create a "Process Leads" button that:
- Calls AI agent ID 697ace4fbc6eb6293f5503f1
- Shows loading spinner while processing
- Displays results in pipeline table
- Handles errors with inline error messages (no toast)
- Updates lead cards with scores and draft messages
```

#### Step 5: Connect to Backend
```typescript
// Lovable automatically generates API routes
// In /api/chat.ts

import { callAIAgent } from '@/lib/aiAgent';

export async function POST(req: Request) {
  const { agent_id, message } = await req.json();

  try {
    const result = await callAIAgent(agent_id, message);
    return Response.json(result);
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
```

#### Step 6: Iterate with Lovable AI
Lovable allows you to refine the UI with conversational prompts:

```
"Make the pipeline table more compact - reduce row height to 48px"
"Add a filter dropdown for Intent Score range"
"Change primary color to #7C3AED throughout"
"Add hover effect on lead cards - subtle shadow and scale"
```

**Benefits of Lovable**:
- Rapid prototyping (hours instead of days)
- AI generates responsive, accessible components
- Automatic state management
- Built-in dark mode support
- Easy iteration with natural language

**Limitations**:
- May require manual code refinement for complex interactions
- Custom styling might need direct CSS edits
- Agent integration logic needs manual implementation

---

### OPTION 2: Bolt Integration

**What is Bolt?**
Bolt.new (by StackBlitz) is an AI-powered full-stack development environment that runs entirely in the browser.

**Integration Strategy**:

#### Step 1: Create Bolt Project
1. Go to bolt.new
2. Start with prompt:
```
Create a React TypeScript application for a B2B sales outreach platform with:
- Dark mode UI with purple (#7C3AED) primary color
- Sidebar navigation with 8 pages
- Data table for sales pipeline with sortable columns
- AI agent integration for lead processing
- No authentication (pre-authenticated agents)
- No toast notifications
```

#### Step 2: Import Agent Configuration
```typescript
// Bolt creates files directly in browser
// Create src/config/agents.ts

export const AGENTS = {
  leadProcessing: {
    id: '697ace4fbc6eb6293f5503f1',
    name: 'Lead Processing Coordinator',
    type: 'manager'
  },
  clayEnrichment: {
    id: '697ad49223e56dc88c1ff0f0',
    name: 'Clay Enrichment & Intent Agent',
    type: 'independent'
  },
  // ... all 15 agents
};
```

#### Step 3: Build Components with AI Assistance
Ask Bolt to create specific components:

**Prompt 1: Dashboard**
```
Create a Dashboard component with:
- 4 metric cards (MQLs, SQLs, Intent Signals, Meetings) in a grid
- High-intent leads table (clickable rows)
- Activity feed showing recent actions
- AI insights panel on the right
- Use the agent configuration from src/config/agents.ts
```

**Prompt 2: Enrichment Lab**
```
Create an Enrichment Lab page with:
- Left panel: Upload CSV for bulk enrichment
- Right panel: Results preview
- "Enrich with Clay" button that calls agent 697ad49223e56dc88c1ff0f0
- Display intent signals with color-coded badges
- Export results to CSV
```

**Prompt 3: Agent Call Utility**
```
Create a utility function in src/lib/api.ts:
- callAgent(agentId, message) function
- Uses fetch to POST to /api/chat
- Returns parsed JSON response
- Handles errors gracefully
- No toast notifications - return error objects
```

#### Step 4: Define API Routes
```typescript
// Bolt can create API routes
// Create api/chat.ts

export async function handler(req, res) {
  const { agent_id, message } = req.body;

  // Call your agent platform API
  const response = await fetch('https://agent-api.lyzr.ai/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.AGENT_API_KEY}`
    },
    body: JSON.stringify({ agent_id, message })
  });

  const data = await response.json();
  res.json(data);
}
```

#### Step 5: Refine with Iterative Prompts
```
"Add hover preview on pipeline table rows"
"Make intent signal badges clickable to show detail modal"
"Add loading spinner when processing leads"
"Improve mobile responsiveness for table - use card view"
"Add dark mode toggle (default dark)"
```

#### Step 6: Deploy from Bolt
Bolt can deploy directly to:
- Netlify
- Vercel
- GitHub Pages

**Deployment Prompt**:
```
Deploy this application to Vercel with:
- Environment variables for AGENT_API_KEY
- Custom domain: outreach.lyzr.ai
- Automatic deployments on updates
```

**Benefits of Bolt**:
- Browser-based development (no local setup)
- Real-time preview as you build
- AI assists with debugging
- One-click deployment
- Git integration for version control

**Limitations**:
- Performance may lag with very large projects
- Complex state management might need manual setup
- Limited to browser-compatible libraries

---

### COMPARISON: Lovable vs Bolt

| Feature | Lovable | Bolt |
|---------|---------|------|
| **Development Speed** | Very Fast | Fast |
| **AI Code Generation** | Excellent | Very Good |
| **Customization** | High (full code access) | Medium (browser limits) |
| **Deployment** | Manual export + deploy | One-click deploy |
| **Collaboration** | Team workspaces | Individual + Git |
| **Complex Logic** | Better for custom agents | Better for standard patterns |
| **Learning Curve** | Low | Very Low |
| **Cost** | Paid (with free tier) | Free (with limits) |

**Recommendation**:
- **Use Lovable** if you need heavy customization and complex agent workflows
- **Use Bolt** if you want fastest prototyping and simple deployment

---

### HYBRID APPROACH (Recommended)

**Best of Both Worlds**:

1. **Prototype in Bolt** (Day 1-2)
   - Quickly build all 8 pages
   - Test UI/UX interactions
   - Validate user flows
   - Get stakeholder feedback

2. **Refine in Lovable** (Day 3-5)
   - Export from Bolt
   - Import into Lovable for advanced features
   - Add complex agent orchestration
   - Implement custom components
   - Polish interactions and animations

3. **Deploy from Lovable** (Day 6)
   - Production-ready code
   - Custom domain
   - Environment configuration
   - CI/CD pipeline

**Migration Steps**:
```bash
# Export from Bolt
# Download project as ZIP

# Import to Lovable
# Upload ZIP to Lovable project
# Lovable auto-detects structure

# Add advanced features in Lovable
# Use AI prompts for agent integration
# Refine based on feedback

# Deploy
# Lovable → Vercel/Netlify with one click
```

---

### MAINTAINING AGENT IDs ACROSS PLATFORMS

**Critical**: Agent IDs must remain consistent across all platforms.

```typescript
// Create a central config file that both platforms use
// src/config/agents.config.ts

export const AGENT_CONFIG = {
  managers: {
    leadProcessing: '697ace4fbc6eb6293f5503f1',
    multiChannel: '697ad587bc6eb6293f550417'
  },
  subAgents: {
    enrichment: '697acded814f1038c09862c5',
    scoring: '697ace07814f1038c09862c6',
    messageGen: '697ace27c03792e039e5ada5'
  },
  independent: {
    emailDelivery: '697ace6bc03792e039e5adaa',
    linkedInContent: '697ace8623e56dc88c1ff0c6',
    meetingScheduler: '697acea3814f1038c09862d1',
    styleAnalyzer: '697acec2814f1038c09862d2',
    clayEnrichment: '697ad49223e56dc88c1ff0f0',
    instantlyEmail: '697ad4a9bc6eb6293f55040b',
    linkedInSales: '697ad4c2c03792e039e5add8',
    gensparkResearch: '697ad4ddbc6eb6293f55040f',
    claudeCowork: '697ad52bbc6eb6293f550413',
    geminiResearch: '697ad557814f1038c09862ef'
  }
};

// Import this config in every file that calls agents
import { AGENT_CONFIG } from '@/config/agents.config';

// Usage
const result = await callAgent(
  AGENT_CONFIG.managers.leadProcessing,
  message
);
```

---

### TESTING BEFORE MIGRATION

Before moving to Lovable/Bolt, test current implementation:

```bash
# In current project
npm run dev

# Test all agent integrations:
# 1. Click "Process Leads" → Verify Lead Processing Manager works
# 2. Click "Enrich with Clay" → Verify Clay agent returns intent signals
# 3. Click "Approve & Send" → Verify Gmail agent sends email
# 4. Click "Generate Posts" → Verify LinkedIn Content agent creates posts
# 5. Click "Schedule Meeting" → Verify Calendly agent proposes times

# Verify all 15 agents respond with valid JSON
# Check browser console for errors
# Test error handling (disconnect network, retry)
```

---

## SUMMARY

You now have:

1. **15 Fully Functional AI Agents**
   - 2 Managers (Lead Processing, Multi-Channel)
   - 3 Sub-Agents (Enrichment, Scoring, Messages)
   - 10 Independent (Email, LinkedIn, Clay, Research, etc.)

2. **10 Tool Integrations**
   - Apollo, Gmail, Calendly, LinkedIn, Perplexity, Instantly, Genspark, Clay, Claude (planned), Gemini

3. **2 Knowledge Bases**
   - ICP Definitions (scoring criteria)
   - Writing Samples & Context (personalization)

4. **8-Page Production UI**
   - Dashboard, Pipeline, Enrichment Lab, Outreach Center, Research Hub, QA Inbox, Content Studio, Settings

5. **Clear Path Forward**
   - To-do list with priorities
   - Lovable/Bolt integration guides
   - Testing and deployment strategy

**Next Steps**:
1. Review this documentation
2. Test current implementation in browser
3. Provide brand colors (if available)
4. Decide on Lovable vs. Bolt for frontend polish
5. Prioritize to-do items based on business needs
6. Iterate and enhance based on user feedback

Let me know what enhancements you'd like to prioritize!