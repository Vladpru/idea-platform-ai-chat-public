export type LiveChatAuthorRecord = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  avatarUrl: string | null;
};

export type LiveChatRoomRecord = {
  id: string;
  ideaId: string | null;
  problemId: string | null;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
  idea: {
    id: string;
    title: string | null;
    status: string;
  } | null;
  problem: {
    id: string;
    title: string;
    status: string;
  } | null;
  createdBy: LiveChatAuthorRecord;
  participants: Array<{
    user: LiveChatAuthorRecord;
  }>;
};

export type LiveChatMessageRecord = {
  id: string;
  roomId: string;
  authorId: string;
  content: string;
  attachmentUrl: string | null;
  attachmentName: string | null;
  attachmentMimeType: string | null;
  createdAt: Date;
  author: LiveChatAuthorRecord;
};
