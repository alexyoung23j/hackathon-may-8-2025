# Expert Interview Evaluator Implementation Plan

## Project Overview

The Expert Interview Evaluator is a browser-based platform that transforms raw evaluation data into expert-curated insights for model teams. The system allows users to upload a CSV file containing questions and candidate answers, which are then converted into shareable interview links. Subject-matter experts interact with these links to evaluate and compare model responses through a natural conversation with an AI interviewer. The platform records their preferences and reasoning, then automatically analyzes the conversations to produce structured artifacts including scores, knowledge gaps, and prompt improvement suggestions. These insights are made available through an interactive dashboard and can be exported as CSV files.

Key features include:

- CSV upload with question-answer pairs for evaluation
- Interview link generation and management
- Interactive expert interview experience with AI-driven questioning
- Automated analysis of expert feedback
- Dashboard for visualizing interview results and insights
- Data export functionality

This document outlines the step-by-step implementation plan for the Expert Interview Evaluator. Each step is broken down into specific actions with checkboxes to track progress.

## 1. Foundation & Core Models

- [x] **Setup Prisma Schema**

  - [x] Define `Project` model with fields for name, createdAt, and status
  - [x] Define `InterviewLink` model with fields for name, expiry, rowQuota, projectId, and status
  - [x] Define `InterviewSession` model with fields for interviewLinkId, startedAt, completedAt, and status
  - [x] Define `StepRecord` model with fields for projectId, sessionId, questionId, questionText, answerA, answerB, metadata, preferredAnswer, and transcript
  - [x] Define `AnalysisArtifact` model with fields for sessionId, winnerFlag, severityScore, rationaleDigest, knowledgeGaps, and promptSuggestions
  - [x] Setup proper relations between models
  - [x] Run `pnpm db:push` to push schema to the database
  - [x] Run `pnpm db:generate` to generate Prisma client

- [x] **Install and Configure shadcn-ui**
  - [x] Run `pnpm add @shadcn/ui` to install shadcn-ui
  - [x] Configure Tailwind CSS for shadcn-ui components
  - [x] Setup shadcn theme and component registration

## 2. Project Management & CSV Upload

- [x] **Project Listing UI**

  - [x] Create a `/src/app/page.tsx` homepage listing all projects
  - [x] Create a Project card component in `/src/app/_components/projects/ProjectCard.tsx`
  - [x] Implement UI for "Create New Project" button

- [x] **Create Project Modal/Form**

  - [x] Create a form component in `/src/app/_components/projects/NewProjectForm.tsx`
  - [x] Add form validation using Zod schema
  - [x] Style with shadcn-ui components (Dialog, Form, Button)

- [x] **Project Detail Page**

  - [x] Create `/src/app/projects/[id]/page.tsx` for individual project view
  - [x] Display project details (name, creation date, status)

- [x] **CSV Upload Functionality**

  - [x] Create a CSV upload component in `/src/app/_components/projects/CsvUploader.tsx`
  - [x] Implement drag-and-drop or file selection UI using shadcn-ui
  - [x] Add visual feedback for upload process (progress, success, error states)

- [x] **Backend for Project & CSV Management**

  - [x] Create tRPC router in `/src/server/api/routers/project.ts`
  - [x] Implement `createProject` procedure
  - [x] Implement `getProjects` procedure
  - [x] Implement `getProjectById` procedure

- [x] **CSV Processing Logic**
  - [x] Create tRPC procedure in the project router for CSV upload
  - [x] Implement CSV parsing and validation (check for required columns)
  - [x] Create bulk insert logic to store CSV rows as `QuestionPair` entities
  - [x] Implement error handling for malformed CSV files

## 3. Interview Link Generation

- [x] **Interview Link UI**

  - [x] Add "Generate Interview Link" section to the project detail page
  - [x] Create a form component in `/src/app/_components/interviews/NewLinkForm.tsx`
  - [x] Implement fields for link name, expiry date, and row quota
  - [x] Add form validation using Zod

- [x] **Generated Links Display**

  - [x] Create a component to list all generated links for a project in `/src/app/_components/interviews/LinksList.tsx`
  - [x] Add functionality to copy links to clipboard
  - [x] Display link status (unused, in-progress, completed)

- [x] **Backend for Link Management**
  - [x] Create tRPC router in `/src/server/api/routers/interviewLink.ts`
  - [x] Implement `createInterviewLink` procedure with unique URL generation
  - [x] Implement `getInterviewLinksByProjectId` procedure
  - [x] Implement `getInterviewLinkByUrl` procedure for link validation

## 4. Expert Interview Experience

