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
  - can you also update other all fields of this OrgSettings page with in-depth explanation on custom popup model , I need to understand this product in depth for my own understanding of the PMS model, you can educate me as well by just clicking on the popup model to see and understand their internal working and where it will reflect later with importance, give in-depth explanation with real life examples and industry wise best practices.
  - Now fine-tune this 'org setting' page so that it should allow selection which are mutually exclusive like if the 'OKR Objective' is selected then why do HR need to select 'OKR key result' - I presume these two are used injunction together (correct my understanding) and similarly fix the interconnected fields which the user should not missed to select or it should be auto-select or disabled if that thing is not applicable in the selection of 'Active Performance Types' like if the HR has selected only 'Compentency' whether they can do anything with tabs like 'Weightage' or 'Rating Scale', similarly check for correct configuration the user can do without doing or leaving any mistake.
  - Proceed to prepare  @specifications.md for '6. INDUSTRY PRESETS'
  - 