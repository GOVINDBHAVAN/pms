# Performance management system

## Start

- Create git for this project and commit the first before start the development.
- Create gitignore file as per standard react and nodejs project
- Create the project with @specifications.md, start building the project steps, first prepare the project as per '1. PROJECT STRUCTURE'.
- Create the command (powershell or batch on my windows) so that both project server and client can run in a single command to test the application.
- # install dependency npm i on both server and client then run the project with ./dev.ps1.
- Change sqllite3 with alternative because it was not working on windows.
  - Proceed to prepare  @specifications.md for '2. TECHNOLOGY STACK'
  - Proceed to prepare  @specifications.md for '3. DATABASE SCHEMA'
  - Create a batch and ps file to stop the running both server and client project running
  - Proceed to prepare  @specifications.md for '4. SETUP WIZARD — DESIGN (Most Important UX Feature)'
  - Proceed to prepare  @specifications.md for '5. ORG SETTINGS JSON SCHEMA'
  - Update the @specifications.md that whatever UI we developed there should be an information (i) icon for describing the help and put the help content with meaningful content based on the label and the business logic you have identified of this project, so that I can also learn the UI which you are building and how to use this application for demonstration and continuing the further development.
  - I didn't see the (i) help icon against each field of this 'org settings' page, I need the user to understand the purpose of each fields on the system.
  - give in depth information on this particular 'Active Performance Types' so that users can understand which one they can choose, you can prepare custom popup model to explain these, I suggest to put (i) against each of the checkboxes like KRA, OKR, goal, etc, and explain to the user that this feature is be applicable to which industry and which kind of business and what the company will get benefit from this (I personally has no experience or knowledge of these things like KRA, OKR, Goal, BSC, Key result, KPI etc) so that I can also learn and understand these thing.
  - # check your response of last prompt is resulting in 'than than than' check and reduce the content if that is too-long to be accomodate, need to first prepare workable model here and later we can complete them further individually.
  - can you also update other all fields of this OrgSettings page with in-depth explanation on custom popup model , I need to understand this product in depth for my own understanding of the PMS model, you can educate me as well by just clicking on the popup model to see and understand their internal working and where it will reflect later with importance, give in-depth explanation with real life examples and industry wise best practices.
  - PENDING: Proceed to prepare  @specifications.md for '6. INDUSTRY PRESETS'



## TODOs

### General software points

- DONE: Software product tag line 'Performance management for humans, not HR consultants' Update this in software login and home page
- DONE: Prepare this software project memory file for the business rules we have written so far and in future as well that Claude Code can refer them whenever developing a new feature or modify existings. It's very important that we develop a correct system based on industry accepted norms.
- DONE: Make this memory file available so that the project can be port to another system after taking it's git check
- DONE: Add 9-box support, how does it work along with Balance score card? Can they both co-exist if so then prepare the foundation in the system at each and every steps if either or both are enabled in the 'org settings'
- DONE: Update project memory that, when creating At employee/HOD input screen the 'learn more' or (i) feature should be available at group level like Key-Result, KPI, Goal, Compentancy so that end users can understand what to enter there and that should not be missed during those pages development. Similar things to be considered during review and approval stages.
- DONE: Update my @CLAUDE.md file instead of my user computer profile files 
- DONE: Now fine-tune this 'org setting' page so that it should allow selection which are mutually exclusive like if the 'OKR Objective' is selected then why do HR need to select 'OKR key result' - I presume these two are used injunction together (correct my understanding) and similarly fix the interconnected fields which the user should not missed to select or it should be auto-select or disabled if that thing is not applicable in the selection of 'Active Performance Types' like if the HR has selected only 'Compentency' whether they can do anything with tabs like 'Weightage' or 'Rating Scale', similarly check for correct configuration the user can do without doing or leaving any mistake.
  

### Validation

