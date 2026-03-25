import type { ComponentType } from 'react';
import {
  HomeIcon,
  LocationIcon,
  SkillsIcon,
  CalendarIcon,
  MyShiftsIcon,
  RequestIcon,
  DropIcon,
  SwapIcon,
  ShiftsIcon,
  OnDutyIcon,
  FairnessIcon,
  ApprovalsIcon,
  OvertimeIcon,
  AuditIcon,
  PeopleIcon,
} from '@/src/components/icons/NavIcons';

export type NavItem = {
  href: string;
  label: string;
  Icon: ComponentType<{ className?: string }>;
  /** Exact path match only (default true). Set false for nested routes like /shifts/:id */
  end?: boolean;
};

export type NavSection = {
  heading: string;
  items: NavItem[];
};

export const EMPLOYEE_NAV_SECTIONS: NavSection[] = [
  {
    heading: 'Workspace',
    items: [{ href: '/', label: 'Home', Icon: HomeIcon, end: true }],
  },
  {
    heading: 'Directory',
    items: [
      { href: '/locations', label: 'Locations', Icon: LocationIcon },
      { href: '/skills', label: 'Skills', Icon: SkillsIcon },
    ],
  },
  {
    heading: 'Schedule',
    items: [
      { href: '/calendar', label: 'Calendar', Icon: CalendarIcon },
      { href: '/my-shifts', label: 'My shifts', Icon: MyShiftsIcon },
    ],
  },
  {
    heading: 'Requests',
    items: [
      { href: '/requests', label: 'Requests', Icon: RequestIcon },
      { href: '/drops', label: 'Available drops', Icon: DropIcon },
      { href: '/swaps', label: 'Available swaps', Icon: SwapIcon },
    ],
  },
];

export const MANAGER_NAV_SECTION: NavSection = {
  heading: 'Management',
  items: [
    { href: '/people', label: 'People', Icon: PeopleIcon },
    { href: '/shifts', label: 'Shifts', Icon: ShiftsIcon, end: false },
    { href: '/on-duty', label: 'On-duty', Icon: OnDutyIcon },
    { href: '/fairness', label: 'Fairness', Icon: FairnessIcon },
    { href: '/approvals', label: 'Approvals', Icon: ApprovalsIcon },
    { href: '/overtime', label: 'Overtime', Icon: OvertimeIcon },
    { href: '/audit', label: 'Audit', Icon: AuditIcon },
  ],
};
