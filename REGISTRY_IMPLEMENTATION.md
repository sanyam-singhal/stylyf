# Registry Implementation Checklist

Stylyf is being implemented cluster by cluster. Each cluster should land as a complete sweep: component code, registry preview wiring, source display, verification, redeploy, commit.

## Tier 1

- [x] Actions & Navigation
  Button, IconButton, LinkButton, Toggle, ToggleGroup, Breadcrumb, Pagination
- [x] Form Inputs & Selection
  TextField, TextArea, NumberField, OTPField, Checkbox, RadioGroup, Switch, Select, Combobox, Slider, Calendar, DatePicker
- [ ] Disclosure & Overlay
  CommandMenu, Tabs, Accordion, Collapsible, Dialog, AlertDialog, Drawer, Popover, Tooltip, DropdownMenu, ContextMenu, Menubar
- [ ] Feedback & Display
  Progress, Badge, Avatar, Toast, Skeleton, Separator
- [ ] Data & Structure
  Table

## Tier 2

- [ ] Form Systems
  FieldRow, FieldsetCard, FormSection, SearchField, FilterToolbar, SortMenu, InlineEditableField, SettingsRow, SettingsPanel, FileUploader, MediaUploader, AuthCardShell
- [ ] Information & States
  PageHeader, SectionHeader, StatCard, StatGrid, EmptyState, ErrorState, LoadingState
- [ ] Data Views
  DataList, DataTableShell, ColumnVisibilityMenu, BulkActionBar, DetailPanel, ActivityFeed, Timeline, NotificationList, CommentThread
- [ ] Navigation & Workflow
  Stepper, WizardShell, SidebarNav, TopNavBar, AppHeader
- [ ] Commercial & Content
  PricingCard, FeatureCard, TestimonialCard, FAQList

## Tier 3

- [ ] Authentication
  LoginBasic, LoginSplit, LoginMagicLink, SignupBasic, SignupInvite, SignupWorkspace, ForgotPassword, ResetPassword, VerifyEmail, OTPVerify, TwoFactorSetup, TwoFactorChallenge
- [ ] App Shells & Dashboards
  DashboardSidebarSimple, DashboardSidebarCollapsible, DashboardSidebarWorkspace, DashboardTopbarOnly, AnalyticsOverview, RevenueDashboard, ProjectsDashboard, CRMWorkspace, SupportInbox, MembersDirectory
- [ ] Settings & Admin
  BillingSettings, ProfileSettings, SecuritySettings, TeamSettings, NotificationSettings, APIKeysPage, AuditLogPage, UsageMeterPanel, PlanUpgradePanel, InviteMembersDialogBlock
- [ ] Workflows & Onboarding
  CreateProjectFlow, ImportDataWizard, OnboardingChecklist, EmptyWorkspace, SearchResultsPage, ActivityInboxPage
- [ ] Marketing Navigation & Hero
  NavbarSimple, NavbarProductMega, NavbarDocs, HeroSaaS, HeroDocs, HeroWaitlist, LogoCloud, FeatureGridBento, FeatureComparison, PricingSection, FAQSection, TestimonialsSection
- [ ] Footer & Conversion
  CTASection, FooterSimple, FooterProduct, FooterDocs, NewsletterSection, ContactSalesSection
- [ ] Docs & Editorial
  BlogIndexHeader, DocsSidebarLayout, DocsArticleHeader, DocsPaginationFooter, ChangelogTimelinePage
- [ ] Trust & Company
  CareersListing, StatusPageSummary
