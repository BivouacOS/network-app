import type { Node } from '@xyflow/react'

export type ContactMethod = 'linkedin' | 'email' | 'phone' | 'other'
export type JobType = 'recommendation' | 'application' | 'interview'

export type FollowUpMode = 'auto' | 'custom'

export interface PersonData {
  nodeType: 'person'
  name: string
  company: string
  contactMethod: ContactMethod
  contactValue: string
  connectedDate: string
  lastContact: string
  nextFollowUp: string
  reminderNote: string
  location: string
  followUpMode: FollowUpMode
  customIntervalDays: number
}

export interface JobData {
  nodeType: 'job'
  title: string
  company: string
  jobType: JobType
  date: string
  notes: string
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type PersonNode = Node<any, 'person'>
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JobNode = Node<any, 'job'>
export type AppNode = PersonNode | JobNode

export type FollowUpStatus = 'overdue' | 'soon' | 'ok' | 'none'