- DONE: If the use has selected 'Framework' then why do they need to select 'Active performance types', is this a duplication? Do we really need 'Framework' selection?
- DONE: check the mapping of 'Framework' with 'Active Performance Types' again, can we correct the mapping based on selection options of 'Active Performance Types' can be visible or selected
- DONE: again check if I select OKR in framework type then it's not selecting 'OKR' by default and disable this selection itself, do the mapping again and also add option to disable cascading option in the selection, do verify cascading applicability based on framework type (if cascading is not applicable on Compentency-based then we can disable cascading also).
- DONE: The cascading drop-down is not showing 'Not Applicable' option to disable the cascading option in the system.
- DONE: VERY IMPORTANT: Update the memory of the project @CLAUDE.md  to understand the domain business core logic @BUSINESS_LOGIC.md  of the PMS system that it should always adhere them, it should ALWAYS refer to this @BUSINESS_LOGIC.md whenever developing any new or modify existing feature, it should always first validate the changes cross check with the @BUSINESS_LOGIC.md, if it's not inline with @BUSINESS_LOGIC.md then do not proceed to make that changes initiated in the future prompt, also verify the existing setup and structure that is it inline with the this @BUSINESS_LOGIC.md 
- DONE: check when I select different framework types randomly and at the end select 'Hybrid' the Cascading dropdown is showing in disabled color, the code is to be correct here.
- DONE: Check the 'org settings' page the tabs like 'Rating Scale' etc should be applicable tabs depend on the selection of 'Active Performance Types' or 'Framework' to avoid confusion at the user side.
- DONE: Refer this image, I want the ratings can be defined when individual/users/HR creating the measurable things like Key-results or KPI so that in some of the measurables sales values in number can be entered, whereas some can be yes/no, or percentage, BARS, do we really need this to be fixed for all measurables in the system and not allow the end-users to customize and choose different measurables against their each line-items?
- DONE: FOLLOWUP PROMPT: Yes proceed, and regarding 'Org Settings → Rating Scale', I would like to suggest that in 'org settings' we can allow the users to create or modify the measurement types. Here predefined measurement types should be there and users can verify and configure them, and at end-users data-entry stages, they can choose the available measurable types from this 'org settings rating scale'
- DONE: I have confusion over this 'Weightage' Tab in the 'org settings' page, is it only applicable to Goals / Compentency? If so then can we rename it appropriately so that end-users can understand it?
- DONE: FOLLOWUP PROMPT: if it's final score tab, check if that could be a better name of this tab along with changes inside the tab of 'score split' in '"Goals vs Competency Split' area
- DONE: Fine-tune the 'org settings' page rating tab for groups and categorization to make the page more understable, currently it's displaying lots of fields which can confuse the end-users, can we add collapsable configuration for a better user experience.
- DONE: FOLLOWUP PROMPT: By default all should be collapsed.
- DONE: I can still see the dropown of Scale-type is showing in 'org settings' 'Rating tab' is this required now since the same would be available at end-user line item stage.
- DONE: FOLLOWUP PROMPT: Under review scoring scale, check the heading 'Goals / KRA / KPI' is it okay here or it can be change to GOAL only depending on the options available inside it?
- DONE: FOLLOWUP PROMPT: can you again validate the heading you have set is 'KRA / KPI' whereas the content is not seems related to KRA / KPI, it's seems to be of GOALS, (correct if I am doing mistake here).
- DONE: FOLLOWUP PROMPT: can you re-confirm the words 'Goals Rating Scale KRA/KPI' are okay here and inside this section, correct my understanding is it related to KRA/KPI entry or approval or reviewal at any stage or it's just used for Goals review/status update
- DONE: FOLLOWUP PROMPT: also check if these 'Performance Review Rating' will be used in Goals as well other than KR/KPI review time?
- DONE: Who can enter what configuration - CEO/VP/Directors can enter OKR or Key-results/Goals/KPI, Department heads can enter what OKR/KR/KPI/Goals/Compentancy, similarly mid-managers and employees can enter what OKR/KR/KPI/Goals/Compentancy - by default it should have correct mapping and configured in the system.
- DONE: FOLLOWUP PROMPT: The employees profile shown resembles IT Tech company, change the employees profiile shown non-IT specific designations
- DONE: FOLLOWUP PROMPT: Keep director/CEO/VP as the first hirarchy, then HOD, Assistant Manager, Senior Executive, Executive
- DONE: FOLLOWUP PROMPT: Reorganize the Levels, Director is L1 not L5, rearrange others.
- DONE: FOLLOWUP PROMPT: The L1 Director/CEO should update the OKR of the company, if the OKR is selected, make the configuration default, to avoid selection of this manually.
- DONE: FOLLOWUP PROMPT: If OKR is selected then Key Result should be selected by default at all levels, similarly if KRA and KPI is selected then KPI should be selected by default at all level, check if this logic is correct
- Check-in feature is to be developed along with review-cycle wise input by employees/managers, the check-in feature will result in timely update of the status by employees wihtout rely on HR/Admin to open the review cycle window to them. These check-ins will help employees to update the status in the system and also to update the progress of their OKR/KR/KPI/Goals on time and reflect them in the organization dashboard of managers. Provide the check-ins enable / disable feature in the 'org settings' page by default allowed.
  

