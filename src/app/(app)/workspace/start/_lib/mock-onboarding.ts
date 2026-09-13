export interface OnboardingMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export const openingMessage: OnboardingMessage = {
  id: "a0",
  role: "assistant",
  content:
    "Hi! I'm going to build your personal teaching workspace. Three quick questions — first, what do you teach, and to whom?",
};

/** Canned interview replies, keyed by how many messages the user has sent. */
export const mockInterviewReplies: string[] = [
  "Love it. And where do you teach — what kind of school, and in which country?",
  "Last one: how should your materials sound — formal, friendly, playful? And what's one goal you have for this year?",
  "That's everything I need! Hit the button below and I'll build your workspace.",
];

export const mockFallbackReply =
  "Thanks! Whenever you're ready, the button below creates your workspace.";
