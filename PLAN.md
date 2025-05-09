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

- [x] **Voice Recording & Text Conversion**

  - [x] Implement ElevenLabs Conversational AI integration
  - [x] Add visual feedback during voice conversations (waveform visualization)
  - [x] Handle microphone permissions and audio streaming
  - [x] Create automatic transcript generation from conversation

- [x] **Backend for Interview Flow**

  - [x] Create tRPC router in `/src/server/api/routers/interview.ts`
  - [x] Implement `submitAnswer` procedure with automatic progression
  - [x] Implement debugging and error handling for question lookup

- [x] **AI Interviewer Logic**
  - [x] Implement ElevenLabs agent integration with custom prompting
  - [x] Configure dynamic variables to pass question context to the agent
  - [x] Create logic for automatic progression after conversation ends
  - [x] Implement transcript storage for each step

## 5. Automated Analysis & Artifact Generation

- [x] **Analysis Trigger Endpoint**

  - [x] Create an endpoint to manually trigger analysis for a completed session
  - [x] Add this endpoint to the tRPC interview router

- [x] **Analysis Generation Logic**

  - [x] Create a service in root that is a separate express server separate from the nextjs server. It should use a simple connector to write SQL to the database, no need for prisma.
  - [x] Implement transcript aggregation logic to prepare for analysis
  - [x] Set up prompt templates for the analysis tasks (winner determination, sseverity scoring, etc.)
  - [x] Implement API calls to OpenAI for analysis generation

- [x] **Analysis Storage**
  - [x] Create functions to parse and validate the LLM's output
  - [x] Implement logic to store the analysis artifact in the database
  - [x] Add logic to update the session status after analysis is complete

## 6. Project Insights

- [x] **Dashboard Layout**

  - [x] Enhance the project detail page with interview session statistics
  - [x] Create summary cards showing key metrics (total interviews, completion rate, etc.)

- [x] **Interview Sessions Table**

  - [x] Create a component in `/src/app/_components/dashboard/SessionsTable.tsx`
  - [x] Implement sorting and filtering capabilities
  - [x] Add clickable rows to navigate to session details

- [x] **Session Detail View**

  - [x] Create `/src/app/projects/[id]/sessions/[sessionId]/page.tsx`
  - [x] Implement UI to display all step records for the session
  - [x] Create a component to replay/review the transcript

- [x] **Visualization Components**

  - [x] Create charts for severity scores using a charting library
  - [x] Implement visualization for knowledge gaps frequency
  - [x] Add summary statistics visualization

- [x] **Backend for Dashboard Data**
  - [x] Extend the project tRPC router with dashboard data procedures
  - [x] Implement aggregation logic for project-level statistics
  - [x] Create procedures to fetch detailed session data

## 7. Data Export

- [x] **Export UI**

  - [x] Add "Export Project Data" button to the project dashboard
  - [x] Create a loading state for export processing

- [x] **CSV Generation Logic**

  - [x] Create a service in `/src/server/services/export.ts`
  - [x] Implement logic to fetch all step records and analysis artifacts for a project
  - [x] Create functions to transform database records into CSV format
  - [x] Implement response streaming for large exports

- [x] **Backend for Export**
  - [x] Create an export procedure in the project tRPC router
  - [x] Add proper error handling for export failures
  - [x] Implement download URL generation for the exported file

---

## Completion Checklist

- [x] Foundation & Core Models complete
- [x] Project Management & CSV Upload complete
- [x] Interview Link Generation complete
- [x] Expert Interview Experience complete
- [x] Automated Analysis & Artifact Generation complete
- [x] Project Dashboard & Insights complete
- [x] Data Export complete

This plan aligns with the T3 Stack architecture described in the README.md, utilizing Next.js, TypeScript, Tailwind CSS, tRPC, and Prisma.
