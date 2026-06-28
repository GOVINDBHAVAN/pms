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

    nineboxEnabled:
      'The 9-Box Talent Grid plots every employee on a 3×3 matrix: Performance (X-axis, from final score) × Potential (Y-axis, entered by manager/HR during calibration).\n\n' +
      'Enabling this does NOT change how targets are scored — it adds a talent layer on top of completed appraisals.\n\n' +
      'Unlocks the "Talent Grid" settings tab where you can customise box labels, potential levels, and who enters potential ratings.',

    bscPerspectiveWeights:
      'Relative importance (%) of each BSC perspective in the overall scorecard. Must total 100%.\n\n' +
      'Example: Financial 35%, Customer 30%, Process 20%, Learning 15% for a bank.\n\n' +
      'These weights determine how per-perspective scores are aggregated into the BSC component of the final score.',
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

  /* ─── Org Settings — Measurement Types ─────────────────────────────────── */
  measurementTypes: {
    section:
      'Measurement Types define HOW each target\'s actual value is entered and how achievement is computed.\n\n' +
      'This is separate from the Scoring Scale — the Scoring Scale converts achievement % into a rating label (e.g., "Exceeds Expectation"). Measurement Types determine what "achievement" even means for a given target.\n\n' +
      'Enable only the types your organisation uses. End-users choose one per target when they create a KPI, Key Result, or Goal.',

    typeEnabled:
      'Toggle this type on or off. When disabled, it will not appear in the measurement type dropdown during target creation.\n\n' +
      'You can disable types your org never uses to keep the target creation form clean.',

    typeLabel:
      'The name shown to employees and managers in the target creation form.\n\n' +
      'Rename to match your org\'s language — e.g., rename "Number (Absolute)" to "Revenue / Volume" for a sales team.',

    typeUnit:
      'The default unit label shown next to the planned and actual value inputs for this type.\n\n' +
      'Example: "₹" for a revenue KPI, "%" for a percentage target, "hrs" for time-based targets. Employees can override this per target.',

    typeFormula:
      'The formula used to automatically compute achievement % from the planned and actual values.\n\n' +
      'actual_over_planned: achievement = (actual ÷ planned) × 100%.\n' +
      'direct_percentage: employee enters the % directly — no formula applied.\n' +
      'boolean: done = 100%, not done = 0%.\n' +
      'rated_directly: no achievement % — manager assigns a rating at review time.',

    number:
      'An absolute numeric KPI or target. Examples: revenue in ₹, units sold, tickets resolved, NPS score.\n\n' +
      'Achievement = actual ÷ planned × 100%. A sales rep who hits ₹85L against a ₹100L target achieves 85%.',

    percentage:
      'Target and actual are both percentage values (0–100%). Examples: defect-free rate, attendance %, test coverage.\n\n' +
      'Achievement = actual ÷ planned × 100%. An attendance target of 95% with actual 93% = 97.9% achievement.',

    boolean:
      'Binary completion — either done or not done. Examples: "Submit ISO audit report", "Complete leadership training", "Launch new product".\n\n' +
      'Achievement = 100% if done, 0% if not done. No planned value is needed.',

    percentage_of_target:
      'Employee directly enters their achievement % — no planned/actual formula applied. Examples: satisfaction surveys, qualitative milestones.\n\n' +
      'Use when the employee or manager best judges the % completion subjectively.',

    bars:
      'Behaviorally Anchored Rating Scale — manager selects an anchor level describing observable behaviors at review time.\n\n' +
      'No planned target or actual value needed. The manager picks a level (e.g., "Proficient", "Advanced") which maps to a numeric rating. Best for competency-style KPIs and soft-skill targets.',

    rating:
      'Manager directly assigns a numeric rating from the org\'s scoring scale. No planned/actual values required.\n\n' +
      'Use for qualitative targets where the only meaningful assessment is the manager\'s direct judgment.',
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

  /* ─── Deep-Dive Modals for every Org Settings field ────────────────────── */
  settingModals: {

    framework: {
      title: 'Performance Framework', icon: '🏗️', color: 'indigo',
      tagline: 'The foundation that defines how your organisation measures employee performance',
      what: [
        'The framework determines which target types appear in the goal-setting form, how targets cascade through the hierarchy, and how the final appraisal score is computed. Every other setting in Org Settings builds on this choice.',
        'OKR suits fast-moving tech companies (quarterly Objectives + measurable Key Results). KRA/KPI suits structured roles in banking/manufacturing (responsibility areas + specific metrics). Goals suits NGOs, education, and government (plain language, no jargon). Hybrid (Goals + Competency) is recommended for most mid-sized companies.',
      ],
      reflects: [
        { where: 'Target Creation Form', what: 'Only target types matching the framework appear in the "Type" dropdown for employees.' },
        { where: 'Appraisal Score Formula', what: 'OKR scores Key Results independently; KRA/KPI weights KPIs under KRAs; Goals uses flat weighted average.' },
        { where: 'Manager Dashboard', what: 'Target list headers and grouping change based on framework (Objectives, KRAs, or Goals).' },
      ],
      practices: [
        { context: 'IT / Startups', rec: 'OKR. Quarterly Objectives keep teams aligned to fast-changing priorities. Engineers respond well to measurable Key Results.' },
        { context: 'Manufacturing / BFSI', rec: 'KRA/KPI. Roles are stable with defined responsibility areas. KPIs like "Defect Rate < 200 ppm" are already tracked operationally.' },
        { context: 'NGO / Education / Government', rec: 'Goals. Staff unfamiliar with PMS jargon can write plain-language targets without training.' },
        { context: 'Most mid-sized companies', rec: 'Hybrid. Combine Goals (70%) + Competency (30%) for a balanced view of delivery and behaviour.' },
      ],
      impact: 'Wrong framework = low adoption. If employees find the framework confusing, they fill forms just to comply and the data becomes meaningless.',
      example: {
        scenario: 'Same role (Sales Manager) described in three frameworks:',
        items: [
          'OKR:      Objective → "Own the SME segment in Q3"',
          '          KR1 → "Sign 15 new SME accounts"   KR2 → "NPS ≥ 60"',
          'KRA/KPI:  KRA → "Revenue Generation"',
          '          KPI → "Monthly revenue vs target ≥ 100%"',
          'Goals:    Goal 1 → "Close 15 deals by September 30"',
        ],
        note: 'Pick the framework closest to how your managers already talk about work in their day-to-day conversations.',
      },
      mistake: 'Choosing OKR because Google uses it — OKR requires psychological safety and quarterly re-calibration culture. Without preparation, teams treat Key Results like KPIs and lose the benefit.',
    },

    cascade_mode: {
      title: 'Cascade Mode', icon: '🔽', color: 'blue',
      tagline: 'The direction targets flow through the management hierarchy',
      what: [
        'Top-Down: Leadership sets company targets first → managers break them into team targets → employees receive individual targets. Ensures every person\'s work traces to a company priority.',
        'Bottom-Up: Employees propose their own targets first → managers review and link them upward. Bidirectional combines both simultaneously — managers share direction while employees draft targets in parallel.',
      ],
      reflects: [
        { where: 'Target Approval Workflow', what: 'Top-Down shows manager-assigned targets; Bottom-Up shows self-proposed targets pending approval.' },
        { where: 'Goal-Setting Phase UI', what: 'In Top-Down, employees see manager targets to align with. In Bottom-Up, they see an empty form to fill independently.' },
        { where: 'Cascade Tree View', what: 'Hierarchy of targets showing who created what and how child targets link to parent targets.' },
      ],
      practices: [
        { context: 'Large Corporates', rec: 'Top-Down. Strategy flows board → BU heads → managers → employees. Every individual target traces to a company priority.' },
        { context: 'Creative / Knowledge Work', rec: 'Bidirectional. Employees closest to the work often know what is achievable. Managers set direction; employees fill in details.' },
        { context: 'Startups / Agile Teams', rec: 'Bottom-Up. Fast-moving environments benefit from employee ownership. Managers review for alignment, not assignment.' },
      ],
      impact: 'Top-Down maximises strategic alignment but reduces employee ownership. Bottom-Up maximises ownership but risks misalignment. Most mature orgs evolve from Top-Down to Bidirectional over 2–3 years.',
      example: {
        scenario: 'How a ₹100Cr revenue target travels in each mode:',
        items: [
          'Top-Down:      CEO sets ₹100Cr → VP sets ₹40Cr South → Manager sets ₹8Cr → Employee gets ₹2Cr',
          'Bottom-Up:     Employee proposes ₹2.5Cr → Manager reviews → VP consolidates → CEO sees ₹102Cr',
          'Bidirectional: Both happen in parallel; manager reconciles top-down direction with bottom-up proposals',
        ],
        note: 'Top-Down gives control. Bottom-Up gives commitment. Bidirectional gives both — at the cost of more coordination time.',
      },
      mistake: 'Using Top-Down for R&D or design roles — creative work cannot be assigned top-down without destroying innovation. Use Bottom-Up or Bidirectional for knowledge workers.',
    },

    bsc_perspectives: {
      title: 'BSC Perspectives', icon: '⚖️', color: 'amber',
      tagline: 'The four strategic dimensions used to measure Balanced Scorecard performance',
      what: [
        'Kaplan & Norton defined four perspectives that together capture organisational health: Financial (Are we profitable?), Customer (Do customers love us?), Internal Process (Are operations efficient?), Learning & Growth (Are people developing?)',
        'Each BSC metric an employee creates must be tagged to one perspective. This prevents organisations from optimising only one dimension — you cannot hit revenue (Financial) while ignoring customer satisfaction (Customer).',
      ],
      reflects: [
        { where: 'Target Creation Form', what: 'Employees see a "Perspective" dropdown when adding a BSC Metric — populated from this list.' },
        { where: 'BSC Dashboard Widget', what: 'Four-quadrant view showing team average scores per perspective.' },
        { where: 'HR Reports', what: 'Organisation-level BSC report shows which perspectives are consistently under-performing.' },
      ],
      practices: [
        { context: 'Banks / NBFC', rec: 'Keep the 4 defaults. RBI-regulated entities are assessed across these exact dimensions.' },
        { context: 'Manufacturing / ESG-focused', rec: 'Replace "Learning & Growth" with "Safety & Sustainability" to match shop-floor priorities.' },
        { context: 'NGO / Government', rec: 'Replace "Financial" with "Budget Utilisation" — mission-driven orgs measure spend efficiency, not profit.' },
      ],
      impact: 'Renaming perspectives to your industry\'s language increases adoption. "Budget Utilisation" resonates with a government department; "Financial" does not.',
      example: {
        scenario: 'A bank branch manager\'s BSC targets across four perspectives:',
        items: [
          'Financial (35%):         AUM Growth ≥ 18% | NPA Ratio < 1.5%',
          'Customer (30%):          CSAT ≥ 4.3 | Complaint Resolution < 3 days',
          'Internal Process (20%):  KYC Compliance 100% | Loan TAT ≤ 7 days',
          'Learning & Growth (15%): 2 certifications | Team Training Hours ≥ 40',
        ],
        note: 'Without BSC, this manager focuses only on AUM. BSC forces equal attention on customer satisfaction and team development.',
      },
      mistake: 'Adding more than 4 perspectives. Kaplan & Norton themselves recommend exactly 4. More perspectives dilute strategic focus.',
    },

    cycle_default_type: {
      title: 'Default Cycle Type', icon: '📅', color: 'cyan',
      tagline: 'The default review cycle duration pre-filled when HR creates a new performance cycle',
      what: [
        'A performance cycle has a duration: annual, half-yearly, quarterly, or monthly. This setting pre-fills the default HR sees when creating a new cycle — they can override it per cycle.',
        'Annual is most common (one appraisal per financial year). Quarterly suits sales or agile teams. Monthly suits KPI-intensive roles like collections or call centre agents.',
      ],
      reflects: [
        { where: 'Create Cycle Form', what: '"Cycle Type" dropdown is pre-selected with this value, saving HR time.' },
        { where: 'Cycle Calendar', what: 'Duration is used to compute default start/end dates and review window.' },
        { where: 'Employee Dashboard', what: 'Cycle name and duration appear prominently on the employee\'s home screen.' },
      ],
      practices: [
        { context: 'Most Companies', rec: 'Annual. Aligns with the financial year and compensation review calendar.' },
        { context: 'Sales / Collections', rec: 'Quarterly. Revenue targets change too fast for annual planning to stay relevant.' },
        { context: 'Startups', rec: 'Half-Yearly. Agile enough without disrupting deep work every 3 months.' },
      ],
      impact: 'Cycle frequency signals culture. Quarterly = agility. Annual = stability. Mismatching frequency to team type reduces engagement.',
      example: {
        scenario: 'An IT company using different cycle types per team:',
        items: [
          'Engineering:  Annual (Apr–Mar)    — deep work; strategy changes slowly',
          'Sales:        Quarterly           — targets reset every 3 months with incentives',
          'Support/Ops:  Half-Yearly         — operational targets need mid-year correction',
        ],
        note: 'Set the default to the type used by the majority of employees. Exceptions are set per cycle by HR.',
      },
      mistake: 'Setting Quarterly as default for an annual-appraisal company — HR accidentally creates quarterly cycles and employees receive unexpected review emails.',
    },

    goal_setting_days: {
      title: 'Goal-Setting Days', icon: '📝', color: 'green',
      tagline: 'Default days employees have to submit targets after a cycle opens',
      what: [
        'When a cycle opens for goal-setting, employees have a limited window to submit targets. This sets the default window in days. HR can override per cycle.',
        'Longer windows (45–60 days) allow more discussion. Shorter windows (15–21 days) create urgency. Most companies use 20–30 days.',
      ],
      reflects: [
        { where: 'Create Cycle Form', what: '"Goal Setting Days" is pre-filled with this value.' },
        { where: 'Employee Dashboard', what: 'Countdown timer showing days remaining to submit targets.' },
        { where: 'HR Admin Report', what: 'Shows % of employees who submitted targets before the deadline.' },
      ],
      practices: [
        { context: 'Top-Down Mode', rec: '30 days. Managers need 1–2 weeks to assign; employees need 1–2 weeks to review.' },
        { context: 'Bottom-Up Mode', rec: '21 days. Employees draft first; review is faster since they proposed the targets.' },
        { context: 'Large Orgs (500+)', rec: '45 days. More approval layers; targets cascade through more hierarchy levels.' },
      ],
      impact: 'Too short → targets are rushed and copy-pasted from last year. Too long → deadline becomes irrelevant and HR chases employees in the final 2 days.',
      example: {
        scenario: 'Cycle opens April 1, goal-setting window = 30 days:',
        items: [
          'Days 1–7:   Managers assign direction to their teams',
          'Days 8–20:  Employees draft individual targets and submit',
          'Days 21–30: Managers review, approve, or return with comments',
          'Day 30:     Window closes; unapproved targets flagged to HR',
        ],
        note: 'After this window closes, targets are locked. Changes require a formal revision request.',
      },
      mistake: 'Setting 60+ days. Employees procrastinate and submit everything on the last day — no time for meaningful manager review.',
    },

    review_days: {
      title: 'Review Days', icon: '✍️', color: 'violet',
      tagline: 'Default days for the appraisal phase — from self-rating to manager sign-off',
      what: [
        'The review phase is when employees fill actual achievement + self-rating, and managers complete their review. This sets the total window. HR can override per cycle.',
        'Typical split: first half for employee self-rating, second half for manager review. Most companies use 15–30 days total.',
      ],
      reflects: [
        { where: 'Create Cycle Form', what: '"Review Days" pre-fills the review window duration.' },
        { where: 'Appraisal Form', what: 'Deadline countdown shown to employees filling self-rating.' },
        { where: 'Manager Dashboard', what: 'Pending appraisals listed with days remaining.' },
      ],
      practices: [
        { context: 'Small Teams (<50)', rec: '14–21 days. Managers handle fewer reports; quick turnaround is feasible.' },
        { context: 'Large Orgs (200+)', rec: '30 days. Managers have 10–15 indirect reports and need more calendar time.' },
        { context: 'With Calibration Sessions', rec: '45 days. If HR runs cross-team calibration workshops, add 2 extra weeks.' },
      ],
      impact: 'Rushed reviews produce inflated or lazy ratings. Adequate review time leads to more differentiated, fair ratings and meaningful appraisal conversations.',
      example: {
        scenario: '21-day review window:',
        items: [
          'Days 1–10:  Employees fill self-rating (actual value + rating per target)',
          'Days 11–21: Managers add their rating and written comments',
          'Day 21:     Cycle closes; HR generates performance report',
        ],
        note: 'HR can extend the deadline for individual employees (maternity leave, illness) from the Cycle Management screen.',
      },
      mistake: 'Not distinguishing self-rating deadline from manager deadline — if both share the same cutoff, managers start reviewing before employees finish self-rating, causing data conflicts.',
    },

    goals_scale_type: {
      title: 'Goals Rating Scale Type', icon: '📊', color: 'indigo',
      tagline: 'The scoring method used to rate goal, KRA/KPI, and OKR targets',
      what: [
        'Determines HOW a manager rates each goal or KPI. A 5-Point scale asks managers to pick a level (1–5). Percentage auto-calculates score as Actual ÷ Planned × 100. BARS provides a behaviour description at each level, removing manager subjectivity.',
        'For purely numeric targets (revenue, defect rate), Percentage works best. For qualitative goals needing judgement, BARS or a labelled 5-Point scale is more appropriate.',
      ],
      reflects: [
        { where: 'Appraisal Form — Goals Section', what: 'Rating input shows as dropdown (5-Point/BARS), number (Percentage), or custom selector.' },
        { where: 'Score Calculation Engine', what: 'Formula converting ratings to scores changes based on scale type.' },
        { where: 'Team Performance Report', what: 'Score distribution chart axis labels use this scale.' },
      ],
      practices: [
        { context: 'Manufacturing / Sales (pure numbers)', rec: 'Percentage. Score is objective: 94% achievement = 94. No manager bias possible.' },
        { context: 'IT / Consulting (mix of delivery + judgement)', rec: '5-Point with clear labels. Managers can rate strategic contributions not captured by numbers alone.' },
        { context: 'Healthcare / Compliance roles', rec: 'BARS. Each level defines an observable behaviour — critical when rating accuracy has safety or legal implications.' },
      ],
      impact: 'Scale type directly affects rating inflation. Percentage scales are immune — the number is the number. 5-Point scales without clear labels cluster at 3–4 because managers avoid extremes.',
      example: {
        scenario: 'Same KPI rated three ways — "Revenue: Plan ₹2Cr, Actual ₹1.85Cr":',
        items: [
          'Percentage:   1.85 ÷ 2.0 × 100 = 92.5 (objective, automatic)',
          '5-Point:      Manager judges → "Strong effort, nearly hit target" → Rating: 4',
          'BARS Level 4: "Achieved 90–99% of target; identified root causes of shortfall" → 4',
        ],
        note: 'Percentage is most defensible in pay-for-performance cultures. BARS is fairest when context matters as much as the number.',
      },
      mistake: 'Using Percentage for qualitative goals like "Improve team culture." 80% of what? Percentage only works when Planned and Actual are comparable numeric values.',
    },

    goals_scale_labels: {
      title: 'Goals Scale Labels & Values', icon: '🏷️', color: 'blue',
      tagline: 'The rating levels, their labels, and numeric values for goals scoring',
      what: [
        'Each level needs a label ("Exceptional") and a numeric value (5.0). The label is what managers see and pick from. The value feeds the weighted average score calculation.',
        'List levels from lowest to highest. Numeric values must be distinct and increasing. Decimals (e.g., 3.5, 4.0) allow finer score discrimination.',
      ],
      reflects: [
        { where: 'Appraisal Rating Dropdown', what: 'Managers select from this list when rating each target.' },
        { where: 'Scorecard Calculation', what: 'The numeric value of the chosen label is used in the weighted average formula.' },
        { where: 'Performance Band Matching', what: 'Final weighted average is compared to band min/max using these numeric values.' },
      ],
      practices: [
        { context: 'Standard Corporate', rec: '"Needs Improvement (1), Below Expectation (2), Meets Expectation (3), Exceeds Expectation (4), Exceptional (5)"' },
        { context: 'Avoid Pure Negatives', rec: '"Needs Improvement" is less demoralising than "Poor" for PIP conversations.' },
        { context: '3-Point Simplicity', rec: '"Below (1), Meets (2), Exceeds (3)" — faster for managers; reduces over-analysis paralysis.' },
      ],
      impact: 'Label names shape manager psychology. "Exceeds Expectation (4)" signals that 4 is above average. Without this, managers default to rating everyone 3 to avoid conflict (central tendency bias).',
      example: {
        scenario: 'A 5-point scale for a software company:',
        items: [
          'Level 1 — Needs Improvement   (1.0): Missed most targets; PIP required',
          'Level 2 — Below Expectation   (2.0): Partially met targets; coaching needed',
          'Level 3 — Meets Expectation   (3.0): Delivered as expected; reliable performer',
          'Level 4 — Exceeds Expectation (4.0): Delivered above target; took initiative',
          'Level 5 — Exceptional         (5.0): Significantly exceeded; led others',
        ],
      },
      mistake: 'Using the same label names but different numeric values across Goals and Competency scales — the final weighted score becomes mathematically meaningless.',
    },

    goals_pip: {
      title: 'Goals PIP Threshold', icon: '🚨', color: 'rose',
      tagline: 'Score at or below which an employee is flagged for a Performance Improvement Plan',
      what: [
        'PIP (Performance Improvement Plan) is a formal HR intervention for under-performers. If an employee\'s goals score is at or below this value, the system automatically creates a PIP alert in the HR queue.',
        'Set to your scale\'s second-lowest level. On a 5-point scale, threshold = 2 means anyone scoring 2 or below is flagged. Set to 0 to disable automatic PIP flagging.',
      ],
      reflects: [
        { where: 'HR Dashboard — PIP Queue', what: 'Employees crossing this threshold appear with their scores and manager details.' },
        { where: 'Appraisal Completion Email', what: 'HR receives an automated list of employees who fell below the threshold.' },
        { where: 'Employee Profile', what: 'A PIP badge appears on the profile, visible to HR and the direct reporting manager.' },
      ],
      practices: [
        { context: 'Performance-driven cultures', rec: 'Threshold = 2. Consistent "Below Expectation" warrants formal intervention.' },
        { context: 'Supportive / Development cultures', rec: 'Threshold = 1. Give employees more room — only flag "Needs Improvement" for PIP.' },
        { context: 'New Organisations / First Cycle', rec: 'Set to 0 (disabled). Calibrate your rating distribution first before activating automatic PIP.' },
      ],
      impact: 'Automatic flagging ensures no under-performer slips through unnoticed. Essential for legal defensibility in termination cases — you need a documented trail of performance intervention.',
      example: {
        scenario: 'End of annual cycle, PIP threshold = 2.0:',
        items: [
          'Employee A: Goals Score 1.8 → PIP Flagged 🚨',
          'Employee B: Goals Score 2.0 → PIP Flagged 🚨',
          'Employee C: Goals Score 2.1 → Not Flagged ✅',
          'HR receives: "2 employees require PIP review — schedule within 30 days"',
        ],
        note: 'The flag is an alert only. HR still reviews and formally issues the PIP — the system imposes no automatic consequences.',
      },
      mistake: 'Setting threshold too high (e.g., 3 on a 5-point scale) — this flags employees who "Meet Expectation" for PIP, which is legally problematic and demotivating.',
    },

    comp_scale_type: {
      title: 'Competency Rating Scale Type', icon: '🧠', color: 'purple',
      tagline: 'The scoring method for behavioural and skill-based competency targets',
      what: [
        'Competencies measure HOW someone works (behaviours), not WHAT they deliver (outcomes). The rating scale must reflect this — it should describe observable behaviours, not just numbers.',
        'BARS (Behaviorally Anchored Rating Scale) is the gold standard: each level has a specific behaviour description like "Level 3: Proactively explains technical concepts to non-technical stakeholders." This removes guesswork and reduces manager-to-manager inconsistency.',
      ],
      reflects: [
        { where: 'Appraisal Form — Competency Section', what: 'Competency rating input shows separately from the goals rating, using these competency-specific labels.' },
        { where: 'Final Scorecard', what: 'Competency ratings feed into the competency portion based on the Weightage split setting.' },
      ],
      practices: [
        { context: 'Large Enterprises (200+)', rec: 'BARS. Inter-rater reliability matters when many managers rate the same competencies across different teams.' },
        { context: 'Small Companies / First PMS', rec: '5-Point with clear labels. BARS requires upfront investment to define behaviour anchors per competency.' },
        { context: 'Leadership Assessments', rec: 'BARS. Leadership competencies like "Decision Making Under Pressure" require anchor behaviours to rate fairly and consistently.' },
      ],
      impact: 'Manager consistency on competency ratings is the hardest problem in performance management. BARS is the most scientifically validated solution. Without clear anchors, manager bias dominates.',
      example: {
        scenario: 'BARS ratings for the "Communication" competency:',
        items: [
          'Level 1: Struggles to articulate ideas even in familiar settings',
          'Level 2: Communicates clearly 1-on-1; struggles in group settings',
          'Level 3: Presents ideas clearly in meetings; tailors language to audience',
          'Level 4: Facilitates complex cross-team discussions; simplifies technical content',
          'Level 5: Influences senior leadership; communicates strategy org-wide',
        ],
      },
      mistake: 'Using Percentage scale for competencies. "What is 80% of Teamwork?" — it is meaningless. Competencies require qualitative labels, not arithmetic.',
    },

    comp_scale_labels: {
      title: 'Competency Scale Labels & Values', icon: '🏷️', color: 'purple',
      tagline: 'Proficiency levels and numeric values for competency ratings',
      what: [
        'Competency labels describe proficiency levels, not outcome achievement. Common frameworks: Novice → Developing → Proficient → Advanced → Expert, or frequency-based: Does Not Demonstrate → Occasionally → Consistently → Coaches Others → Role Model.',
        'Each label maps to a numeric value used in score calculation. Labels are what managers see; values are what the formula uses.',
      ],
      reflects: [
        { where: 'Appraisal Form — Competency Rating', what: 'Manager selects from this label list for each competency target.' },
        { where: 'Competency Score Calculation', what: 'Numeric value of selected label feeds into the competency weighted average.' },
      ],
      practices: [
        { context: 'Proficiency Framework', rec: '"Novice (1), Developing (2), Proficient (3), Advanced (4), Expert (5)"' },
        { context: 'Behaviour-Anchored', rec: '"Does Not Demonstrate (1), Occasionally (2), Consistently (3), Coaches Others (4), Role Model (5)"' },
      ],
      impact: 'Label language shapes how managers think. "Expert" implies long-term capability; "Exceptional" implies recent performance. Pick the language that matches how your org talks about skills development.',
      example: {
        scenario: 'Competency scale for a mid-sized IT company:',
        items: [
          'Level 1 — Needs Development (1.0)',
          'Level 2 — Developing        (2.0)',
          'Level 3 — Proficient        (3.0)',
          'Level 4 — Advanced          (4.0)',
          'Level 5 — Expert            (5.0)',
        ],
      },
      mistake: 'Copying goal labels (e.g., "Meets Expectation") for competencies. "Meeting Expectation" on a KPI is factual; "Meeting Expectation" on a behaviour is vague. Use proficiency or frequency language instead.',
    },

    comp_pip: {
      title: 'Competency PIP Threshold', icon: '🚨', color: 'rose',
      tagline: 'Competency score at or below which an employee is flagged for behavioural coaching',
      what: [
        'Separate from the Goals PIP threshold, this applies specifically to behavioural scores. An employee could hit all KPIs but fail on critical behaviours — this threshold catches that case.',
        'A competency PIP typically triggers a coaching plan or behavioural intervention rather than a formal goals improvement plan. Serious failures on Safety or Ethics competencies may warrant disciplinary action.',
      ],
      reflects: [
        { where: 'HR Dashboard — Competency Alerts', what: 'Employees flagged for low competency scores appear separately from the goals PIP queue.' },
        { where: 'Manager Coaching Queue', what: 'Manager receives a notification to initiate a coaching conversation.' },
      ],
      practices: [
        { context: 'Standard', rec: 'Threshold = 2. "Does Not Demonstrate" or "Needs Development" on a key behaviour warrants coaching.' },
        { context: 'Safety-Critical Roles', rec: 'Threshold = 2. An employee who "Occasionally demonstrates" safety protocols is a risk, not a development case.' },
      ],
      impact: 'Separating goals PIP from competency PIP lets HR identify two different problems: someone who misses targets (goals PIP) vs someone who damages culture while hitting targets (competency PIP).',
      example: {
        scenario: 'End of cycle, Competency PIP threshold = 2.0:',
        items: [
          'Employee X: Goals Score 4.2 (great delivery) | Competency Score 1.5 → Competency PIP 🚨',
          'Reason: Rated "Needs Development" on Teamwork and Communication',
          'Action: HR schedules coaching — not a goals performance plan',
        ],
        note: 'High delivery + low behaviour = a high-performer risk. These employees can be toxic to culture even while producing results.',
      },
      mistake: 'Using the same threshold for both goals and competency PIPs. A score of 2 on "Revenue Achievement" and 2 on "Collaboration" require completely different HR interventions.',
    },

    weightage_split: {
      title: 'Goals vs Competency Split', icon: '⚖️', color: 'indigo',
      tagline: 'How much each category contributes to the final performance score',
      what: [
        'The final score is a weighted combination: (Goals Score × Goals%) + (Competency Score × Competency%) = 100%. Example: Goals 70% + Competency 30%. If an employee scores 4.0 on Goals and 3.0 on Competency → Final = (4.0 × 0.70) + (3.0 × 0.30) = 3.70.',
        'This single setting defines what your organisation values most: delivery of measurable targets, or how those targets are achieved.',
      ],
      reflects: [
        { where: 'Final Score Calculation', what: 'Used in every employee\'s appraisal computation across all cycles.' },
        { where: 'Performance Band Assignment', what: 'The computed final score determines which performance band the employee falls into.' },
        { where: 'HR Reports', what: 'Score distribution histograms use final scores computed with this split.' },
      ],
      practices: [
        { context: 'Sales / Revenue roles', rec: 'Goals 80%, Competency 20%. Delivery is primary; behaviours are important but secondary.' },
        { context: 'Customer Service / Healthcare', rec: 'Goals 60%, Competency 40%. How you treat customers/patients matters as much as hitting numbers.' },
        { context: 'Leadership / Management roles', rec: 'Goals 50–60%, Competency 40–50%. Leaders are judged equally on people development and results.' },
      ],
      impact: 'This setting defines your culture. 80% Goals signals "results at all costs." 50/50 signals "how you work matters as much as what you deliver." Choose deliberately.',
      example: {
        scenario: 'Two employees with the same goals score but different behaviours:',
        items: [
          'Split: Goals 70%, Competency 30%',
          'Employee A: Goals 4.5, Competency 4.0 → Final = (4.5×0.7)+(4.0×0.3) = 3.15+1.20 = 4.35',
          'Employee B: Goals 4.5, Competency 2.0 → Final = (4.5×0.7)+(2.0×0.3) = 3.15+0.60 = 3.75',
          'Same goal performance, different final scores — the 30% competency weight makes behaviour visible.',
        ],
        note: 'Employee B hits targets but damages team culture. Without competency weight, both employees look identical in the data.',
      },
      mistake: 'Setting Competency to 0% to focus purely on results — signals to employees that behaviours don\'t matter, leading to cut-throat culture and high attrition over time.',
    },

    bands_overview: {
      title: 'Performance Bands', icon: '🎯', color: 'green',
      tagline: 'Map numeric final scores to meaningful qualitative performance categories',
      what: [
        'Performance bands are score ranges with labels and colours. After an appraisal cycle closes, the system takes each employee\'s final numeric score and assigns them to the first band whose min–max range includes that score.',
        'Typical setup for a 5-point scale: Exceptional (4.5–5.0), Exceeds Expectation (3.5–4.49), Meets Expectation (2.5–3.49), Below Expectation (1.5–2.49), Needs Improvement (0–1.49).',
      ],
      reflects: [
        { where: 'Employee Profile', what: 'Band label and colour badge appear on the employee\'s performance history card.' },
        { where: 'Team Performance Dashboard', what: 'Distribution chart shows how many employees fall in each band across the organisation.' },
        { where: 'HR Reports', what: 'Band-based filters allow HR to see all "Exceptional" employees for promotion or "Needs Improvement" for PIP.' },
        { where: 'Increment / Bonus Matrix', what: 'HR compensation tools use performance band as input for salary increment and bonus eligibility decisions.' },
      ],
      practices: [
        { context: 'Bell-Curve Calibration', rec: 'Design bands so "Meets Expectation" covers roughly 50–60% of expected scores. "Exceptional" should capture the top 10–15%.' },
        { context: 'Number of Bands', rec: '3–5 bands are ideal. More than 5 creates ambiguity in compensation decisions and is hard to communicate to employees.' },
      ],
      impact: 'Bands translate math into meaning. A score of 3.72 tells a manager nothing. "Exceeds Expectation" triggers a clear set of actions: consider for promotion, eligible for above-average increment.',
      example: {
        scenario: 'Standard 5-band setup for a corporate company (5-point scale):',
        items: [
          'Exceptional           4.50–5.00  🟢  Top 10%: promotion discussion, maximum increment',
          'Exceeds Expectation   3.50–4.49  🔵  Good performer: above-average increment',
          'Meets Expectation     2.50–3.49  🟡  Solid performer: standard increment',
          'Below Expectation     1.50–2.49  🟠  Needs coaching and improvement plan',
          'Needs Improvement     0.00–1.49  🔴  PIP: formal HR intervention required',
        ],
        note: 'Bands must cover the full score range with no gaps. A score of 2.50 must fall into exactly one band.',
      },
      mistake: 'Leaving gaps between bands (e.g., one band ends at 3.49, next starts at 3.51). A score of 3.50 falls in no band — the system throws an error or assigns "Unknown".',
    },

    min_weight: {
      title: 'Minimum Target Weight', icon: '⬇️', color: 'slate',
      tagline: 'Prevents trivial low-weight targets from padding out the scorecard',
      what: [
        'Every target in an employee\'s scorecard has a weight (importance %). The minimum weight rule prevents employees from adding many 1–2% targets just to fill up 100% without meaningful commitments.',
        'When a target\'s weight is below this value, goal-setting shows a validation warning. The employee cannot submit until they increase the weight or remove the target.',
      ],
      reflects: [
        { where: 'Target Submission Validation', what: '"Target weight is below minimum (5%)" warning blocks goal submission.' },
        { where: 'HR Validation Report', what: 'Flags employee scorecards where any target violates the minimum weight rule.' },
      ],
      practices: [
        { context: 'Standard', rec: '5% minimum. Anything below 5% has negligible impact on the final score and is likely padding.' },
        { context: 'Complex roles with 15+ targets', rec: '3% minimum. Project managers and HR BPs may have many smaller responsibilities.' },
      ],
      impact: 'Low-weight targets are never reviewed seriously. A 1% target that "slips" reduces the final score by only 0.01 points — no manager or employee notices. Minimum weight forces intentional target-setting.',
      example: {
        scenario: 'Employee tries to add 20 targets at 5% each:',
        items: [
          '20 targets × 5% = 100%  ✅ Passes minimum weight rule',
          '1 target at 4%          ❌ Warning: below 5% minimum — increase or remove',
        ],
      },
      mistake: 'Setting minimum to 0 (no minimum). Employees add 50 tiny targets to look busy on the dashboard without being held accountable for anything meaningful.',
    },

    max_weight: {
      title: 'Maximum Target Weight', icon: '⬆️', color: 'slate',
      tagline: 'Prevents one target from dominating the entire scorecard',
      what: [
        'The maximum weight prevents a single target from carrying too much of the appraisal. If one target carries 90% weight, the entire review depends on one metric — all other responsibilities become irrelevant.',
        'When a target exceeds this value, the system suggests splitting it. The employee can still save, but the warning signals to the manager to review the structure.',
      ],
      reflects: [
        { where: 'Target Submission Validation', what: '"Target weight exceeds maximum (50%). Consider splitting into sub-targets." shown during goal-setting.' },
        { where: 'Manager Review Screen', what: 'Over-weight targets are highlighted for manager attention.' },
      ],
      practices: [
        { context: 'Standard', rec: '50% maximum. No single target should be worth more than half the final score.' },
        { context: 'Simple / Junior roles', rec: '60%. Some roles have one core responsibility that genuinely warrants higher weight.' },
      ],
      impact: 'Without a maximum, sales managers sometimes set Revenue at 100% weight. This encourages unethical selling — hit the number at any cost, ignore compliance and customer satisfaction.',
      example: {
        scenario: 'Sales executive: "Revenue Achievement: 60%" → exceeds 50% max:',
        items: [
          'Suggested split:',
          '  New Business Revenue:    35%  ✅',
          '  Renewal / Retention:     25%  ✅',
          '  Customer Satisfaction:   20%  ✅',
          '  Compliance & Reporting:  20%  ✅',
        ],
      },
      mistake: 'Setting maximum to 100% (no maximum). The system allows a single-target scorecard — completely defeating multi-dimensional performance measurement.',
    },

    overplan_allowed: {
      title: 'Allow Over-Planning', icon: '📈', color: 'green',
      tagline: 'Lets employees commit to more than their manager\'s planned target',
      what: [
        'Over-planning means an employee\'s planned value exceeds what their manager planned for them. Example: Manager planned ₹2Cr revenue for the team; one employee proposes ₹2.5Cr as their personal commitment.',
        'When enabled, the employee must provide a written justification and the manager must explicitly approve. This creates accountability around ambitious self-targets.',
      ],
      reflects: [
        { where: 'Target Proposal Form', what: '"Your target exceeds manager\'s planned target" warning appears with a justification input field.' },
        { where: 'Manager Approval Screen', what: 'Over-planned targets are flagged with an orange badge for explicit manager decision.' },
        { where: 'HR Over-Plan Dashboard', what: 'Shows aggregate over-planning ratio across teams; alerts HR if total commitment is too high.' },
      ],
      practices: [
        { context: 'High-performance / Sales culture', rec: 'Enable. Over-planning signals ambition and creates healthy internal competition.' },
        { context: 'Strict Budget / Resource-constrained', rec: 'Disable. If targets are linked to budgets and headcount, over-planning creates false resource expectations.' },
      ],
      impact: 'In Bottom-Up or Bidirectional cascade, over-planning is what drives outperformance. Employees who set stretch plans and achieve them become visible high-performers.',
      example: {
        scenario: 'Team target: ₹10Cr revenue (5 employees, ₹2Cr each):',
        items: [
          'Employee 1: Plans ₹2Cr    (matches manager)     ✅',
          'Employee 2: Plans ₹2.5Cr  (over-plans 25%)  → needs justification + manager approval',
          'Employee 3: Plans ₹3Cr    (over-plans 50%)  → needs justification + manager approval',
          'HR Alert:   Team total ₹11Cr vs ₹10Cr plan → triggers multiplier check',
        ],
      },
      mistake: 'Enabling over-planning without setting the multiplier cap. Without a ceiling, a team could collectively commit to 200% of the manager\'s plan, breaking the cascade logic.',
    },

    overplan_multiplier: {
      title: 'Over-Plan Multiplier', icon: '✖️', color: 'amber',
      tagline: 'Maximum aggregate over-plan ratio before HR receives an alert',
      what: [
        'Even when individual over-planning is manager-approved, HR needs visibility when the aggregate team commitment significantly exceeds the manager\'s plan. Multiplier 1.15 means the team can commit up to 15% above the manager\'s planned target before HR is alerted.',
        'This is not a hard block — individual approvals still go through the manager. The multiplier is a diagnostic tool for HR to spot unrealistic aggregate planning.',
      ],
      reflects: [
        { where: 'HR Over-Plan Alert', what: 'Dashboard warning: "Team X has committed ₹11.8Cr against ₹10Cr plan (18% over — exceeds 15% threshold)".' },
        { where: 'Cycle Management Screen', what: 'HR can drill into which employees are over-planning and by how much.' },
      ],
      practices: [
        { context: 'Standard', rec: '1.15 (15% over). Healthy buffer for ambition while flagging unrealistic aggregate plans.' },
        { context: 'Aggressive sales teams', rec: '1.25 (25% over). Sales teams routinely over-plan; a tighter limit triggers constant noise.' },
      ],
      impact: 'Without this, a manager might approve several individually reasonable over-plans that collectively create an impossible aggregate. The multiplier keeps the cascade coherent at team level.',
      example: {
        scenario: 'Manager\'s plan: ₹10Cr | Multiplier: 1.15:',
        items: [
          'Team commits ₹10.5Cr (5% over)   → No alert   ✅',
          'Team commits ₹11.5Cr (15% over)  → Alert threshold hit ⚠️  HR notified',
          'Team commits ₹13Cr   (30% over)  → Alert fired; HR reviews aggregate ⚠️',
        ],
      },
      mistake: 'Setting multiplier to 1.0 while Allow Over-Planning is enabled — individual approvals immediately hit the aggregate cap, effectively disabling over-planning despite the toggle being on.',
    },

    require_parent_linkage: {
      title: 'Require Parent Linkage', icon: '🔗', color: 'blue',
      tagline: 'Every approved target must trace back to a parent target in the hierarchy',
      what: [
        'In a cascaded PMS, every employee target should link to their manager\'s target, which links to the VP\'s target, which links to a company goal. Parent Linkage enforces this — no orphan targets exist.',
        'When enabled, employees cannot submit a target without specifying which parent target it supports. This makes strategy cascade fully traceable from company level to individual.',
      ],
      reflects: [
        { where: 'Target Creation Form', what: '"Link to Parent Target" becomes a required field.' },
        { where: 'Cascade Tree View', what: 'Every target must have a parent — no orphan nodes appear in the tree.' },
        { where: 'HR Validation Report', what: 'Unlinked targets are flagged as compliance violations during goal-setting audit.' },
      ],
      practices: [
        { context: 'Strategic Alignment-focused', rec: 'Enable. Board, investors, and leadership want to see the "golden thread" from company goal to individual commitment.' },
        { context: 'R&D / PMO / Experimental Teams', rec: 'Disable for teams with project-specific targets that don\'t cascade from a company OKR.' },
      ],
      impact: 'Parent linkage enables the most powerful PMS use case: proving that every person\'s work contributes to a company priority. Without it, individual targets become siloed.',
      example: {
        scenario: 'With Require Parent Linkage enabled:',
        items: [
          'Company OKR:  "Achieve ₹500Cr revenue"',
          '  → VP KRA:   "South Region Revenue ₹150Cr"',
          '     → Mgr Goal: "Team Revenue ₹30Cr"',
          '        → Emp KPI: "Personal Revenue ₹6Cr"  MUST link to Manager Goal above',
          'Without parent link: employee cannot submit the target ❌',
        ],
      },
      mistake: 'Enabling parent linkage before top-level (company/leadership) targets are created. Employees are stuck on the submission form with nothing to link to.',
    },

    allow_self_propose: {
      title: 'Allow Self-Propose (Bottom-Up)', icon: '🙋', color: 'green',
      tagline: 'Employees can draft and propose their own targets without waiting for manager assignment',
      what: [
        'In Bottom-Up or Bidirectional cascade, employees drive target-setting. Self-Propose lets them create target proposals that enter the manager\'s approval queue — rather than waiting for the manager to assign targets.',
        'When employees propose their own targets, commitment to achieving them increases significantly (psychological ownership effect). The manager\'s role shifts from "assigner" to "coach and reviewer".',
      ],
      reflects: [
        { where: 'Employee Goal-Setting Form', what: '"Propose Target" button and drafting workflow appear.' },
        { where: 'Manager Approval Queue', what: 'Proposed targets appear under "Pending Review" — manager approves, edits, or rejects.' },
        { where: 'Cascade Tree', what: 'Self-proposed targets show as "Proposed" status until manager approves and links them.' },
      ],
      practices: [
        { context: 'Knowledge Workers / Professionals', rec: 'Enable. Engineers, analysts, and consultants know their work better than their managers. Self-proposal leads to more accurate, ambitious targets.' },
        { context: 'Structured / Compliance roles', rec: 'Disable. Factory operators and compliance officers need manager-assigned targets to ensure accountability to organisational standards.' },
      ],
      impact: 'Self-propose is the most powerful engagement lever in a PMS. Employees who set their own targets are significantly more likely to achieve them than those given top-down assignments.',
      example: {
        scenario: 'Bottom-Up goal-setting with self-propose enabled:',
        items: [
          'Employee drafts: "Migrate payment service to microservices by Q3" (KR, 30%)',
          'Employee submits for approval',
          'Manager links it to "Platform Modernisation" company objective → approves',
          'Target is now live in the employee\'s scorecard ✅',
          'Without self-propose: employee waits for manager to assign — often never happens',
        ],
      },
      mistake: 'Enabling self-propose without requiring manager approval — targets go live automatically, bypassing accountability checks.',
    },

    term_kra:              { title: 'KRA Label',              icon: '🏷️', color: 'blue',   tagline: 'Rename "KRA" to match your organisation\'s language',              what: ['"KRA" (Key Result Area) is PMS jargon. Renaming to "Focus Area", "Accountability", or "Work Stream" makes the form feel familiar to employees who have never used a PMS.', 'Display-only rename — data model still uses KRA internally.'], reflects: [{ where: 'Target Creation Form', what: 'Type label shows your custom term instead of "KRA".' }, { where: 'Appraisal Form', what: 'Target grouping and section headers use your custom label.' }], practices: [{ context: 'Manufacturing / Ops', rec: '"Responsibility Area" — supervisors already use this language.' }, { context: 'NGO', rec: '"Programme Area" — maps to project management language in the sector.' }], impact: 'Terminology mismatch is a top reason employees resist new HR systems — unfamiliar labels cause incorrect form entries and low adoption.', example: { scenario: 'A logistics company renames KRA → "Work Stream":', items: ['"Add a new Work Stream target"  ← drivers and supervisors immediately understand'] }, mistake: 'Renaming KRA to "Objective" — OKR Objectives exist in the same system, creating two different things with the same name.' },

    term_kpi:              { title: 'KPI Label',              icon: '🏷️', color: 'cyan',   tagline: 'Rename "KPI" to a term your employees already know',                what: ['"KPI" is familiar in corporate settings but less so in healthcare, education, or government. "Metric", "Success Measure", or "Clinical Indicator" may work better for your audience.'], reflects: [{ where: 'Target Creation Form', what: 'KPI target type shows your custom label.' }, { where: 'Scorecard View', what: 'Column header in the KPI list updates.' }], practices: [{ context: 'Healthcare', rec: '"Clinical Indicator" — avoids the corporate sound of KPI for medical staff.' }, { context: 'Education', rec: '"Learning Outcome Measure" — aligns with pedagogical language.' }], impact: 'Consistent terminology between the PMS and employees\' daily language reduces training overhead and increases self-service usage.', example: { scenario: 'Hospital uses "Clinical Indicator":', items: ['"Add a Clinical Indicator under Patient Care Focus Area"', 'Nurses immediately understand without PMS training.'] }, mistake: 'Leaving KPI as the label while employees only use Goal-based framework — they see KPI labels but create Goals, causing report mismatches.' },

    term_objective:        { title: 'Objective Label',        icon: '🏷️', color: 'indigo', tagline: 'Rename "Objective" (OKR term) to your organisation\'s vocabulary',    what: ['In OKR, an Objective is the qualitative direction statement. If your company uses "Strategic Priority", "Company Direction", or "Initiative" in strategy decks, match it here.'], reflects: [{ where: 'OKR Target Creation Form', what: 'Objective type shows your custom label.' }, { where: 'OKR Cascade Tree', what: 'Top-level nodes in the hierarchy use the custom term.' }], practices: [{ context: 'Strategy Teams', rec: '"Strategic Priority" — aligns with Balanced Scorecard / strategy map language.' }, { context: 'Product Teams', rec: '"Product Initiative" — maps to product roadmap language.' }], impact: 'When PMS labels match strategy deck language, employees see a direct connection between their daily work and company direction.', example: { scenario: '', items: ['"Add a Strategic Priority" ← employees recognise language from the CEO\'s quarterly deck'] }, mistake: 'Renaming Objective to "Goal" when Goal is also a target type — two different things get the same name, breaking the UI.' },

    term_key_result:       { title: 'Key Result Label',       icon: '🏷️', color: 'violet', tagline: 'Rename "Key Result" to your measurement vocabulary',                 what: ['Key Results are measurable outcomes that prove an Objective was achieved. Some organisations call them "Success Metrics", "Milestones", or "Measurable Outcomes".'], reflects: [{ where: 'OKR Target Form', what: 'Key Result type label updates.' }, { where: 'Objective Card', what: 'KR list under an Objective uses the custom term.' }], practices: [{ context: 'Engineering', rec: '"Success Metric" — maps to acceptance criteria language engineers use daily.' }, { context: 'Executives', rec: '"Critical Milestone" — connects to board-level delivery language.' }], impact: 'Clear terminology reduces the constant "What\'s the difference between a KR and a KPI?" question in every OKR workshop.', example: { scenario: '', items: ['"Add a Success Metric under this Strategic Priority"'] }, mistake: 'Renaming Key Result to "KPI" when KRA/KPI framework is also enabled — two different things get the same name.' },

    term_goal:             { title: 'Goal Label',             icon: '🏷️', color: 'green',  tagline: 'Rename "Goal" to your organisation\'s plain-language target term',   what: ['Goals are simple individual targets without framework jargon. If your organisation uses "Deliverables", "Programme Targets", "Commitments", or "Quotas", match that here.'], reflects: [{ where: 'Target Creation Form', what: 'Goal type shows the custom label.' }, { where: 'Employee Dashboard', what: 'Target list section header uses the custom term.' }], practices: [{ context: 'Sales', rec: '"Quota" — matches the language sales managers use daily.' }, { context: 'NGO / Government', rec: '"Programme Target" or "Scheme Deliverable".' }], impact: 'When labels match daily language, employees stop saying "I don\'t understand the appraisal form" and start filling it independently.', example: { scenario: '', items: ['NGO: "Goal" → "Programme Target" — field workers immediately understand the form'] }, mistake: 'Renaming Goal to "Objective" when OKR Objectives are also enabled — same name collision.' },

    term_competency:       { title: 'Competency Label',       icon: '🏷️', color: 'purple', tagline: 'Rename "Competency" to match your HR or L&D vocabulary',            what: ['"Competency" is HR language. Employees in manufacturing or field roles often prefer "Behaviour", "Skill", or "Capability". Renaming reduces the gap between the PMS form and everyday language.'], reflects: [{ where: 'Competency Target Form', what: 'Type label shows the custom term.' }, { where: 'Appraisal Competency Section', what: 'Section heading uses the custom label.' }], practices: [{ context: 'Manufacturing', rec: '"Work Behaviour" — supervisors already rate operators on safety and discipline behaviours.' }, { context: 'L&D-driven companies', rec: '"Capability" — maps to learning journey and capability framework terminology.' }], impact: 'Competency ratings are the most subjective part of appraisals. Clear, familiar labelling reduces arguments about what the field means.', example: { scenario: '', items: ['Manufacturing: "Competency" → "Work Behaviour"', '"Rate on Work Behaviour: Safety Adherence" — makes immediate sense on the shop floor'] }, mistake: 'Renaming to "Soft Skill" — implies competencies are less important than goals, undermining the 30% weight you\'ve assigned them.' },

    term_weight:           { title: 'Weight Label',           icon: '🏷️', color: 'slate',  tagline: 'Rename "Weight" (importance % of each target) to your preferred term', what: ['Weight is the percentage importance of a single target. All weights must sum to 100%. Some organisations prefer "Priority", "Allocation", or "Importance %".'], reflects: [{ where: 'Target Creation Form', what: 'Weight input field label updates.' }, { where: 'Scorecard Summary', what: 'Column header showing each target\'s share of total score.' }], practices: [{ context: 'General', rec: '"Priority (%)" — intuitive; employees understand priority naturally.' }], impact: 'Weight is the most commonly misunderstood field in PMS forms. "Importance (%)" reduces support tickets during goal-setting season.', example: { scenario: '', items: ['"Importance: 30%"  ← employees instantly understand this target counts for 30% of my score'] }, mistake: 'Renaming to "Score" — weight is the importance multiplier, not the performance rating. Calling it "Score" causes confusion.' },

    term_planned:          { title: 'Planned Target Label',   icon: '🏷️', color: 'green',  tagline: 'Rename "Planned" (the committed target value) to your preferred term', what: ['The Planned value is what the employee commits to achieving by end of cycle — the benchmark. Alternatives: "Target", "Committed Value", "Quota", "Budget".'], reflects: [{ where: 'Target Setting Form', what: 'Planned value input label updates.' }, { where: 'Appraisal Form', what: '"Planned: [value]" shown next to actual achievement.' }], practices: [{ context: 'Sales', rec: '"Quota" — matches CRM and sales planning language.' }], impact: 'Naming this "Quota" or "Budget" aligns the PMS with existing operational reporting, reducing double-entry confusion.', example: { scenario: '', items: ['"Quota: ₹2,00,000"  ← sales teams immediately understand this'] }, mistake: 'Renaming both Planned and Actual to similar words — they must remain clearly distinguishable.' },

    term_actual:           { title: 'Actual Achievement Label', icon: '🏷️', color: 'green', tagline: 'Rename "Actual" (what was delivered) to your preferred term',        what: ['The Actual value is what the employee delivered during the cycle. Entered during self-appraisal. Alternatives: "Delivered", "Achievement", "Result", "Outcome".'], reflects: [{ where: 'Self-Appraisal Form', what: 'Employee fills "Actual" during the review phase — this label updates.' }, { where: 'Score Calculation', what: 'Actual ÷ Planned × 100 = achievement % for percentage-scale goals.' }], practices: [{ context: 'Operations', rec: '"Achieved" — simple, action-oriented language.' }], impact: 'The Actual field is the most critical input in the appraisal. Clear labelling reduces blank entries and "N/A" responses.', example: { scenario: '', items: ['"Delivered: ₹1,85,000"  vs planned ₹2,00,000 = 92.5% achievement'] }, mistake: 'Renaming to "Score" — Actual is the raw achievement value, not the performance rating. Two separate fields.' },

    term_stretch:          { title: 'Stretch Target Label',   icon: '🏷️', color: 'amber',  tagline: 'Rename "Stretch" (the aspirational above-plan target) to your preferred term', what: ['The Stretch target is optional — an aspirational value above the planned commitment. Not used in score calculation. Alternatives: "Aspirational Target", "Moon-Shot", "Outperform Target".'], reflects: [{ where: 'Target Creation Form', what: 'Optional stretch input label updates.' }, { where: 'Employee Dashboard', what: 'Progress bar shows "Stretch Achieved!" when Actual ≥ Stretch.' }], practices: [{ context: 'High-performance cultures', rec: '"Moon-Shot" — signals that exceeding the planned target is celebrated, not just expected.' }], impact: 'Stretch targets motivate high-performers without penalising those who only meet the plan. The label signals whether your culture celebrates over-delivery.', example: { scenario: '', items: ['Planned: ₹2,00,000 | Moon-Shot: ₹2,50,000 | Actual: ₹2,60,000', 'Dashboard: "Moon-Shot Achieved! 130% of plan" 🎉'] }, mistake: 'Treating Stretch as the real committed target. If employees know they\'ll be scored against stretch, they set artificially low planned targets.' },

    term_performance_band: { title: 'Performance Band Label', icon: '🏷️', color: 'slate',  tagline: 'Rename "Performance Band" (the qualitative score category) to your preferred term', what: ['Performance bands are qualitative categories assigned to final score ranges. Alternatives: "Rating Category", "Impact Band", "Performance Category".'], reflects: [{ where: 'Employee Profile', what: 'Shows the employee\'s band for the completed cycle.' }, { where: 'Appraisal Completion Screen', what: '"Your Performance Band: Exceptional" — label updates.' }, { where: 'HR Reports', what: 'Distribution report header uses the custom term.' }], practices: [{ context: 'NGOs', rec: '"Impact Band" — aligns with social impact measurement language.' }], impact: 'The band label is the most visible outcome of the entire appraisal cycle. Employees remember their band long after they forget their numeric score.', example: { scenario: '', items: ['"Impact Band: Outstanding Contributor"  ← NGO employees respond to this language'] }, mistake: 'Renaming to "Rating" — "Rating" is also used for scale type. Two different things sharing the same name causes confusion in reports and emails.' },

    ninebox_enabled: {
      title: '9-Box Talent Grid', icon: '🔲', color: 'violet',
      tagline: 'Enable the 9-Box grid to plot employees by Performance × Potential',
      what: [
        'The 9-Box Talent Grid is a 3×3 matrix used in succession planning and talent management. X-axis = Performance (derived from final appraisal score). Y-axis = Potential (assessed separately by manager or HR — it is a judgment call, not a formula).',
        'Enabling this adds a "Potential Rating" input (1=Low, 2=Medium, 3=High) to the calibration phase. Combined with the final score, it places each employee into one of 9 boxes.',
        'This feature does NOT change how targets are set or scored. It is an overlay on top of the completed appraisal — adding a talent dimension to the performance data.',
      ],
      reflects: [
        { where: 'Calibration Phase', what: 'HR and managers enter potential ratings after manager scores are finalised.' },
        { where: 'Talent Grid Report', what: '3×3 matrix showing all employees with their box placement and custom labels.' },
        { where: 'Employee Profile', what: 'Shows the employee\'s 9-box position for the cycle (visible to HR and manager only).' },
      ],
      practices: [
        { context: 'Large Enterprises (200+ employees)', rec: 'Enable. 9-box is most valuable when you have multiple succession candidates and need to identify talent pipeline objectively.' },
        { context: 'BFSI / Manufacturing', rec: 'Enable, especially when BSC is active — BSC provides multi-dimensional performance; potential adds the future dimension.' },
        { context: 'Small teams (<50)', rec: 'Optional. Value comes from cross-team comparison during calibration, which requires enough data points.' },
      ],
      impact: '9-box identifies four critical talent actions: retain Stars (high perf + high potential), develop Core Players, coach Inconsistent Players, and address Underperformers. Without it, HR only sees the past; with it, HR sees the future pipeline.',
      example: {
        scenario: '9-Box placement examples:',
        items: [
          'Final Score 4.2 (High Perf) + Potential 3 (High) = Box 3_3 → Star / Future Leader',
          'Final Score 4.0 (High Perf) + Potential 1 (Low)  = Box 3_1 → Effective Performer (retain, not promote)',
          'Final Score 2.2 (Low Perf)  + Potential 3 (High) = Box 1_3 → Enigma (coach aggressively)',
          'Final Score 1.8 (Low Perf)  + Potential 1 (Low)  = Box 1_1 → Underperformer (PIP or exit)',
        ],
        note: 'The 9-box does not automatically trigger any action — it is a conversation tool for HR and leadership.',
      },
      mistake: 'Using 9-box without calibration sessions. Potential ratings entered by individual managers without cross-comparison are inconsistent — one manager\'s "High Potential" may be another\'s "Medium". Calibration is essential.',
    },

    bsc_perspective_weights: {
      title: 'BSC Perspective Weights', icon: '⚖️', color: 'amber',
      tagline: 'Set the relative importance of each BSC perspective in the scorecard',
      what: [
        'When using Balanced Scorecard, targets are tagged to one of your configured perspectives (Financial, Customer, Internal Process, Learning & Growth). Perspective weights determine how much each perspective contributes to the overall BSC score.',
        'Example: Financial 35%, Customer 30%, Internal Process 20%, Learning 15%. A BSC target\'s contribution to the final score = target weight × its perspective weight.',
        'All perspective weights must sum to 100%. If equal weighting is preferred, set 25% each.',
      ],
      reflects: [
        { where: 'BSC Scorecard View', what: 'Each perspective block shows the perspective weight prominently.' },
        { where: 'Final Score Calculation', what: 'BSC perspective scores are aggregated using these weights before flowing into the goals/competency split.' },
        { where: 'HR Reports', what: 'Per-perspective performance distribution uses these weights for comparison.' },
      ],
      practices: [
        { context: 'Banks / NBFC (profit-driven)', rec: 'Financial 35%, Customer 30%, Process 20%, Learning 15%. Profitability is primary.' },
        { context: 'Hospitals / Healthcare', rec: 'Customer (Patient) 35%, Process 30%, Learning 20%, Financial 15%. Patient outcomes first.' },
        { context: 'Government / Public Sector', rec: 'Process 35%, Customer (Citizen) 30%, Learning 20%, Financial 15%. Process compliance is primary.' },
      ],
      impact: 'Perspective weights signal strategic priorities to employees. A bank that sets Financial at 50% tells employees: hit the revenue number at all costs. Balanced weights signal a sustainable, long-term culture.',
      example: {
        scenario: 'Branch Manager\'s BSC with perspective weights applied:',
        items: [
          'Financial (35%): Perspective Score 3.8 → Contribution = 3.8 × 0.35 = 1.33',
          'Customer (30%): Perspective Score 4.2 → Contribution = 4.2 × 0.30 = 1.26',
          'Process (20%):  Perspective Score 4.5 → Contribution = 4.5 × 0.20 = 0.90',
          'Learning (15%): Perspective Score 3.5 → Contribution = 3.5 × 0.15 = 0.53',
          'Total BSC Score: 1.33 + 1.26 + 0.90 + 0.53 = 4.02 / 5',
        ],
        note: 'Without perspective weights, all four dimensions contribute equally even if the bank values Financial 2× more than Learning.',
      },
      mistake: 'Leaving all perspective weights equal when your business strategy clearly prioritises one dimension. Equal weights are politically safe but strategically inaccurate.',
    },

  },

  /* ─── Talent Grid Tab ───────────────────────────────────────────────────── */
  talentGrid: {
    section:
      'Configure the 9-Box Talent Grid — a succession planning tool that plots every employee on a 3×3 matrix.\n\n' +
      'X-axis (Performance): automatically derived from the final appraisal score.\n' +
      'Y-axis (Potential): manually rated by the manager or HR during calibration.\n\n' +
      'These settings control how the matrix is labelled, who enters potential ratings, and what additional talent fields are tracked.',

    potentialLevels:
      'The three potential levels shown on the Y-axis of the talent grid.\n\n' +
      'Default: Low / Medium / High. You can rename them to match your language (e.g., "Developing / Growth / Ready Now").\n\n' +
      'These labels appear in the potential rating dropdown during calibration, and as Y-axis labels on the talent grid report.',

    performanceThresholds:
      'Defines which final score range maps to Low / Medium / High performance on the X-axis.\n\n' +
      'Example: Low = 0–2.49, Medium = 2.50–3.99, High = 4.00–5.00 (on a 5-point scale).\n\n' +
      'Align these with your performance bands so "High Performance" matches your "Exceeds" or "Exceptional" bands.',

    boxLabels:
      'The name assigned to each of the 9 cells in the talent grid.\n\n' +
      'Default labels: "Star / Future Leader" (3_3), "Core Player" (2_2), "Underperformer" (1_1), etc.\n\n' +
      'Rename boxes to match your HR terminology. Names are visible on calibration reports and succession plan documents.',

    whoRatesPotential:
      'Controls who can enter potential ratings during the calibration phase.\n\n' +
      'Manager: the direct manager enters potential rating for each reportee during their calibration session.\n' +
      'HR Only: only HR administrators can assign potential ratings (prevents manager bias).\n' +
      'Calibration Committee: potential is agreed during a moderated group calibration session (most common in mature PMS).\n\n' +
      'Recommended: HR or Calibration Committee — managers tend to rate their best performers as "High Potential" to protect them, regardless of actual future readiness.',

    showSuccessionRisk:
      'When enabled, calibrators can additionally mark each employee\'s succession risk.\n\n' +
      '"Flight Risk": employee is likely to leave if not engaged (inform retention strategy).\n' +
      '"Key Person Risk": employee is critical and has no backup (inform succession planning).\n' +
      '"Bench Strength": employee is ready to step up (inform promotion pipeline).\n\n' +
      'Adds one extra field to the calibration form per employee.',

    showReadiness:
      'When enabled, calibrators can mark when a "High Potential" employee will be ready for the next role.\n\n' +
      '"Ready Now": can be promoted in the current cycle.\n' +
      '"Ready in 1–2 Years": needs development before promotion.\n' +
      '"Long-Term (3+ Years)": high potential but early in career.\n\n' +
      'This is the core output of succession planning — the readiness field builds the promotion pipeline.',
  },

  /* ─── Target Form — BSC and 9-box fields ───────────────────────────────── */
  target: {
    bscPerspective:
      'The BSC perspective this metric belongs to.\n\n' +
      'Every BSC Metric must be tagged to one perspective (Financial, Customer, Internal Process, Learning & Growth — or your renamed versions).\n\n' +
      'Perspective determines how this metric contributes to your overall BSC score, based on the perspective weights configured in Org Settings.',
  },
};
