// Enums matching backend Prisma schema
export enum UserRole {
  USER = 'USER',
  MODERATOR = 'MODERATOR',
  ADMIN = 'ADMIN',
}

export enum Language {
  en = 'en',
  es = 'es',
}

export enum ContentType {
  VIDEO = 'VIDEO',
  AUDIO = 'AUDIO',
  IMAGE = 'IMAGE',
  TEXT = 'TEXT',
}

export enum PostCategory {
  PRAYER_REQUEST = 'PRAYER_REQUEST',
  TESTIMONY = 'TESTIMONY',
  BIBLICAL_REFLECTION = 'BIBLICAL_REFLECTION',
  SABBATH_ACTIVITY = 'SABBATH_ACTIVITY',
  GENERAL_ENCOURAGEMENT = 'GENERAL_ENCOURAGEMENT',
}

export enum ReactionType {
  ENCOURAGES_ME = 'ENCOURAGES_ME',
  PRAYING_FOR_YOU = 'PRAYING_FOR_YOU',
}

export enum FlagStatus {
  PENDING = 'PENDING',
  REVIEWED = 'REVIEWED',
  DISMISSED = 'DISMISSED',
}

export enum ModerationStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  FLAGGED = 'FLAGGED',
  REJECTED = 'REJECTED',
}

// API Response Types matching backend (snake_case from DB)
export interface User {
  id: string;
  email: string;
  name: string;
  profilepictureurl?: string;
  localchurch?: string;
  ministry?: string;
  country?: string;
  preferredlanguage: Language;
  timezone: string;
  role: UserRole;
  hasacceptedvalues: boolean;
  valuesacceptedat?: string;
  googleid?: string;
  appleid?: string;
  createdat: string;
  updatedat: string;
  lastloginat?: string;
}

export interface Post {
  id: string;
  userid: string;
  contenttype: ContentType;
  category: PostCategory;
  textcontent?: string;
  mediaurl?: string;
  thumbnailurl?: string;
  mediaduration?: number;
  mediasize?: number;
  language: Language;
  ishidden: boolean;
  hiddenreason?: string;
  hiddenby?: string;
  hiddenat?: string;
  aimoderationstatus: ModerationStatus;
  aimoderationnotes?: string;
  createdat: string;
  updatedat: string;
  user?: User;
  reactions?: Reaction[];
  comments?: Comment[];
  _count?: {
    reactions: number;
    comments: number;
  };
}

export interface Reaction {
  id: string;
  postid: string;
  userid: string;
  reactiontype: ReactionType;
  createdat: string;
  user?: User;
}

export interface Comment {
  id: string;
  postid: string;
  userid: string;
  content: string;
  ishidden: boolean;
  hiddenreason?: string;
  hiddenby?: string;
  hiddenat?: string;
  aimoderationstatus: ModerationStatus;
  aimoderationnotes?: string;
  createdat: string;
  updatedat: string;
  user?: User;
}

export interface Flag {
  id: string;
  postid?: string;
  commentid?: string;
  reportedby: string;
  reason: string;
  description?: string;
  status: FlagStatus;
  reviewedby?: string;
  reviewedat?: string;
  reviewnotes?: string;
  createdat: string;
  reporter?: User;
  reviewer?: User;
  post?: Post;
  comment?: Comment;
}

// Auth Response
export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

// API Request DTOs
export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  preferredLanguage?: Language;
  timezone?: string;
  localChurch?: string;
  ministry?: string;
  country?: string;
}

export interface LoginDto {
  email: string;
  password: string;
}

export interface CreatePostDto {
  contentType: ContentType;
  category: PostCategory;
  textContent?: string;
  mediaUrl?: string;
  thumbnailUrl?: string;
  mediaDuration?: number;
  mediaSize?: number;
  language?: Language;
}

export interface FeedQueryDto {
  page?: number;
  limit?: number;
  category?: PostCategory;
  language?: Language;
  timezone?: string;
}

export interface FeedResponse {
  posts: Post[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ToggleReactionDto {
  reactionType: ReactionType;
}

export interface CreateCommentDto {
  content: string;
}

export interface ReportContentDto {
  reason: string;
  description?: string;
}

export interface UpdateProfileDto {
  name?: string;
  localChurch?: string;
  ministry?: string;
  country?: string;
  preferredLanguage?: Language;
  timezone?: string;
}

export interface SabbathStatus {
  isSabbath: boolean;
  timezone: string;
  currentTime: string;
  nextSabbathStart?: string;
  nextSabbathEnd?: string;
}

// Navigation Types
export type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  ResetPassword: { email: string };
  ValuesAcceptance: undefined;
  MainApp: undefined;
  TermsAndConditions: undefined;
  PrivacyPolicy: undefined;
  CommunityGuidelines: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Post: undefined;
  Moderation: undefined;
  Admin: undefined;
  Profile: undefined;
};

export type HomeStackParamList = {
  Feed: undefined;
  PostDetail: { postId: string };
};
