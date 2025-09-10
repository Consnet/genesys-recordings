export type Recording = {
  conversationId: string;
  recordingId: string;
  mediaType: string;
  fileState?: string | undefined;
  archiveDate?: string | undefined;
  deleteDate?: string | undefined;
  sessionId: string;
  startTime?: string | undefined;
  endTime?: string | undefined;
};
