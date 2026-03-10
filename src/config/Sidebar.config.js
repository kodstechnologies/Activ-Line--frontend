import {
  LayoutDashboard,
  Users,
  MapPin,
  CreditCard,
  Megaphone,
  MessageSquare,
  Settings,
  Building,
  ChartNoAxesColumnIncreasing,
  UserCog,
  FileClock,
  LayoutGrid,
  User
} from "lucide-react";

export const adminSidebarItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    key: "Dashboard",
    paths: ["/dashboard"],
  },
  {
    icon: MessageSquare,
    label: "Tickets",
    key: "Tickets",
    paths: ["/tickets"],
  },
  {
    icon: Users,
    label: "Customers",
    key: "Customers",
    paths: ["/customers"],
  },
  // {
  //   icon: MapPin,
  //   label: "Field Staff",
  //   key: "Field Staff",
  //   paths: ["/field-staff"],
  // },
  // {
  //   icon: Building,
  //   label: "Franchise Management",
  //   key: "Franchise",
  //   paths: ["/franchise"],
  // },
  {
    icon: CreditCard,
    label: "Payments",
    key: "Payments",
    paths: ["/payments"],
  },
  // {
  //   icon: Megaphone,
  //   label: "Offers & Ads",
  //   key: "Offers & Ads",
  //   paths: ["/offers"],
  // },
  {
    icon: LayoutGrid,
    label: "Plans",
    key: "Plans",
    paths: ["/plans"],
  },
  {
    icon: UserCog,
    label: "Staff",
    key: "Staff",
    paths: ["/staff"],
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    label: "Reports",
    key: "Reports",
    paths: ["/reports"],
  },
  {
    icon: FileClock,
    label: "Logs",
    key: "Logs",
    paths: ["/logs"],
  },
  {
    icon: Settings,
    label: "Settings",
    key: "Settings",
    paths: ["/settings"],
  },
];

export const franchiseSidebarItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    key: "Dashboard",
    paths: ["/franchise-dashboard"],
  },
  {
    icon: Users,
    label: "Customers",
    key: "Customers",
    paths: ["/my-customers"],
  },
  {
    icon: MapPin,
    label: "Local Staff",
    key: "Local Staff",
    paths: ["/local-staff"],
  },
  {
    icon: CreditCard,
    label: "Collections",
    key: "Collections",
    paths: ["/collections"],
  },
  {
    icon: LayoutGrid,
    label: "Plans",
    key: "Plans",
    paths: ["/franchise-plans"],
  },
  {
    icon: MessageSquare,
    label: "Tickets",
    key: "Tickets",
    paths: ["/zone-tickets"],
  },
  {
    icon: User,
    label: "Profile",
    key: "Profile",
    paths: ["/profile"],
  },
];

export const staffSidebarItems = [
  {
    icon: LayoutDashboard,
    label: "Dashboard",
    key: "Dashboard",
    paths: ["/dashboard"],
  },
  {
    icon: MessageSquare,
    label: "Assigned Tickets",
    key: "Assigned Tickets",
    paths: ["/assigned-tickets"],
  },
  {
    icon: Users,
    label: "Customers",
    key: "Customers",
    paths: ["/customers"],
  },
  {
    icon: ChartNoAxesColumnIncreasing,
    label: "Reports",
    key: "Reports",
    paths: ["/reports"],
  },
  {
    icon: FileClock,
    label: "Logs",
    key: "Logs",
    paths: ["/logs"],
  },
  {
    icon: Settings,
    label: "Settings",
    key: "Settings",
    paths: ["/settings"],
  },
]
