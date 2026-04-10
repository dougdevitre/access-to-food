import React, { useState, useRef, useEffect } from 'react';
import Anthropic from '@anthropic-ai/sdk';
import { Send, Bot, User, Loader2, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { collection, getDocs, query } from 'firebase/firestore';
import { db } from '../firebase';

const API_KEY_CONFIGURED = !!process.env.ANTHROPIC_API_KEY;

const SYSTEM_PROMPT = `You are a helpful AI assistant for access-to-food, part of the access-to series.

Responsibilities:
- Help users find food resources and partner agencies
- Explain access-to-food programs (Emergency Food, Community Meals, Mobile Markets)
- Help people volunteer for access-to-food
- Provide donation impact information ($1 provides $6 in food and services)
- Provide access-to-food contact info: Community Support Hub | (555) 123-4567

When a user asks for food near a location or today, use the searchPantries tool to find relevant partner agencies.
When returning agency information, include:
- agency name
- address
- hours
- eligibility (if available in services)

Always respond with empathy and actionable guidance.`;

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const searchPantriesTool: Anthropic.Tool = {
  name: "searchPantries",
  description: "Search for food pantries or distribution events. You can optionally provide a search term like a city, zip code, or name.",
  input_schema: {
    type: "object" as const,
    properties: {
      searchTerm: {
        type: "string",
        description: "Optional search term to filter pantries by name, address, city, zip, or county.",
      },
    },
  },
};

export default function Assistant() {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi there! I am your access-to-food Assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Keep track of the raw conversation history for the Claude API
  const [conversationHistory, setConversationHistory] = useState<Anthropic.MessageParam[]>([]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const executeSearchPantries = async (searchTerm?: string) => {
    try {
      const q = query(collection(db, 'pantries'));
      const snapshot = await getDocs(q);
      let data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      if (searchTerm) {
        const lowerTerm = searchTerm.toLowerCase();
        data = data.filter((p: any) => {
          const orgName = (p.organization_name || p.name || '').toLowerCase();
          const fullAddress = `${p.address || ''} ${p.city || ''} ${p.zip || ''}`.toLowerCase();
          const county = (p.county || '').toLowerCase();
          return orgName.includes(lowerTerm) || fullAddress.includes(lowerTerm) || county.includes(lowerTerm);
        });
      }

      // Limit to top 5 to avoid exceeding token limits
      return data.slice(0, 5);
    } catch (error) {
      console.error("Error fetching pantries:", error);
      return { error: "Failed to fetch pantries from database." };
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, dangerouslyAllowBrowser: true });

      const newUserMessage: Anthropic.MessageParam = {
        role: 'user',
        content: userMessage,
      };

      let currentHistory: Anthropic.MessageParam[] = [...conversationHistory, newUserMessage];

      let response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        tools: [searchPantriesTool],
        messages: currentHistory,
      });

      // Handle tool use if the model decides to use a tool
      if (response.stop_reason === 'tool_use') {
        const toolUseBlock = response.content.find(
          (block): block is Anthropic.ContentBlock & { type: 'tool_use' } => block.type === 'tool_use'
        );

        if (toolUseBlock && toolUseBlock.name === 'searchPantries') {
          const args = toolUseBlock.input as { searchTerm?: string };
          const searchResults = await executeSearchPantries(args.searchTerm);

          // Add the assistant's tool use response to history
          currentHistory = [
            ...currentHistory,
            { role: 'assistant', content: response.content },
            {
              role: 'user',
              content: [{
                type: 'tool_result',
                tool_use_id: toolUseBlock.id,
                content: JSON.stringify(searchResults),
              }],
            },
          ];

          // Call Claude again with the tool results
          response = await client.messages.create({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 1024,
            system: SYSTEM_PROMPT,
            tools: [searchPantriesTool],
            messages: currentHistory,
          });
        }
      }

      // Extract text from response content blocks
      const textBlocks = response.content.filter(
        (block): block is Anthropic.TextBlock => block.type === 'text'
      );
      const assistantMessage = textBlocks.map(b => b.text).join('\n');

      if (assistantMessage) {
        setMessages(prev => [...prev, { role: 'assistant', content: assistantMessage }]);

        // Update history with the final response
        setConversationHistory([
          ...currentHistory,
          { role: 'assistant', content: assistantMessage },
        ]);
      } else {
        throw new Error('No response text');
      }
    } catch (error) {
      console.error('Error generating response:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'I am sorry, I encountered an error while trying to respond. Please try again later.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto h-[calc(100vh-137px)] md:h-[calc(100vh-153px)] lg:h-[calc(100vh-161px)] flex flex-col bg-white rounded-3xl border border-stone-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] overflow-hidden">
      <div className="bg-emerald-700 text-white p-6 flex items-center gap-4 shrink-0">
        <div className="bg-emerald-600 p-3 rounded-2xl">
          <Bot className="w-7 h-7" />
        </div>
        <div>
          <h1 className="font-bold text-xl tracking-tight">Food Access Assistant</h1>
          <p className="text-emerald-100 text-sm font-medium mt-0.5">Ask me about pantries, events, or volunteering</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-stone-50">
        {!API_KEY_CONFIGURED && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-amber-800">AI Assistant Unavailable</p>
              <p className="text-sm text-amber-700 mt-1">The Anthropic API key is not configured. The chat assistant requires a valid API key to function. Please set the <code className="bg-amber-100 px-1.5 py-0.5 rounded text-xs font-mono">ANTHROPIC_API_KEY</code> environment variable.</p>
            </div>
          </div>
        )}
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role === 'assistant' && (
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <Bot className="w-6 h-6 text-emerald-700" />
              </div>
            )}
            <div
              className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-5 shadow-sm ${
                msg.role === 'user'
                  ? 'bg-emerald-700 text-white rounded-tr-sm'
                  : 'bg-white text-stone-800 border border-stone-100 rounded-tl-sm'
              }`}
            >
              {msg.role === 'user' ? (
                <p className="whitespace-pre-wrap">{msg.content}</p>
              ) : (
                <div className="prose prose-sm max-w-none prose-emerald">
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    rehypePlugins={[rehypeRaw]}
                    components={{
                      a: ({node, ...props}) => <a {...props} className="text-emerald-600 hover:text-emerald-700 underline underline-offset-2" target="_blank" rel="noopener noreferrer" />,
                      ul: ({node, ...props}) => <ul {...props} className="list-disc pl-5 space-y-1 my-2" />,
                      ol: ({node, ...props}) => <ol {...props} className="list-decimal pl-5 space-y-1 my-2" />,
                      li: ({node, ...props}) => <li {...props} className="text-stone-700" />,
                      p: ({node, ...props}) => <p {...props} className="text-stone-700 leading-relaxed mb-2 last:mb-0" />,
                      strong: ({node, ...props}) => <strong {...props} className="font-bold text-stone-900" />,
                      h1: ({node, ...props}) => <h1 {...props} className="text-xl font-bold text-stone-900 mt-4 mb-2" />,
                      h2: ({node, ...props}) => <h2 {...props} className="text-lg font-bold text-stone-900 mt-3 mb-2" />,
                      h3: ({node, ...props}) => <h3 {...props} className="text-base font-bold text-stone-900 mt-2 mb-1" />,
                      table: ({node, ...props}) => <div className="overflow-x-auto my-4"><table {...props} className="min-w-full divide-y divide-stone-200 border border-stone-200 rounded-lg" /></div>,
                      th: ({node, ...props}) => <th {...props} className="px-3 py-2 bg-stone-50 text-left text-xs font-medium text-stone-500 uppercase tracking-wider" />,
                      td: ({node, ...props}) => <td {...props} className="px-3 py-2 whitespace-nowrap text-sm text-stone-700 border-t border-stone-100" />
                    }}
                  >
                    {msg.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
            {msg.role === 'user' && (
              <div className="w-10 h-10 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mt-1 shadow-sm">
                <User className="w-6 h-6 text-stone-600" />
              </div>
            )}
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-4 justify-start">
            <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0 mt-1 shadow-sm">
              <Bot className="w-6 h-6 text-emerald-700" />
            </div>
            <div className="bg-white border border-stone-100 text-stone-800 rounded-3xl rounded-tl-sm p-5 flex items-center gap-3 shadow-sm">
              <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
              <span className="text-sm text-stone-500 font-semibold">Thinking...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-white border-t border-stone-100 shrink-0">
        <form onSubmit={handleSubmit} className="flex gap-3 relative max-w-4xl mx-auto">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={API_KEY_CONFIGURED ? "Type your message here..." : "AI assistant is not configured"}
            className="flex-1 bg-stone-50 border border-stone-200 rounded-full pl-6 pr-16 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent shadow-sm font-medium text-stone-800 placeholder:text-stone-400"
            disabled={isLoading || !API_KEY_CONFIGURED}
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading || !API_KEY_CONFIGURED}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
          >
            <Send className="w-5 h-5 ml-0.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