### Cascading

- Implement cascading throughout the application if enabled, this should not be missed when we are adding further new features. Top-to-bottom, bottom-to-top or bidirectional.

### Sample Data and multiple companies sample for POC

- DONE: Revise login page functionality to first select the demo database type (IT company, Manufacturing company, Pharma company, etc) and the user/employee to login with without remembering/typing any user/employee along with their password this will be use for a quick demostration. 
- DONE (Phase 1): 50-employee TechCorp Demo seeded — L1 CEO → L2 VPs (4) → L3 GMs (8) → L4 Sr Managers (12) → L5 Managers (16) → L6 Sr Executives (6) → L7 Associates (3) across 4 depts (Sales, Engineering, Support, HR). Grades L1→L9 defined. Employee Master page built at /org/employees with List + Org Chart views, reporting chain panel, and Add/Edit modal. PUT /employees/:id fixed to allow reporting_to = null (root employee).
- PENDING (Phase 2): OKR cascade target visualization — when employee enters targets, show company OKR (L1) and parent manager's KR as context panel. Manager-suggest-to-reportee feature (push draft KR to direct reportees). Stretch target (over/under plan) visualization across the cascade chain. These require the My Targets page to be built.


### Templates of KR/KPI (later)

- Industry wise ready-to-use OKR/KR/GOAL/KPI/Compentenacy templates and selection in the employee Input screen. If admin/HR has allowed template selection, then the employees can pick the template line-item or entire template form to modify and fine-tune it to prepare their submission of KPI, compentancy.
- Preconfigured models and frameworks based on Global succesful brands like Google, Amazon, Netflix, Wallmart, Facebook, or small but known successful case studies, which are successful and proven, the industry wise selection and template of the highly proven case studies can be selected to start implementing that within the organization to quickly configure the OKR, KRA-KPI, they can enter their top-level targets with minimum inputs and rest of the down-team can continue updating their targets based on the senior management guidelines.


### Cycles

