export type AuthSession = {
  id: string;
  email: string;
  username: string;
  accentColor: string;
  accessToken: string;
};

export type ChatReaction = {
  emoji: string;
  userNames: string[];
};

export type ChatMessage = {
  id: string;
  roomId: string | null;
  authorId: string;
  authorName: string;
  authorColor: string;
  text: string;
  createdAt: string;
  reactions: ChatReaction[];
};

export type RoomSummary = {
  id: string;
  name: string;
  creatorId: string;
  createdAt: string;
};

export type RoomMember = {
  userId: string;
  username: string;
  accentColor: string;
  addedAt: string;
  canSeePriorHistory: boolean;
  isCreator: boolean;
};

export type RoomDetail = RoomSummary & {
  members: RoomMember[];
};

export type AvailableUser = {
  id: string;
  username: string;
  accentColor: string;
};
