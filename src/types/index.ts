/**
 * Shared shapes for the Avior frontend.
 *
 * These were derived from live responses, not from the code that consumes them:
 *   GET /api/clients                     -> Client[]        (the Mongo registry, behind Express)
 *   GET <address>/                       -> DaemonStatus    (the daemon's own status object)
 *   GET <address>/config/                -> Config
 *   GET <address>/clients/               -> DaemonClient[]  (the daemon's client table)
 *   GET <address>/jobs/                  -> Job[]
 *   GET <address>/fields/<FieldType>/    -> Field[]
 *
 * The daemons serve every endpoint as text/plain and have no schema. Anything
 * marked optional here is optional because a live response actually omitted it.
 */

/* ------------------------------------------------------------------ registry */

/**
 * A client as stored in the Mongo registry that Express fronts at /api/clients.
 * `Addresses` are candidate base URLs; exactly one of them (at most) is live at
 * any given time, which is what useClientResolution() races to find out.
 */
export interface Client {
  _id: string
  Name: string
  Addresses: string[]
  __v?: number
  /** Set by settings.vue on its local copies to drive the per-row delete spinner. */
  removeLoad?: boolean
  /**
   * config.vue writes the resolved live address back onto the selected client.
   * It is not part of the Mongo document.
   */
  Address?: string
}

/** A Client plus the outcome of racing its Addresses against GET <address>/alive. */
export interface ResolvedClient {
  HostName: string
  Reachable: boolean
  /** When Reachable is false this is Addresses[0], i.e. NOT a real resolve. */
  Address: string
}

/** The value a single winning /alive probe settles with. */
export interface AddressResolution {
  address: string
  response: unknown
}

/* -------------------------------------------------------------- daemon status */

export interface EncoderStatus {
  Active: boolean
  /** RFC3339; "0001-01-01T00:00:00Z" when idle. */
  Duration: string
  Frame: number
  Fps: number
  Q: number
  Size: string
  /** RFC3339; "0001-01-01T00:00:00Z" when idle. */
  Position: string
  Bitrate: string
  Dup: number
  Drop: number
  Speed: number
  Slice: number
  OfSlices: number
  /** Nanoseconds. */
  Remaining: number
  Progress: number
  ReplacementReason: string
  OutPath: string
}

export interface FileWalkerStatus {
  Active: boolean
  Directory: string
  Position: number
  LibSize: number
}

export interface MoverStatus {
  Active: boolean
  File: string
  Progress: number
  Position: string
  FileSize: string
}

/** GET <address>/ -- what the daemon reports about itself, also pushed over /ws/status. */
export interface DaemonStatus {
  InFile: string
  Encoder: EncoderStatus
  FileWalker: FileWalkerStatus
  Mover: MoverStatus
  Paused: boolean
  PauseReason: string
  ShutdownPending: boolean
  HostName: string
  Sleeping: boolean
}

/**
 * A DaemonStatus decorated by index.vue with the address it was reached on, then
 * handed to <Client> as `clientInit`.
 *
 * NOTE: an OFFLINE client is pushed into the same list as a bare
 * `{ HostName, Ip, Status: 'offline' }` -- it carries no Encoder/FileWalker/Mover
 * at all. That unsoundness is pre-existing and load-bearing: Client.vue reads
 * `client.Encoder.*` freely, and only avoids throwing because every such read sits
 * behind `isLoading`/`getActiveProcess()`, both of which short-circuit on `Status`.
 * Typing the process objects as optional would force null checks into ~30 call
 * sites and change nothing at runtime, so the offline literal is cast instead and
 * the unsoundness is quarantined to that one line in index.vue.
 */
export interface ClientInfo extends DaemonStatus {
  /** Base URL the client resolved to, e.g. "http://192.168.178.61:10000". */
  Ip: string
  /** Present ONLY when the client is offline. Its mere existence means offline. */
  Status?: string
  Refreshing?: boolean
  /**
   * GET <address>/encoder/ -- the encoder's line output, fed straight to a
   * v-virtual-scroll as `:items`. The daemon replies with JSON `null` when nothing is
   * encoding (which destr hands back as null, and the template's `v-if` filters out).
   */
  EncoderLineOut?: string[] | null
}

/* ------------------------------------------------------------- daemon clients */

/** GET <address>/clients/ -- the daemon's own client table (distinct from the Mongo registry). */
export interface DaemonClient {
  ID: string
  Name: string
  /** "HH:MM", and sometimes "H:MM". */
  AvailabilityStart: string
  AvailabilityEnd: string
  MaximumJobs: number
  Priority: number
  Online: boolean
  IgnoreOnline: boolean

  /** Attached client-side by jobs.vue. */
  Jobs?: Job[]
  SelectAll?: boolean
  /** Attached client-side by globalconfig.vue. */
  Selected?: boolean
  active?: boolean
}

/* ----------------------------------------------------------------------- jobs */

export interface JobAssignedClient {
  Ref: string
  ID: string
  DB: string | null
}

