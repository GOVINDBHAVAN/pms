/**
 * Centralised help text for all InfoIcon tooltips across the application.
 * Keep tooltip entries concise (under ~80 words): WHAT → WHY → HOW.
 * Performance type entries use a richer object structure for the modal display.
 */

export const HELP = {

  /* ─── Org Settings — General Tab ───────────────────────────────────────── */
  orgSettings: {
    framework:
      'The performance framework is the structure used to define and measure employee goals.\n\n' +
      'OKR = Objectives & Key Results (popular in tech).\n' +
      'KRA/KPI = broad responsibility areas + specific metrics (manufacturing, banking).\n' +
      'Goals = simple plain targets (NGO, education).\n' +
      'Hybrid = mix of goals + competencies (recommended for most orgs).\n\n' +
      'This setting controls which target types employees can create and how the final score is computed.',

    cascadeMode:
      'Cascade mode determines how targets flow through the org hierarchy.\n\n' +
      'Top-Down: Leadership sets targets first; employees receive theirs from managers. Ensures strategic alignment.\n\n' +
      'Bottom-Up: Employees propose their own targets; managers review and link them upward.\n\n' +
      'Bidirectional: Both happen simultaneously. Managers reconcile top-down direction with bottom-up proposals. Recommended for mature organisations.',

    activeTypes:
      'These are the target types employees can choose when adding a new performance target this cycle.\n\n' +
      'Enable only the types relevant to your framework. For example:\n' +
      '• OKR framework → enable OKR Objective + OKR Key Result\n' +
      '• KRA/KPI framework → enable KRA + KPI\n' +
      '• Hybrid → enable KRA, KPI, and Competency\n\n' +
      'Unchecked types will not appear in the target creation form.',

    bscPerspectives:
      'Balanced Scorecard requires measuring performance across four strategic dimensions simultaneously.\n\n' +
      'Default perspectives: Financial, Customer, Internal Process, Learning & Growth.\n\n' +
      'You can rename or add perspectives to match your organisation\'s strategy (e.g., replace "Learning & Growth" with "People & Culture"). Each BSC target will be tagged to one perspective.',

    cycleDefaultType:
      'The default review cycle duration used when creating a new cycle.\n\n' +
      'Annual = one appraisal per financial year (most common).\n' +
      'Half-Yearly = two rounds per year.\n' +
      'Quarterly = four rounds (common in fast-moving orgs or sales teams).\n' +
      'Monthly = rolling monthly targets.\n\n' +
      'HR can override this when creating any specific cycle.',

    goalSettingDays:
      'The default number of days employees have to submit their targets after a cycle opens for goal-setting.\n\n' +
      'Example: 30 days means employees must submit by 30 days from the cycle\'s goal-setting open date.\n\n' +
      'This is a default — HR can set specific dates when creating each cycle.',

    reviewDays:
      'The default number of days allocated for the appraisal/review phase — from when self-rating opens to when manager ratings must be submitted.\n\n' +
      'Example: 21 days gives employees 10 days for self-rating and managers 11 days for their review.\n\n' +
      'HR can set specific open and close dates per cycle.',
  },

  /* ─── Performance Type Detailed Info (for modal) ───────────────────────── */
  performanceTypes: {
    okr_objective: {
      title: 'OKR — Objective',
      tagline: 'An inspiring direction your team is marching toward',
      color: 'indigo',
      icon: '🎯',
      what: [
        'An Objective is a short, qualitative statement describing WHERE you want to go — not HOW you will get there. It is not a number; it is a direction.',
        'Think of it like a compass heading. "Build a product customers love" or "Become the market leader in South India" are Objectives. They are ambitious, motivating, and time-bound (usually quarterly or annual).',
        'Objectives sit at the top of the OKR hierarchy. Under each Objective, you attach 3–5 Key Results that prove you actually achieved it.',
      ],
      industries: [
        { name: 'IT & Software', reason: 'Engineering teams set Objectives like "Deliver a world-class mobile experience" each quarter' },
        { name: 'Startups', reason: 'Fast-moving orgs use Objectives to align the entire company toward a single mission each quarter' },
        { name: 'Product Companies', reason: 'Product managers use Objectives to tie every feature to a strategic direction' },
        { name: 'E-Commerce', reason: 'Growth teams use Objectives like "Dominate the festive season" to rally cross-functional teams' },
      ],
      benefit: 'Objectives make strategy tangible. Without them, employees work hard but in different directions. With Objectives, every person knows the "why" behind their daily work. Companies using OKRs (Google, Intel, LinkedIn) report better cross-team alignment and faster decision-making because everyone can check: "Does this work contribute to our Objective?"',
      example: {
        scenario: 'An IT company sets a company-level Objective:',
        items: [
          '🎯 Objective: "Make our platform the most reliable in the industry"',
          '  ↳ VP Engineering Objective: "Eliminate all P1 incidents"',
          '     ↳ Dev Manager Objective: "Build bulletproof monitoring and alerting"',
          '        ↳ Engineer Objective: "Reduce system downtime to zero"',
        ],
        note: 'Notice how the Objective cascades — each level has its own inspiring direction that contributes to the one above it.',
      },
      pairWith: 'Always used together with OKR Key Result. An Objective without Key Results is just a wish.',
    },

    okr_kr: {
      title: 'OKR — Key Result',
      tagline: 'The measurable proof that you achieved your Objective',
      color: 'violet',
      icon: '📊',
      what: [
        'A Key Result is a specific, measurable outcome that tells you whether you\'ve reached your Objective. It answers: "How will we know we succeeded?"',
        'Key Results are always numeric. "Achieve 99.9% uptime", "Get NPS from 42 to 65", "Ship 4 features with < 1% bug rate" — these are Key Results. Vague things like "Improve quality" are NOT Key Results.',
        'Typically, each Objective has 3–5 Key Results. Achieving 70–80% of all Key Results is considered good in OKR culture — they are meant to stretch you.',
      ],
      industries: [
        { name: 'IT & Software', reason: 'KRs like "API response time < 200ms" or "95% test coverage" make engineering goals measurable' },
        { name: 'Marketing Teams', reason: 'KRs like "1,00,000 website visits", "500 MQLs", "10% conversion rate" track campaign effectiveness' },
        { name: 'HR Departments', reason: 'KRs like "Attrition < 10%", "90% offer acceptance rate" make people metrics concrete' },
        { name: 'Customer Success', reason: 'KRs like "CSAT ≥ 4.5", "Churn < 2% monthly" measure customer health quantitatively' },
      ],
      benefit: 'Key Results remove subjectivity from performance conversations. Without them, managers and employees argue about whether goals were "met". With Key Results, the number either is what it is or it isn\'t. This makes appraisals faster, fairer, and less emotional. Companies report that OKRs reduce the time spent in performance discussions by 40% because the data speaks for itself.',
      example: {
        scenario: 'Under the Objective "Make our platform the most reliable in the industry":',
        items: [
          '📊 KR 1: Reduce P1 incidents from 12/month to 0/month',
          '📊 KR 2: Achieve 99.95% uptime (up from 99.2%)',
          '📊 KR 3: Mean Time to Recovery (MTTR) < 15 minutes',
          '📊 KR 4: Deploy automated rollback for 100% of services',
        ],
        note: 'At the end of the cycle, you score each KR (e.g., achieved 0.8 out of 1.0). The average score tells you how well you hit the Objective.',
      },
      pairWith: 'Always used together with OKR Objective. Enable both or neither.',
    },

    kra: {
      title: 'KRA — Key Result Area',
      tagline: 'A broad responsibility domain that defines WHAT an employee is accountable for',
      color: 'blue',
      icon: '🗂️',
      what: [
        'A KRA is a major area of responsibility in someone\'s job. It is not a number — it is a category or domain. Think of it as the "chapters" in an employee\'s job description.',
        'Example: A Branch Manager at a bank might have KRAs like "Business Development", "Customer Relationship Management", "Team Leadership", and "Compliance & Risk".',
        'KRAs answer: "What are the 4–6 most important areas of your job?" Under each KRA, you define KPIs (specific metrics) that measure how well the employee is performing in that area.',
      ],
      industries: [
        { name: 'Manufacturing', reason: 'Plant managers have KRAs like Production Output, Safety Compliance, Quality Control, Machine Maintenance' },
        { name: 'Banking & Finance (BFSI)', reason: 'Relationship managers have KRAs like Portfolio Growth, NPA Management, Customer Satisfaction, Cross-Selling' },
        { name: 'Retail & Sales', reason: 'Store managers have KRAs like Revenue Generation, Customer Experience, Inventory Management, Team Productivity' },
        { name: 'Logistics', reason: 'Operations managers have KRAs like On-Time Delivery, Fleet Utilisation, Cost Efficiency, Safety' },
        { name: 'Hospitality', reason: 'Hotel GMs have KRAs like Guest Satisfaction, Revenue Management, Operations Excellence, Staff Development' },
      ],
      benefit: 'KRAs bring clarity to complex roles. In traditional organisations, employees often feel overwhelmed because their job covers many things. KRAs force a conversation: "Of all the things you do, these 5 areas are what matter most for this cycle." This reduces role ambiguity, improves prioritisation, and makes appraisals more structured and defensible.',
      example: {
        scenario: 'A Sales Manager\'s KRA structure:',
        items: [
          '🗂️ KRA 1: Revenue Generation (weight: 40%)',
          '   ↳ KPI: Monthly revenue vs. target',
          '   ↳ KPI: Number of new accounts opened',
          '🗂️ KRA 2: Customer Relationship (weight: 25%)',
          '   ↳ KPI: Customer satisfaction score (CSAT)',
          '   ↳ KPI: Renewal rate (%)',
          '🗂️ KRA 3: Team Leadership (weight: 20%)',
          '   ↳ KPI: Team target achievement rate',
          '🗂️ KRA 4: Compliance (weight: 15%)',
          '   ↳ KPI: Audit score',
        ],
        note: 'The KRA provides the category; the KPIs provide the numbers. Together they create a complete, balanced scorecard for the role.',
      },
      pairWith: 'Always used with KPI. KRA is the heading; KPI is the measurement under that heading.',
    },

    kpi: {
      title: 'KPI — Key Performance Indicator',
      tagline: 'A specific, measurable number that tracks performance within a KRA',
      color: 'cyan',
      icon: '📈',
      what: [
        'A KPI is a specific metric — a number with a target. It answers: "How do we measure success in this KRA?" Every KPI has a unit (%, INR, count, days, score) and a target value.',
        'Example: Under the KRA "Customer Relationship", the KPIs might be: "CSAT Score ≥ 4.2" and "Response Time < 4 hours" and "Renewal Rate ≥ 90%".',
        'KPIs are the most granular, actionable unit in the KRA/KPI framework. They can be tracked monthly, quarterly, or annually depending on the cycle.',
      ],
      industries: [
        { name: 'Manufacturing', reason: '"Defect Rate < 200 ppm", "OEE ≥ 85%", "Safety Incidents = 0" — KPIs drive operational discipline on the shop floor' },
        { name: 'Banking & Finance', reason: '"NPA Ratio < 2%", "AUM Growth ≥ 15%", "KYC Compliance 100%" — regulators and management track these closely' },
        { name: 'Healthcare', reason: '"Patient Wait Time < 30 mins", "Medication Error Rate = 0", "Bed Occupancy ≥ 80%" — patient safety depends on KPI discipline' },
        { name: 'Call Centres', reason: '"First Call Resolution ≥ 85%", "Average Handle Time < 5 mins", "CSAT ≥ 4.0" — efficiency and quality are managed entirely by KPIs' },
        { name: 'Retail', reason: '"Conversion Rate ≥ 3%", "Average Transaction Value ₹1,500+", "Shrinkage < 0.5%" — every shift can be evaluated against these numbers' },
      ],
      benefit: 'KPIs are the backbone of data-driven management. They remove opinion from performance reviews: either the defect rate was below 200 ppm or it wasn\'t. Managers stop having to justify ratings subjectively. Employees know exactly what "good" looks like before the cycle starts. Organisations that track KPIs consistently see faster course-correction during the year because problems are visible early.',
      example: {
        scenario: 'A Logistics Operations Executive\'s KPIs:',
        items: [
          '📈 On-Time Delivery Rate: Target ≥ 96% | Actual: 94.2% | Score: 3/5',
          '📈 Order Accuracy: Target ≥ 99% | Actual: 99.3% | Score: 5/5',
          '📈 Cost per Delivery: Target ≤ ₹85 | Actual: ₹78 | Score: 5/5',
          '📈 Customer Complaint Rate: Target < 2% | Actual: 3.1% | Score: 2/5',
          '📈 Fleet Utilisation: Target ≥ 80% | Actual: 77% | Score: 3/5',
        ],
        note: 'Each KPI is scored independently. The weighted average of KPI scores becomes the employee\'s final performance rating.',
      },
      pairWith: 'Used under a KRA. You can also use KPI standalone (without KRA) for simpler frameworks.',
    },

    goal: {
      title: 'Goal',
      tagline: 'A plain, jargon-free individual target — the simplest performance unit',
      color: 'green',
      icon: '✅',
      what: [
        'A Goal is a simple, direct statement of something an employee intends to achieve by the end of the cycle. No framework jargon — just a target in plain language.',
        'Goals are used when an organisation wants performance management without the complexity of KRAs or OKRs. They are easy to write, easy to understand, and easy to measure.',
        'Each Goal has a title, a target value (optional), and a weight. Example: "Complete AWS certification by September", "Onboard 5 enterprise clients", "Reduce invoice processing time from 3 days to 1 day".',
      ],
      industries: [
        { name: 'NGO & Social Sector', reason: 'Field workers set Goals like "Enrol 200 beneficiaries in the scheme" or "Conduct 12 health camps". Simple and impactful.' },
        { name: 'Education', reason: 'Teachers set Goals like "Achieve 85% student pass rate" or "Complete 100% curriculum by February". Easy for non-corporate staff to understand.' },
        { name: 'Small Businesses', reason: 'SMEs don\'t need complex frameworks. Goals let them run performance reviews without hiring HR consultants.' },
        { name: 'Government / PSU', reason: 'Policy-driven organisations use Goals to track scheme deliverables and project milestones without corporate jargon.' },
        { name: 'Service Companies', reason: 'Consulting, legal, and CA firms use Goals for project-based targets like "Deliver 3 client audits by Q3".' },
      ],
      benefit: 'Goals democratise performance management. When an employee in a rural NGO or a factory floor supervisor doesn\'t understand what a "KPI" or "Key Result" means, Goals work perfectly. They reduce the fear around appraisals because employees feel they are just describing their work, not filling out a corporate form. Adoption rates for performance systems using Goals are significantly higher in non-corporate environments.',
      example: {
        scenario: 'A schoolteacher\'s performance targets using Goals:',
        items: [
          '✅ Goal 1: Achieve 80% student pass rate in Class 10 Board exams (weight: 40%)',
          '✅ Goal 2: Complete 100% of prescribed curriculum by February (weight: 20%)',
          '✅ Goal 3: Conduct 2 parent-teacher meetings per term (weight: 15%)',
          '✅ Goal 4: Complete 1 professional development course (weight: 15%)',
          '✅ Goal 5: Maintain 95% attendance record (weight: 10%)',
        ],
        note: 'Any teacher can understand these Goals without any training in performance frameworks. That\'s the power of simplicity.',
      },
      pairWith: 'Often combined with Competency for a Hybrid approach. "Goals" cover the WHAT; "Competency" covers the HOW.',
    },

    competency: {
      title: 'Competency',
      tagline: 'A behavioural skill or capability — measuring HOW an employee works, not just WHAT they deliver',
      color: 'purple',
      icon: '🧠',
      what: [
        'A Competency is a skill, behaviour, or capability that an employee is expected to demonstrate in their role. Unlike KPIs and Goals which measure outcomes, Competencies measure behaviours.',
        'Examples: "Communication", "Leadership", "Problem Solving", "Customer Focus", "Teamwork", "Innovation", "Adherence to Safety Protocols".',
        'Competencies are rated by managers on a scale (e.g., 1–5 or BARS — Behaviourally Anchored Rating Scale). A BARS rating for "Communication at Level 3" might say: "Clearly explains technical concepts to non-technical stakeholders without jargon; presents data in meetings with logical flow."',
      ],
      industries: [
        { name: 'Healthcare', reason: 'A nurse\'s competency in "Patient Empathy" or "Clinical Judgment" is as important as the number of patients seen. BARS is widely used here.' },
        { name: 'Banking & Customer Service', reason: '"Client Relationship Management" and "Risk Awareness" are competencies that protect the bank from mis-selling and compliance failures.' },
        { name: 'IT & Software', reason: '"Collaboration", "Ownership & Accountability", and "Technical Problem-Solving" distinguish great engineers from average ones with similar output.' },
        { name: 'Hospitality', reason: '"Service Excellence", "Empathy", and "Attention to Detail" are what guest reviews are made of — pure competency play.' },
        { name: 'Leadership Roles', reason: 'For managers, competencies like "People Development", "Strategic Thinking", and "Decision Making Under Pressure" are more predictive of success than any KPI.' },
      ],
      benefit: 'Numbers alone don\'t tell the full performance story. An employee who hits all their KPIs but bullies teammates, bypasses processes, or refuses to share knowledge is actually destroying long-term value. Competencies capture this. Including Competencies in the appraisal forces a conversation about behaviours, culture, and potential — not just output. High-performing organisations typically weight Competencies at 20–40% of the final score.',
      example: {
        scenario: 'A Software Developer\'s Competency targets:',
        items: [
          '🧠 Competency 1: Technical Problem Solving (weight: 15%)',
          '   Rating 4/5: "Independently resolves complex bugs; proposes architectural improvements"',
          '🧠 Competency 2: Collaboration & Teamwork (weight: 10%)',
          '   Rating 5/5: "Proactively helps teammates; conducts thorough code reviews"',
          '🧠 Competency 3: Ownership & Accountability (weight: 10%)',
          '   Rating 3/5: "Meets deadlines but sometimes needs reminders on follow-through"',
          '🧠 Competency 4: Communication (weight: 5%)',
          '   Rating 4/5: "Documents code clearly; participates well in cross-team discussions"',
        ],
        note: 'Competencies provide the "how" score. Combined with KPI/Goal scores, they give a complete picture: this developer delivers great code AND works well with others.',
      },
      pairWith: 'Used alongside Goals or KPIs in a Hybrid framework. Typical split: Goals 70% + Competency 30%.',
    },

    bsc_metric: {
      title: 'BSC Metric (Balanced Scorecard)',
      tagline: 'Performance measured across four strategic dimensions simultaneously — not just financials',
      color: 'amber',
      icon: '⚖️',
      what: [
        'The Balanced Scorecard (BSC) was developed by Kaplan and Norton at Harvard. It solves a common problem: organisations that only track financial metrics often sacrifice long-term health for short-term profit.',
        'BSC requires measuring performance across four perspectives: (1) Financial — "Are we profitable?", (2) Customer — "Do customers love us?", (3) Internal Process — "Are our operations efficient?", (4) Learning & Growth — "Are our people and systems improving?"',
        'A BSC Metric is a target tagged to one of these four perspectives. For example: "Reduce NPA ratio to < 2%" is a Financial BSC Metric. "Achieve CSAT ≥ 4.5" is a Customer BSC Metric.',
      ],
      industries: [
        { name: 'Banking & Financial Services (BFSI)', reason: 'RBI and SEBI regulated entities use BSC to balance profitability with risk management, compliance, and customer protection' },
        { name: 'Large Enterprises', reason: 'Conglomerates with multiple business units use BSC to cascade strategy from board level to department level coherently' },
        { name: 'Public Sector & Government', reason: 'Where profit is not the goal, BSC is adapted: Financial → Budget Utilisation, Customer → Citizen Satisfaction, Process → Scheme Implementation Speed' },
        { name: 'Healthcare Systems', reason: 'Hospitals balance Financial (revenue), Patient (satisfaction, outcomes), Process (wait times, utilisation), Learning (staff training, accreditation)' },
        { name: 'Manufacturing Conglomerates', reason: 'Groups like Tata, Mahindra, L&T use BSC to ensure operations, customer relationships, and talent development are tracked alongside financials' },
      ],
      benefit: 'Without BSC, companies optimise for profit today and discover too late that they have lost customers, broken processes, and demotivated people. BSC forces leadership to think about all four engines simultaneously. Organisations using BSC report better long-term growth, fewer surprises in customer churn, and stronger bench strength because Learning & Growth is tracked as seriously as Financial returns.',
      example: {
        scenario: 'A Bank Branch Manager\'s BSC Metrics:',
        items: [
          '⚖️ Financial (35%): AUM Growth ≥ 18% | NPA Ratio < 1.5%',
          '⚖️ Customer (30%): CSAT ≥ 4.3/5 | Complaint Resolution < 3 days',
          '⚖️ Internal Process (20%): KYC Compliance 100% | Loan TAT ≤ 7 days',
          '⚖️ Learning & Growth (15%): Complete 2 certifications | Team Training Hours ≥ 40',
        ],
        note: 'No perspective is ignored. Even if the branch misses its revenue target (Financial), a high Learning & Growth score signals the team is investing in future capability.',
      },
      pairWith: 'Enable BSC Metric + KPI for granular measurement within each perspective. Optionally add Competency for the Learning & Growth perspective.',
    },

    custom_metric: {
      title: 'Custom Metric',
      tagline: 'A fully flexible target type you define — for any measurement that doesn\'t fit standard categories',
      color: 'slate',
      icon: '⚙️',
      what: [
        'A Custom Metric is a free-form target type for measurements that don\'t fit neatly into OKR, KRA/KPI, Goal, or BSC categories. You define the name, unit, and measurement logic yourself.',
        'Examples of Custom Metrics: "Innovation Index" (internal scoring tool), "Sustainability Score" (ESG tracking), "Safety Observation Cards filed" (a manufacturing-specific tracker), "Hackathon Participation" (a culture metric).',
        'Custom Metrics are typically used alongside standard types to capture unique organisational priorities that aren\'t standard in any framework.',
      ],
      industries: [
        { name: 'Any Industry', reason: 'Custom Metrics are used when an organisation has a unique strategic priority not captured by standard frameworks' },
        { name: 'Manufacturing (ESG-focused)', reason: '"Carbon Footprint per Unit", "Water Recycling Rate (%)" — sustainability KPIs that don\'t fit standard production KRAs' },
        { name: 'IT Companies', reason: '"InnerSource Contributions", "Hackathon Ideas Submitted", "Patents Filed" — innovation metrics that go beyond OKR Key Results' },
        { name: 'Startups', reason: '"Investor Deck Readiness Score", "Product-Market Fit Survey Score" — early-stage metrics that are unique to the company\'s situation' },
      ],
      benefit: 'No single framework covers every organisation\'s strategic needs. Custom Metrics give HR the freedom to track what actually matters for the business right now — even if it\'s unique, experimental, or evolving. This is especially useful during organisational transformations (e.g., "Cultural Change Index" during a merger) or when launching new business initiatives.',
      example: {
        scenario: 'A technology company adds Custom Metrics alongside standard OKR Key Results:',
        items: [
          '⚙️ Custom Metric 1: Open-Source Contributions (count) | Target: 5 PRs | Actual: 7',
          '⚙️ Custom Metric 2: Knowledge Sharing Sessions conducted | Target: 4 | Actual: 4',
          '⚙️ Custom Metric 3: Mentorship Hours logged | Target: 20 hrs | Actual: 24 hrs',
          '⚙️ Custom Metric 4: Sustainability Score (internal audit) | Target: 80/100 | Actual: 85',
        ],
        note: 'These custom metrics signal that the company values more than just output — they track community contribution, knowledge transfer, and environmental responsibility.',
      },
      pairWith: 'Typically used as a supplement to OKR KRs, KPIs, or Goals. Keep their weight low (5–15%) so standard targets remain the primary driver.',
    },
  },

  /* ─── Org Settings — Rating Scale Tab ──────────────────────────────────── */
  ratingScale: {
    scaleType:
      'The scoring method used to rate employee performance on each target.\n\n' +
      '5-Point: Exceptional (5) → Poor (1). Most widely used.\n' +
      '3-Point: Above / Meets / Below. Simpler, reduces bias.\n' +
      'Percentage: Score = actual ÷ planned × 100. No manager subjectivity.\n' +
      'BARS: Each level defined by observable behaviour descriptions. Highest consistency.\n' +
      'Custom: Define your own labels and numeric values.',

    scaleLabelsValues:
      'Define what each rating level means and its numeric value.\n\n' +
      'The label is what managers and employees see (e.g., "Exceeds Expectation").\n' +
      'The value is the number used in score calculations (e.g., 4).\n\n' +
      'List levels from lowest (worst) to highest (best). The numeric values are used in the weighted average formula to compute the final score.',

    pipThreshold:
      'PIP = Performance Improvement Plan.\n\n' +
      'If an employee\'s final score is at or below this value, the system automatically flags them for a PIP and notifies HR.\n\n' +
      'Example: set to 2 on a 5-point scale → anyone scoring 2 or below is flagged. Set to 0 to disable automatic PIP flagging.',

    goalsScaleSection:
      'Rating scale for all quantitative targets: KRAs, KPIs, OKR Key Results, Goals, and BSC Metrics.\n\n' +
      'In Hybrid frameworks, goals and competencies can use different scales — for example, goals rated by percentage achievement while competencies use a 5-point behavioural scale.',

    competencyScaleSection:
      'Rating scale specifically for competency/behavioural targets.\n\n' +
      'Competencies measure HOW an employee works (skills, behaviours) rather than WHAT they deliver. BARS is commonly used here because each level describes an observable behaviour, making ratings more consistent across managers.',
  },

  /* ─── Org Settings — Weightage Tab ─────────────────────────────────────── */
  weightage: {
    split:
      'The weightage split determines how much each category contributes to an employee\'s final performance score.\n\n' +
      'Example: Goals 70% + Competency 30% = 100% final score.\n' +
      'Formula: (weighted avg of goal ratings × 70%) + (weighted avg of competency ratings × 30%)\n\n' +
      'This applies to every employee across all cycles. A higher goals % makes delivery of measurable targets the primary driver; a higher competency % makes behaviours and skills more important.',

    goalsPercent:
      'Percentage of the final score that comes from quantitative goal achievement (KPIs, OKRs, KRAs, Goals).\n\n' +
      'Typical range: 50–80%. Higher values suit results-driven cultures (sales, manufacturing). Lower values suit roles where behaviour and skills are critical (healthcare, customer service).',

    competencyPercent:
      'Percentage of the final score that comes from behavioural and competency ratings.\n\n' +
      'This value is automatically set to 100% minus the Goals%. Competency ratings capture HOW an employee achieves their results — collaboration, communication, leadership, problem-solving.',
  },

  /* ─── Org Settings — Terminology Tab ───────────────────────────────────── */
  terminology: {
    section:
      'Rename system terms to match your organisation\'s language. All employees will see your custom labels everywhere — target forms, dashboards, reports, and approval screens.\n\n' +
      'Leave a field blank to keep the system default. Changes take effect immediately after saving.',

    kra:
      'KRA = Key Result Area. A broad domain of responsibility.\n\n' +
      'Common alternatives: "Focus Area", "Accountability", "Pillar", "Work Stream".\n' +
      'Example: "Customer Service" is a KRA; the KPIs under it measure how well the employee performs in that area.',

    kpi:
      'KPI = Key Performance Indicator. A specific, measurable metric within a KRA.\n\n' +
      'Common alternatives: "Metric", "Success Measure", "Indicator", "Performance Measure".\n' +
      'Example: "First Call Resolution Rate ≥ 85%" is a KPI under the "Customer Service" KRA.',

    objective:
      'Used in OKR frameworks. An Objective is a qualitative, inspiring direction the team or person is working toward.\n\n' +
      'Common alternatives: "Strategic Priority", "Company Direction", "North Star", "Mission".\n' +
      'Example: "Build a product loved by our customers" is an Objective.',

    key_result:
      'Used in OKR frameworks. A Key Result is a specific, measurable outcome that proves the Objective was achieved.\n\n' +
      'Common alternatives: "Measurable Outcome", "Success Metric", "Milestone".\n' +
      'Example: "Achieve NPS ≥ 60 by Q4" is a Key Result under the Objective above.',

    goal:
      'A plain individual target with no framework jargon.\n\n' +
      'Common alternatives: "Programme Target" (NGOs), "Quota" (sales), "Learning Outcome" (education), "Deliverable".\n' +
      'Example: "Complete AWS Solutions Architect certification by September".',

    competency:
      'A behavioural skill or capability rated on how the employee demonstrates it.\n\n' +
      'Common alternatives: "Behavioural Indicator", "Soft Skill", "Capability", "Proficiency".\n' +
      'Example: "Communication", "Leadership", "Problem Solving" are competencies.',

    weight:
      'The importance percentage of a single target in the employee\'s total scorecard.\n\n' +
      'Common alternatives: "Priority (%)", "Importance", "Allocation".\n' +
      'All targets per employee must sum to 100% weight. A target with 30% weight has 3× the impact of a 10% target on the final score.',

    planned:
      'The value an employee commits to achieving by end of cycle.\n\n' +
      'Common alternatives: "Target Value", "Committed Target", "Quota".\n' +
      'This is the benchmark against which actual achievement is measured. If actual ÷ planned > 1, the employee has over-delivered.',

    actual:
      'The value the employee actually delivered during the cycle, entered during the self-appraisal phase.\n\n' +
      'Common alternatives: "Actual Achievement", "Delivered Value", "Result".\n' +
      'Used to compute the achievement percentage and informs the manager\'s rating.',

    stretch:
      'An aspirational target above the planned commitment — "going the extra mile".\n\n' +
      'Common alternatives: "Aspirational Target", "Moon-Shot", "Outperform Target".\n' +
      'Stretch targets are not used in score calculation. If actual > planned but < stretch, the dashboard shows "On the way to stretch". If actual ≥ stretch, it shows "Stretch achieved".',

    performance_band:
      'The qualitative label assigned to a final score range (e.g., "Exceptional", "Meets Expectation").\n\n' +
      'Common alternatives: "Rating Category", "Impact Band" (NGOs), "Performance Category".\n' +
      'Performance bands determine increment eligibility, promotion consideration, and PIP status per your HR policy.',
  },

  /* ─── Org Settings — Performance Bands Tab ─────────────────────────────── */
  bands: {
    section:
      'Performance bands map a numeric final score to a qualitative label.\n\n' +
      'Example: final score 4.5–5.0 → "Exceptional" (green); 3.5–4.49 → "Exceeds Expectation" (blue).\n\n' +
      'Ensure all bands together cover the full score range (e.g., 0–5 for a 5-point scale) with no gaps or overlaps. The system assigns the first matching band.',

    bandLabel:
      'The name shown to managers and employees for this performance category.\n\n' +
      'Should be meaningful and motivating. Avoid purely negative labels. Common names: "Exceptional", "Exceeds Expectation", "Meets Expectation", "Below Expectation", "Needs Improvement".',

    minScore:
      'The lowest score that falls into this band (inclusive).\n\n' +
      'Example: min = 3.5 means any employee scoring 3.50 or above enters this band. Ensure the min of each band aligns with the max of the band below it to avoid score gaps.',

    maxScore:
      'The highest score that falls into this band (inclusive).\n\n' +
      'Example: max = 4.49 means any employee scoring up to 4.49 is in this band. The top band should have max equal to your scale\'s ceiling (e.g., 5.0).',

    color:
      'The colour used to display this band as a badge across dashboards and reports.\n\n' +
      'Colour convention: green for top performers, blue for good, amber for average, red for below, dark red/grey for poor. Pick colours that are clearly distinguishable and accessible.',
  },

  /* ─── Org Settings — Target Rules Tab ──────────────────────────────────── */
  targetRules: {
    minWeight:
      'The minimum weight (%) a single target can carry in an employee\'s scorecard.\n\n' +
      'Targets below this threshold trigger a warning during validation. Default: 5%.\n\n' +
      'Purpose: prevents trivial targets (e.g., 1% weight) that have no meaningful impact on the final score from being used to pad out the 100% total.',

    maxWeight:
      'The maximum weight (%) a single target can carry in an employee\'s scorecard.\n\n' +
      'Targets exceeding this threshold trigger a warning suggesting the target should be split into sub-targets. Default: 50%.\n\n' +
      'Purpose: prevents over-concentration of the score on one target, which would make the appraisal one-dimensional.',

    overplanAllowed:
      'When enabled, employees are allowed to commit to a planned target that is higher than their manager\'s planned target for the linked parent.\n\n' +
      'This is called "over-planning" and represents going the extra mile. It requires a written justification from the employee and explicit manager approval.\n\n' +
      'Disable this if your organisation requires strict top-down allocation only.',

    overplanMultiplier:
      'The maximum aggregate over-plan ratio before HR receives a warning.\n\n' +
      'Example: multiplier = 1.15 means the sum of all team members\' planned targets can be at most 15% above the manager\'s planned target before a warning is shown to HR.\n\n' +
      'This is not a hard block — it is a visibility alert. Individual over-plan targets still require manager approval regardless of this setting.',

    requireParentLinkage:
      'When enabled, every approved target must be linked to a parent target in the hierarchy (via parent_target_id).\n\n' +
      'This enforces the cascade chain — ensuring every individual commitment traces back to a company-level goal.\n\n' +
      'Disable only if your organisation uses standalone goal-setting without hierarchical alignment (uncommon).',

    allowSelfPropose:
      'When enabled, employees can create and propose their own targets without waiting for a manager to assign them (bottom-up mode).\n\n' +
      'Proposed targets go into the manager\'s approval queue. The manager reviews, links them to their own targets, and approves or rejects them.\n\n' +
      'Disable if your organisation uses strictly top-down target assignment only.',
  },
};