- DONE: Review cycle can be defined by the client such that daily, weekly, bi-weekly, monthly, quarterly, semin-annually, annually. Create the Cycles setup page now, HR/Admin initiate the cycle period (financial year by default), depending on 'org settings' OKR,KRA-KPI,Goals,Compentency, the applicable these framework will get opened to the end-users (Director, Vp, HOD, Managers, employees) to start enterring the data (the input window of individuals and director or HOD) we'll plan after this cycle preparation page. Check and prepare for industry norms that in which month/date-range Targets preparation (Goal-setting) should be done and by whom and approvals by date-range, then self-assess by individuals by when (check-in can be done anytime if allowed), then approval by date-range, Final review of this cycle by when and approval date range to compute the final score for the year. When creating a new cycle for next year, the KRA-KPI should continue from past years and OKR to be redefined.
- DONE: Input screen of individual (Director, HOD, employees) to set the targets/guidelines of their OKR,KRA-KPI,Goals,Compentency depending on the 'org settings' and cascading rules should follow, think in-depth based on the cascading is configured, you can suggest if top-down or bottom-up or bidirectional is configured then how will initiate first (Director of the company then HOD then employees or vice versa or in-parallel, how to handle this complexity in most simpler way?) It is the most critical part of the system, think in-depth before making changes. Prepare the necessary steps of implementing the cascading of OKR/KRA-KPI/Goals UI and selection of OKR/KRA-KPI/Goals cascade and link with a new OKR/KRA-KPI/Goals of HOD/Employees from it's superiors.
- DONE: Prepare sample data of input target/guidelines of the organization in our demo companies. Ensure that KRA-KPI targets are defined not depending on 'Cycles' whereas the OKR and Goals (check if Goals are similar nature as OKR to depend on Cycles) are defined as per cycles, prepare multiple years cycles and targets, where KRA-KPI targets are defined and continued from previous years and OKR/Goals keep gets changed in Cycles (yearly basis). This is most important step to visualize the correctness of this demo/POC. The cascading rules will come here too, the targets from top-down, bottom-up or bidirectional, how this will work here, check that in-depth. My input for top-down case here is L1 is giving company sales growth target for all in form of OKR and some KRA-KPI (continue from past) and all L2 will cascae that OKR, some KRA+KPI (continue from past) and similarly employees will do the same, here we need to clearly define a proper workable demo of top-down cascading of company revenue OKR is getting span across all departments and levels that provide realistic visualization that OKR is getting achieved, the important part of this activity is to prepare and visualize how the company OKR target is getting cascaded top-down, prepare check-ins data, weekly/monthly/quarterly updates by employees, with approvals. Here clear visualization of how KRA-KPI can continued from past and OKR-Goals to be update everytime with cycles (every year). Add some data of Competency as well.
- DONE: Check if this screen development is pending. An 'Self Assessment' or 'Check-in' Input screens of updating the progress of employees, mid-managers and HOD to enter their daily, weekly, bi-weekly, monthly, quarterly, semi-annually, annually reviews. When the person logged-in, they should see a notification on their dashboard/home-page to quickly understand some action is pending at their end. If the person has missed to enter their previous cycle data, then system should first restrict them to update that first and then current cycle data can be entered in the system. Check if this is getting duplicated with 'check-in' feature or we can continue 'check-in' feature to provide updates against the targets instead of naming this 'Self Assessment'.
- DONE: FOLLOWUP PROMPT: Keep the name Check-in for the periodic progress updates (daily → quarterly). Reserve "Self-Assessment" strictly for the end-of-cycle formal rating screen (which is part of the review cycle phase). This matches industry norms (BambooHR, Lattice, Leapsome all use this split) and avoids confusion.
- Whether can it be possible that company OKR be reviewed quarterly or semi-annually or annually and other supporting things like employee or HOD reviews are done as per given cycle, the management (CEO/VP/Directors) can track / view the company vs others status but they can update their status in different frequency of cycle. Similarly HOD can update their status at different frequency of cycle than their subordinates who might update the status daily, weekly, monthly etc and HOD updating the status monthly or quarterly.
- Create another demo company with both perfect use cases of Bidirectional cascade.
- In 'Org settings' Do we need 'Cycle Defaults' or it will come in the 'Cycles' section/configuration?