- [x] **Interview Session UI**

  - [x] Create `/src/app/interview/[linkId]/page.tsx` for the interview experience
  - [x] Implement session initialization logic (checking link validity, creating session)
  - [x] Design the overall layout with question display area and chat interface

- [x] **Question & Answer Display**

  - [x] Create a component in `/src/app/_components/interview/QuestionDisplay.tsx` to show current question and answers side-by-side
  - [x] Implement A/B selection buttons with visual feedback for selection
  - [x] Add progress indicator showing current position in interview

- [x] **Chat Interface for AI Interviewer**

  - [x] Create a chat UI component in `/src/app/_components/interview/ChatInterface.tsx`
  - [x] Implement message bubbles to display the conversation flow
  - [x] Add text input and recording button for the expert's responses
  - [x] Style with shadcn-ui components (Chat, Button, Input)

- [ ] **Voice Recording & Text Conversion**

  - [ ] Implement browser audio recording API integration
  - [ ] Add visual feedback during recording
  - [ ] Create speech-to-text conversion logic (Deepgram API, some research on internet is needed)

- [ ] **Backend for Interview Flow**

  - [x] Create tRPC router in `/src/server/api/routers/interview.ts`
  - [ ] Implement `startSession` procedure
  - [x] Implement `submitAnswer` procedure
  - [x] Implement `sendMessage` procedure for conversation

- [ ] **AI Interviewer Logic**
  - [ ] Set up prompt templates for the AI interviewer
  - [ ] Implement API calls to OpenAI (or other LLM provider)
  - [ ] Create logic to determine when to move to the next question
  - [x] Implement transcript storage for each step

## 5. Automated Analysis & Artifact Generation

- [ ] **Analysis Trigger Endpoint**

  - [ ] Create an endpoint to manually trigger analysis for a completed session
  - [ ] Add this endpoint to the tRPC interview router

- [ ] **Analysis Generation Logic**

  - [ ] Create a service in `/src/server/services/analysis.ts`
  - [ ] Implement transcript aggregation logic to prepare for analysis
  - [ ] Set up prompt templates for the analysis tasks (winner determination, severity scoring, etc.)
  - [ ] Implement API calls to OpenAI for analysis generation

- [ ] **Analysis Storage**
  - [ ] Create functions to parse and validate the LLM's output
  - [ ] Implement logic to store the analysis artifact in the database
  - [ ] Add logic to update the session status after analysis is complete

## 6. Project Dashboard & Insights

- [ ] **Dashboard Layout**

  - [ ] Enhance the project detail page with interview session statistics
  - [ ] Create summary cards showing key metrics (total interviews, completion rate, etc.)

- [ ] **Interview Sessions Table**

  - [ ] Create a component in `/src/app/_components/dashboard/SessionsTable.tsx`
  - [ ] Implement sorting and filtering capabilities
  - [ ] Add clickable rows to navigate to session details

- [ ] **Session Detail View**

  - [ ] Create `/src/app/projects/[id]/sessions/[sessionId]/page.tsx`
  - [ ] Implement UI to display all step records for the session
  - [ ] Create a component to replay/review the transcript

- [ ] **Visualization Components**

  - [ ] Create charts for severity scores using a charting library
  - [ ] Implement visualization for knowledge gaps frequency
  - [ ] Add summary statistics visualization

- [ ] **Backend for Dashboard Data**
  - [ ] Extend the project tRPC router with dashboard data procedures
  - [ ] Implement aggregation logic for project-level statistics
  - [ ] Create procedures to fetch detailed session data

## 7. Data Export

- [ ] **Export UI**

  - [ ] Add "Export Project Data" button to the project dashboard
  - [ ] Create a loading state for export processing

- [ ] **CSV Generation Logic**

  - [ ] Create a service in `/src/server/services/export.ts`
  - [ ] Implement logic to fetch all step records and analysis artifacts for a project
  - [ ] Create functions to transform database records into CSV format
  - [ ] Implement response streaming for large exports

- [ ] **Backend for Export**
  - [ ] Create an export procedure in the project tRPC router
  - [ ] Add proper error handling for export failures
  - [ ] Implement download URL generation for the exported file

---

## Completion Checklist

- [x] Foundation & Core Models complete
- [x] Project Management & CSV Upload complete
- [x] Interview Link Generation complete
- [ ] Expert Interview Experience complete
- [ ] Automated Analysis & Artifact Generation complete
- [ ] Project Dashboard & Insights complete
- [ ] Data Export complete

This plan aligns with the T3 Stack architecture described in the README.md, utilizing Next.js, TypeScript, Tailwind CSS, tRPC, and Prisma.
