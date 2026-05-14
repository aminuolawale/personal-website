// Centralised builders for site_config table keys.
// Import these everywhere instead of constructing the strings inline.
export const tabOrder = (section: string) => `tab-order-${section}`;
export const tabLabels = (section: string) => `tab-labels-${section}`;
export const tabVisibility = (section: string) => `tab-visibility-${section}`;
export const tabConfigKeys = (section: string) => [
  tabOrder(section),
  tabLabels(section),
  tabVisibility(section),
];
