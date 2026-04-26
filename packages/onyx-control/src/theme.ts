const palette = {
  indigo: { 950:'#0a0a1a', 900:'#0d0d1f', 850:'#121228', 800:'#1a1a35', 750:'#22224a', 700:'#2a2a5a', 600:'#3a3a7a', 500:'#5555aa', 400:'#7777cc', 300:'#9999dd', 200:'#bbbbee', 100:'#ddddff', 50:'#eeeeff' },
  cyan:   { 600:'#0e7490', 500:'#06b6d4', 400:'#22d3ee', 300:'#67e8f9' },
  green:  { 500:'#16a34a', 400:'#4ade80' },
  red:    { 500:'#dc2626', 400:'#f87171' },
  yellow: { 500:'#ca8a04', 400:'#facc15' },
};

export const t = {
  bg:     { base: palette.indigo[900], surface: palette.indigo[800], elevated: palette.indigo[750], hover: palette.indigo[700], selected: palette.indigo[600], overlay: palette.indigo[850] },
  fg:     { primary: palette.indigo[100], secondary: palette.indigo[400], muted: palette.indigo[500], heading: palette.indigo[50] },
  border: { default: palette.indigo[700], subtle: palette.indigo[800], focus: palette.cyan[500] },
  accent: palette.cyan[400],
  status: { success: palette.green[400], error: palette.red[400], warning: palette.yellow[400], info: palette.cyan[400] },
  selection: { bg: palette.indigo[600], fg: palette.indigo[50], indicator: palette.cyan[400] },
  log:    { error: palette.red[400], warn: palette.yellow[400], info: palette.indigo[200], debug: palette.indigo[500] },
  statusColor: (status: string): string => {
    switch(status) {
      case 'deployed': case 'running': case 'active': return palette.green[400];
      case 'failed': case 'error': return palette.red[400];
      case 'initialized': case 'pending': return palette.yellow[400];
      default: return palette.cyan[400];
    }
  },
} as const;

export function statusColor(status: string): string {
  switch(status) {
    case 'deployed': case 'running': case 'active': return palette.green[400];
    case 'failed': case 'error': return palette.red[400];
    case 'initialized': case 'pending': return palette.yellow[400];
    default: return palette.cyan[400];
  }
}
export function logLevelColor(level: string): string {
  switch(level) { case 'error': return palette.red[400]; case 'warn': return palette.yellow[400]; case 'debug': return palette.indigo[500]; default: return palette.indigo[200]; }
}