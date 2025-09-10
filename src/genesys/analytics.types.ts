import { z } from 'zod';

export const SegmentSchema = z
  .object({
    segmentStart: z.string().datetime().optional(),
    segmentEnd: z.string().datetime().optional(),
    queueId: z.string().optional(),
    segmentType: z.string().optional(),
    disconnectType: z.string().optional(),
    wrapUpCode: z.string().optional(),
  })
  .passthrough();
export type Segment = z.infer<typeof SegmentSchema>;

export const SessionSchema = z
  .object({
    sessionId: z.string().optional(),
    mediaType: z.string().optional(), // e.g. "voice", "callback"
    peerId: z.string().optional(),
    recording: z.boolean().optional(),
    segments: z.array(SegmentSchema).optional(),
    direction: z.string().optional(),
  })
  .passthrough();
export type Session = z.infer<typeof SessionSchema>;

export const ParticipantSchema = z
  .object({
    participantId: z.string().optional(),
    participantName: z.string().optional(),
    purpose: z.string().optional(), // "customer" | "agent" | ...
    userId: z.string().optional(),
    sessions: z.array(SessionSchema).optional(),
  })
  .passthrough();
export type Participant = z.infer<typeof ParticipantSchema>;

export const ConversationSchema = z
  .object({
    conversationId: z.string(),
    conversationStart: z.string().datetime().optional(),
    conversationEnd: z.string().datetime().optional(),
    participants: z.array(ParticipantSchema).optional(),
  })
  .passthrough();
export type Conversation = z.infer<typeof ConversationSchema>;

export const ParticipantsSchema = z.array(ParticipantSchema);
export type Participants = z.infer<typeof ParticipantsSchema>;
export const ConversationsSchema = z.array(ConversationSchema);
export type Conversations = z.infer<typeof ConversationsSchema>;
export const SegmentsSchema = z.array(SegmentSchema);
export type Segments = z.infer<typeof SegmentsSchema>;