### OKR, KR and KRA-KPI
- How the OKR's Key Results and KPI can work together? Is it possible can bo co-exists in the same cycle, if so that can we make this system in such a way that it can be fill and review and measures, which can result in a decision making at employee, department and organization level. Build this system so that it can combine the results of both OKR + KRA & KPI + Goals if all are enabled with measurable targets to form the final score, provide the calibration options just like score-split of Goals/KRA/KPI and Competency, do we also need further score-split between Goals/OKR/KRA-KPI?
- How can CEO/management can enter the actual results against the OKR defined at company level, and comparsion with subordinates given values for comparison, it could be possible that end actual results enter by the company at the end of each cycle review may be different than values enterred by subordinates, need to plot in a way that it can be visualize and captured. Then how cascade work here. Can we have multi-result kind of approach (think on that before going to implement) that employees, managers and department (HOD) values may provide positive targets achievement whereas the management (CEO or VP) will provide a real numbers?
- Need to prepare input of HOD (departmental OKR achievement) so that it should not be duplicated when the same person (manager) is giving the input at the time of review.
- How can in one employee or department profile of review, all these selected options like 'OKR objective', 'OKR Key Result', 'KRA', 'Goal', 'KPI', 'Compentancy', 'BSC Metric', 'Custom' can work together, think in-depth for a both INPUT and REVIEW page of employee or manager or department head that a form can have dedicated sections based on these 'Active Performance Types' selection, otherwise the form will be very confusing for the user, we are building the software for common man, so it should be very easy to follow and adopt in the organization, we can split the input in small steps that can persist across the session and continue. The end result is also important that how can we combine results of these all 'Active Performance Types' input to generate a final score or result, how can the system predict this?
- CEO,VP,Director,HOD page where they can enter the targets against the company OKR (enter by all CEO,VP,Director as per their profiles and domain applicability) and another page for departments HOD to provide their sub-targets against company OKR (this will be applicable if Cascading is enabled)
- Manager organization hierarchy wise goals cascading and target visualization. How the actual target and commitment or planned both along can be defined?
- Revision of targets during the year multiple times with revision history along with approvals
- After all these steps completed prepare multiple sample data structures (selection of data structure of case studies to view the software working), 1. An IT company having sales team given target based on their head-count salaries so that Sales head and sales managers target is inclusive of their subordinates salaries + self and invidual sales person target is their own salaries, similarly for operation department the OKR is the revenue of the organization increasing (MRR above threshold) and happy client ratings, development team OKR targets is again revenue stable and increasing, lesser software bugs, new features, HR team target is happy enviornment and good work culture. 2. Another company of a manufacturing where they produce product like Car Brakes or any components they have their hypothetical use cases spread across different departments.
- Avoid mistakes by the end-users, that in Key-Results (any measurable template) should allow only measurable selection, they cannot just select text based data input in the template of 'Active Performance Types' (correct if am I doing wrong here), so that wrong capturing of data can be avoided at year end consolidation time.
- Check who can prepare the data such that OKR can be defined by whome (CEO, VP or directors or it can also be defined by department HOD?) similarly employees can defined what (KPI/KR/Goal/etc), that level of built-in checks/validation should be configurable and preconfigured as per industry norms. Can these be configurable in the 'Org Settings'? Is it possible to have OKR without Key-results check this framework? Can department also defined OKR or they can just enter their Key-results (if so then configurable)? How KPI to key-results can be mapped when all employees entered their KPIs with very high values then how can it provide wrong results in key-results at department level and company level, such restrictions can be provide at each company OKR and department Key-results declarations with acceptable range, first need to check and prepare the mapping of KPI to Key-results conversion.
- Unplanned OKRs which are not cascaded at department or department Key-results/OKR visibility and validation during submissions. 
- When company OKR has been finalized (entered by CEO, VP and directors from their respective logins), and when department HOD enters their Key-results/KPI then they should see cascaded Company's OKR and based on them they need to enter the Key-results (check if the department head can also enter OKR within OKR), also at company OKR definition time, the CEO/VP or directors can tell the system which department head will need to enter their key-results in this OKR and must or not level configuration, so that department head should not missed to enter their key-results or KPI. Option for subordinates which receive this cascaded key-results
- Can KPI be directly enter against OKR or it can be only entered against Key-results, check industry norms and prepare a validation in the 'Org Settings' with default correct values as per industry norms. Can department head define their KPI along with key-results or they can just enter key-results against company OKRs? If KPI can be defined at department head level then whether it can be visible to subordinates of that same department or not (configurable at the time of preparing those KPIs). Similarly when L3 or L4 (subordinates of department heads) are defining their KPIs whether they can see their superior KPIs and Key-results data or not (this choice can be provided at superior their during input stage, check if my understanding is correct or not).
- Overplanning or overcommittment highlights or block option to be developed and configurable, the approval/reviewal can get this notified that it's overcommittment given by the employee. Similarly when employees are giving actual numbers, typo-mistakes can be captured (we can create validations configurable the desirable values with threshold/acceptable range in the configuration of cycles). Also when employees defining the Key-results against OKR or KPI against Key-results (validate are these interlinked) then how many line items can be defined, this can be allowed with configurable when company and department HOD both are defining their OKR / KR. To avoid wrong preparation of KPI or Key-results by the employees.
- Timebound objective feature, that should reflect to the all users and they can also provide the timeline of their planned KPIs/KR/Goals/Compentancy. This will also to be applicable at company's OKR definition.
- Later: Dependency of OKR/KR/KPI/Goals feature at someone else. The actionable can be executed independently or dependent others.

