import { create } from 'zustand';
import { chatTitleFrom } from '@/mock-data/agent';
import { sendAgentMessage } from '@/lib/api/agent';

export interface AgentMessage {
   id: string;
   role: 'user' | 'assistant';
   content: string;
   /** True while the assistant reply is still being "typed". */
   streaming?: boolean;
}

export interface AgentChat {
   id: string;
   title: string;
   messages: AgentMessage[];
}

interface AgentChatState {
   chats: AgentChat[];
   activeChatId: string | null;
   setActiveChat: (chatId: string | null) => void;
   startNewChat: () => void;
   /** Sends a user message; returns the ids needed to stream the reply. */
   sendMessage: (
      input: string
   ) => Promise<{ chatId: string; assistantMessageId: string; reply: string }>;
   appendToMessage: (chatId: string, messageId: string, chunk: string) => void;
   finishMessage: (chatId: string, messageId: string) => void;
}

let nextId = 1;
const uid = (prefix: string) => `${prefix}-${nextId++}`;

export const useAgentChatStore = create<AgentChatState>((set, get) => ({
   chats: [],
   activeChatId: null,

   setActiveChat: (chatId) => set({ activeChatId: chatId }),

   startNewChat: () => set({ activeChatId: null }),

   sendMessage: async (input) => {
      const state = get();
      let reply: string;
      try {
         const apiRes = await sendAgentMessage(input);
         if (!apiRes?.reply) throw new Error('Agent returned an empty response');
         reply = apiRes.reply;
      } catch (err) {
         reply = err instanceof Error ? err.message : 'Agent is unavailable';
      }
      const assistantMessageId = uid('msg');
      const userMessage: AgentMessage = { id: uid('msg'), role: 'user', content: input };
      const assistantMessage: AgentMessage = {
         id: assistantMessageId,
         role: 'assistant',
         content: '',
         streaming: true,
      };

      const active = state.chats.find((chat) => chat.id === state.activeChatId);
      if (active) {
         set({
            chats: state.chats.map((chat) =>
               chat.id === active.id
                  ? { ...chat, messages: [...chat.messages, userMessage, assistantMessage] }
                  : chat
            ),
         });
         return { chatId: active.id, assistantMessageId, reply };
      }

      const chat: AgentChat = {
         id: uid('chat'),
         title: chatTitleFrom(input),
         messages: [userMessage, assistantMessage],
      };
      set({ chats: [chat, ...state.chats], activeChatId: chat.id });
      return { chatId: chat.id, assistantMessageId, reply };
   },

   appendToMessage: (chatId, messageId, chunk) =>
      set((state) => ({
         chats: state.chats.map((chat) =>
            chat.id === chatId
               ? {
                    ...chat,
                    messages: chat.messages.map((message) =>
                       message.id === messageId
                          ? { ...message, content: message.content + chunk }
                          : message
                    ),
                 }
               : chat
         ),
      })),

   finishMessage: (chatId, messageId) =>
      set((state) => ({
         chats: state.chats.map((chat) =>
            chat.id === chatId
               ? {
                    ...chat,
                    messages: chat.messages.map((message) =>
                       message.id === messageId ? { ...message, streaming: false } : message
                    ),
                 }
               : chat
         ),
      })),
}));