/**
 * GET <address>/jobs/
 *
 * `CustomParameters` is string[] on the wire but the UI flattens it to a
 * newline-joined string for the textarea and splits it back before sending, so
 * both forms are live in the same objects.
 */
export interface Job {
  ID: string
  Path: string
  Name: string
  Subtitle: string
  CustomParameters: string | string[] | null
  AssignedClient: JobAssignedClient

  /** Per-row dialog/spinner flags, stamped onto the job objects in place. */
  EditJobDialog?: boolean
  EditingJob?: boolean
  DeleteJobDialog?: boolean
  DeletingJob?: boolean
  /** jobs.vue's getJobsForClient sets `DeleteJob` -- note: NOT `DeletingJob`. Kept as-is. */
  DeleteJob?: boolean
}

/* --------------------------------------------------------------------- config */

export interface RedisConfig {
  Enabled: boolean
  Host: string
  Password: string
  DB: number | string
  /** Nanoseconds. The UI divides by 60e9 to show minutes. */
  CacheTtl: number
  ChannelPrefix: string
}

export interface AudioFormats {
  StereoTags: string[]
  MultiTags: string[]
}

export interface EncoderConfigEntry {
  OutDirectory: string
  PreArguments: string[]
  PostArguments: string[]
  Stash: string[]
  StereoArguments: string[]
  MultiChArguments: string[]
}

/** Every module has Enabled + Priority; Settings is module-specific and null for LegacyModule. */
export interface ModuleConfig<S = unknown> {
  Enabled: boolean
  Priority: number
  Settings: S
}

export interface AgeSettings { MaxAge: number }
export interface AudioSettings { Accuracy: string }
export interface DuplicateLengthCheckSettings { Threshold: number }
export interface ErrorReplaceSettings { Threshold: number }
export interface ErrorSkipSettings { Threshold: number }
export interface LengthSettings { Threshold: number }
export interface LogMatchSettings { Mode: string }
export interface MaxSizeSettings { MaxSize: number }
export interface ResolutionSettings { MinResolution: number }
export interface SizeApproxSettings {
  Difference: number
  Fraction: number
  SampleCount: number
}

export interface Modules {
  AgeModule: ModuleConfig<AgeSettings>
  AudioModule: ModuleConfig<AudioSettings>
  DuplicateLengthCheckModule: ModuleConfig<DuplicateLengthCheckSettings>
  ErrorReplaceModule: ModuleConfig<ErrorReplaceSettings>
  ErrorSkipModule: ModuleConfig<ErrorSkipSettings>
  LegacyModule: ModuleConfig<null>
  LengthModule: ModuleConfig<LengthSettings>
  LogMatchModule: ModuleConfig<LogMatchSettings>
  MaxSizeModule: ModuleConfig<MaxSizeSettings>
  ResolutionModule: ModuleConfig<ResolutionSettings>
  SizeApproxModule: ModuleConfig<SizeApproxSettings>
}

/** Name of a module, used to index Config.Modules from the settings components' emits. */
export type ModuleName = keyof Modules

/** GET <address>/config/ */
export interface Config {
  Instance: number
  DatabaseURL: string
  Redis: RedisConfig
  Ext: string
  PauseOnEncodeError: boolean
  AudioFormats: AudioFormats
  /** Tag -> "WxH", e.g. { fhd: "1920x1080" }. Freely extended by the Resolutions tab. */
  Resolutions: Record<string, string>
  ObsoletePath: string
  MediaPaths: string[]
  EstimatedLibSize: number
  Modules: Modules
  /** Tag -> encoder settings, e.g. { fhd: {...} }. */
  EncoderConfig: Record<string, EncoderConfigEntry>
  EncoderPriority: string
}

/* --------------------------------------------------------------------- fields */

/** The four field lists globalconfig.vue manages. */
export type FieldType = 'name_exclude' | 'sub_exclude' | 'log_exclude' | 'log_include'

/** GET <address>/fields/<FieldType>/ */
export interface Field {
  ID: string
  Value: string
}

/** What TextDataTable emits up to globalconfig.vue. */
export type FieldMutation =
  | { mode: 'create'; obj: Field }
  | { mode: 'update'; obj: Field }
  | { mode: 'delete'; obj: Field }
  | { mode: 'deleteMany'; ary: Field[] }

/* ------------------------------------------------------- component payloads */

/** config.vue's Resolutions tab rows, and EncoderConfig's select rows. */
export interface PropertyEntry {
  tag: string
  resolution: string
  id: number
  new: boolean
}

export interface EncoderConfigEntryRow {
  tag: string
  /**
   * Partial, not full: the synthetic "New Template..." row carries `{}`, and
   * EncoderConfig.vue guards every key read (`if (content.PreArguments)`) for exactly
   * that reason. Typing it Partial is what lets the empty row through unchanged.
   */
  content: Partial<EncoderConfigEntry>
  id: number
  new: boolean
}

/** Emitted by every Modules/*Settings component. */
export interface ModuleSettingsUpdate {
  Name: ModuleName
  Settings: unknown
}

/** Emitted by JobDataTable when its selection changes. */
export interface JobSelectionUpdate {
  client: string
  selected: Job[]
}