### User inputs (Employee KPI/Goals/Compentancy)

- Indication of input types like numbers, ratings, stars Measurement types with pictorial infotype for making it better user interface. Check if possible then only implement.

### Reviews and approvals

- When employees or department head is updating the reviews, they can see their cummulative/consolidated ratings (average) as well, so that they can track the progress i.e. April to May average visible when they are enterring the June month data (including June numbers).
- Approving authorities should see their subordinates performance are they inline with expectation or not, clear and easy indication for approving person to quickly understand and they can provide their own ratings and values (by default it should be same as per subordinates data). Assessment of those reflection in the top and HR management dashboard, along with consolidated and cummulative results of the entire year data.
- If the approving authority has any subordinates data pending for submission or approval is pending by mid-managers then can see that status in a list form that they can take action while they are inputting their own target status or approving their subordinates data.
- When approving authority is approving the submission of subordinates they can clearly view the data of their subordinates on the screen.


### Salary and increment/hide

- Industry wise salary comparison of the grade (need to check internet for actual average data) and what current we have in the system, if the employee is getting promoted whether it's beyond the industry same grade?. This data can be visible in the system or pull from the internet.
- Later we can define salary-hike scenarios or promotion of grade configuration.

### AI

- AI insights later based on the comments/text they have entered throughout the years and consideration of feedbacks data of the employees.

### Dashboard

- When an employee or user or HR login, the should immediately see dashboard that are they inline with expectation, the on-track, missed, delay, or not start activities, can be visible, for senior or HOD or director, which department is achieving the OKR and KRA and Goals and which is behind. Identification of underperformers and performers.
- Build interactive dashboard with drill-down analysis, comparison of KPI or Key results in which one is achiving the targets but OKR is not achiving how the management or company can view these findings.
- Company OKR line item wise analysis which is achieved and which are missed. Similarly HOD department wise comparison of achievement of companys OKR line item wise comparison at different department level of achievement to know which department has missed the company's OKR.
- Missing of timebound OKR/KR/KPI/Goals/etc insights who is missing (company, department, particular mid-manager or individual employees are lacking behind).

### Continue feedbacks

- Continue feedbacks and reflecting the feedbacks (positive, negative) to the employees (configurable), managers when they are reviewing and approving the subordinates reviews.

### Further refiment

- Check which features of 'Org Settings' which are missed in the implementation in this POC, list down those features so those can be planned. Also help me understand that 'Org settings' has 'Performance Bands' and 'Target Rules' are these required and where it will be used, explain and implement them. Also check for 'Cycle Defaults' settings of 'Org Settings' if these are not used then implement them for 'Review Cycles' implementation.
- Check 'Add Target' Popup of 'MyTargets' it's not complete for user experience and some default data.
- Post Cycle has initiated, the individuals can create KRA-KPI that should reflect instantly along with existing Review Cycle of OKR+Existing KRA-KPI and Goals.
- Do need to the configuration like BSC or 9-box or OKR/KR/Goal at the 'org settings' or it should be there at 'Cycles' setup/configuration.
- Prepare structural features of other options which are used in industries that we have not covered yet (other than OKR,KR,KPI,Goals), check industries like Pharma, Hospitals,Banks and suggest if they are following different approaches and methods, that we can provide and incorporate in this demo application.
- SMART Goals in Key-results guidelines.
- Development Plan (Next Development Goals + Actions)
- 


### Product developed features list

- List down the features which are covered in the project, and display them as features content (categorized) for management presentation of demo.
  


