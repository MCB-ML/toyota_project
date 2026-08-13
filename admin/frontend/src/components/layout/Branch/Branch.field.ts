import { TABS_BRANCH } from "../../../types/branch.types";
import type { DialogFieldConfig } from "../../../types/dialog.types";

export const BranchFields = (t: any): DialogFieldConfig[] => [
  {
    name: "branchName",
    label: t("Branch.branchName"),
    type: "text",
    placeholder: t("Branch.placeholders.enterBranchName"),
    gridSpan: 2,
    tabId: TABS_BRANCH.GENERAL,
  },
  {
    name: "branchType",
    label: t("Branch.type"),
    type: "select",
    placeholder: t("Branch.placeholders.selectType"),
    options: [
      { value: "Main", label: t("Branch.main") },
      { value: "Regional", label: t("Branch.regional") },
      { value: "Branch", label: t("Branch.branch") },
    ],
    tabId: TABS_BRANCH.GENERAL,
  },
  {
    name: "branchLocation",
    label: t("Branch.location"),
    type: "text",
    placeholder: t("Branch.placeholders.enterLocation"),
    tabId: TABS_BRANCH.GENERAL,
  },
  {
    name: "allowUserAccess",
    label: t("Branch.allowGuestAccess"),
    type: "check",
    gridSpan: 2,
    tabId: TABS_BRANCH.GENERAL,
  },
  {
    name: "branchLogo",
    label: t("Branch.logo"),
    type: "image",
    gridSpan: 2,
    tabId: TABS_BRANCH.GENERAL,
  },
  {
    name: "bgImg",
    label: t("Branch Background Image"),
    type: "image",
    gridSpan: 2,
    tabId: TABS_BRANCH.GENERAL,
  },
  {
    name: "dataAgentBotName",
    label: t("Branch.botName"),
    type: "text",
    gridSpan: 2,
    placeholder: t("Branch.placeholders.enterBotName"),
    tabId: TABS_BRANCH.GENERAL,
  },
  {
    name: "dataAgentWelcomeprompt",
    label: t("Branch.welcomeComment"),
    type: "text",
    gridSpan: 2,
    placeholder: t("Branch.placeholders.enterWelcomeComment"),
    tabId: TABS_BRANCH.GENERAL,
  },
  //...AGENT_FIELDS("sql_", TABS_BRANCH.AGENT_SQL),
  //...AGENT_FIELDS("sql_", TABS_BRANCH.AI_AGENT),
  //...AGENT_FIELDS("rag_", TABS_BRANCH.AGENT_RAG),
];

//const AGENT_FIELDS = (key: string, tab: string): DialogFieldConfig[] => {
//  const isRag = key === "rag_";

//  return [
//    {
//      name: `${key}endpoint`,
//      label: "Endpoint",
//      type: "text",
//      placeholder: "Enter Endpoint",
//      gridSpan: 2,
//      tabId: tab,
//    },
//    {
//      name: `${key}db`,
//      label: `${isRag ? "Index" : "Database"} Name`,
//      type: "text",
//      placeholder: `Enter ${isRag ? "Index" : "Database"} Name`,
//      gridSpan: 2,
//      tabId: tab,
//    },
//    {
//      name: `${key}user`,
//      type: "text",
//      label: isRag ? "  User / Key " : "  User",
//      placeholder: `Enter ${isRag ? "User / Key" : "User"} `,
//      gridSpan: 2,
//      tabId: tab,
//    },
//    {
//      name: `${key}password`,
//      label: "Password",
//      type: "password",
//      placeholder: "Enter Password",
//      gridSpan: 2,
//      tabId: tab,
//    },
//  ];
//};
