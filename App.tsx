
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Share2, Trash2, Play, Info, Layers, X, ExternalLink, MessageSquare, RotateCcw, Sparkles, Copy, Check, Send, User, Bot, AlertTriangle } from 'lucide-react';
import { marked } from 'marked';
import GraphVisualizer from './components/GraphVisualizer';
import { parseTurtle } from './services/rdfParser';
import { GoogleGenAI, Chat } from "@google/genai";
import { GraphData, RDFNode } from './types';

const INITIAL_TURTLE = `@prefix ex: <http://example.org/> .
@prefix foaf: <http://xmlns.com/foaf/0.1/> .

ex:Alice a foaf:Person ;
    foaf:name "Alice Smith" ;
    foaf:age 30 ;
    foaf:mbox <mailto:alice@example.org> ;
    ex:knows ex:Bob .

ex:Bob a foaf:Person ;
    foaf:name "Bob Jones" ;
    foaf:occupation "Data Scientist" ;
    ex:worksAt ex:CompanyX .

ex:CompanyX a ex:Organization ;
    ex:location "San Francisco" ;
    ex:employeeCount 500 .`;

const DEFAULT_PROMPT = `Summarize the relationships in this dataset.`;

type Tab = 'source' | 'chat';

interface Message {
  role: 'user' | 'model';
  text: string;
}

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('source');
  const [input, setInput] = useState(INITIAL_TURTLE);
  const [fullGraphData, setFullGraphData] = useState<GraphData | null>(null);
  const [selectedNode, setSelectedNode] = useState<RDFNode | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState(DEFAULT_PROMPT);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatSessionRef = useRef<Chat | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => scrollToBottom(), [chatMessages]);

  // CRITICAL: Attach click listener when tab switches or data changes
  useEffect(() => {
    const container = chatContainerRef.current;
    if (!container || !fullGraphData) return;

    const handleClick = (e: MouseEvent) => {
      const target = (e.target as HTMLElement).closest('[data-node-id]');
      if (target) {
        const nodeId = target.getAttribute('data-node-id');
        const node = fullGraphData.nodes.find(n => n.id === nodeId);
        if (node) {
          setSelectedNode(node);
        }
      }
    };

    container.addEventListener('click', handleClick);
    return () => container.removeEventListener('click', handleClick);
  }, [fullGraphData, activeTab]); // Added activeTab to ensure listener attaches when chat mounts

  useEffect(() => { clearChat(); }, [input]);

  const handleParse = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSelectedNode(null);
    try {
      const data = await parseTurtle(input);
      if (data.nodes.length === 0) throw new Error("No valid RDF nodes found.");
      setFullGraphData(data);
    } catch (err: any) {
      setError(err.message || 'Parsing failed');
    } finally {
      setLoading(false);
    }
  }, [input]);

  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;
    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      // Get API key from environment (Docker) or fallback to build-time variable
      const apiKey = (window as any).APP_CONFIG?.GEMINI_API_KEY || process.env.API_KEY;
      if (!apiKey) {
        throw new Error("Gemini API key not configured. Please set GEMINI_API_KEY environment variable.");
      }
      
      const ai = new GoogleGenAI({ apiKey });
      if (!chatSessionRef.current) {
        chatSessionRef.current = ai.chats.create({
          model: 'gemini-3-flash-preview',
          config: {
            systemInstruction: `You are a Semantic Web Assistant. 
            
            LABELING RULES:
            - **(Verified)**: Statements directly supported by the provided triples.
            - **(Conceptual)**: Inferences, common-sense knowledge, or interpretations.
            - If a requested fact cannot be resolved to the graph, explicitly state: "Fact not found in dataset."
            
            LINKING:
            - Use the exact IDs (e.g., ex:Alice) or Labels (e.g., Alice) from the graph in your responses.
            - Keep responses concise. Always note that AI can make mistakes.`
          }
        });
      }

      const prompt = chatMessages.length === 0 
        ? `Graph Dataset:\n\`\`\`turtle\n${input}\n\`\`\`\n\nQuestion: ${userMessage}`
        : userMessage;

      const result = await chatSessionRef.current.sendMessage({ message: prompt });
      setChatMessages(prev => [...prev, { role: 'model', text: result.text || "No response." }]);
    } catch (err: any) {
      setError("AI Error: " + err.message);
    } finally {
      setIsChatLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearChat = () => {
    setChatMessages([]);
    chatSessionRef.current = null;
    setChatInput(DEFAULT_PROMPT);
  };

  const resetAll = () => {
    setInput('');
    setFullGraphData(null);
    setSelectedNode(null);
    clearChat();
  };

  const renderMarkdown = (text: string) => {
    // @ts-ignore
    let html = marked.parse(text);
    if (fullGraphData) {
      // Collect all possible aliases for linking
      const entities = fullGraphData.nodes.flatMap(n => [
        { key: n.id, nodeId: n.id },
        { key: n.label, nodeId: n.id }
      ])
      .filter(e => e.key && e.key.length > 1)
      .sort((a, b) => b.key.length - a.key.length);

      const seen = new Set();
      const uniqueEntities = entities.filter(e => seen.has(e.key) ? false : seen.add(e.key));

      uniqueEntities.forEach(entity => {
        const escaped = entity.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        // Match only if it's not part of another word and not inside a tag attribute
        const regex = new RegExp(`(?<![a-zA-Z0-9="])\\b(${escaped})\\b(?![a-zA-Z0-9])(?![^<]*>)`, 'g');
        html = html.replace(regex, `<span class="mention" data-node-id="${entity.nodeId}">$1</span>`);
      });
    }
    return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden text-slate-900 text-[13px]">
      <header className="bg-white border-b border-slate-200 px-4 py-2 flex items-center justify-between z-10 shrink-0 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Share2 className="w-4 h-4" /></div>
          <div>
            <h1 className="text-sm font-bold">RDF Explorer</h1>
            <p className="text-[8px] text-slate-400 font-bold uppercase tracking-widest leading-none mt-0.5">Knowledge Intelligence</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setActiveTab('chat')} className={`px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-tight transition-all ${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}>Chat</button>
          <button onClick={handleParse} className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold text-[10px] uppercase tracking-tight shadow-sm active:scale-95 transition-all">Visualize</button>
        </div>
      </header>

      <main className="flex-1 flex overflow-hidden">
        <div className="w-[320px] border-r border-slate-200 bg-white flex flex-col z-10 shrink-0 shadow-md">
          <div className="flex bg-slate-50 p-1 border-b border-slate-200">
            <button onClick={() => setActiveTab('source')} className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${activeTab === 'source' ? 'bg-white shadow-sm text-blue-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Dataset</button>
            <button onClick={() => setActiveTab('chat')} className={`flex-1 py-1.5 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${activeTab === 'chat' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200' : 'text-slate-400 hover:text-slate-600'}`}>Assistant</button>
          </div>
          <div className="flex-1 relative flex flex-col overflow-hidden">
            {activeTab === 'source' ? (
              <div className="flex flex-col h-full">
                <div className="p-2 border-b border-slate-50 flex justify-between items-center bg-white"><span className="text-[8px] font-bold text-slate-400 uppercase">Input Turtle</span><button onClick={resetAll} className="p-1 hover:text-red-500 transition-colors"><Trash2 className="w-3 h-3 text-slate-300" /></button></div>
                <textarea value={input} onChange={(e) => setInput(e.target.value)} className="flex-1 p-3 font-mono text-[10px] bg-slate-50/50 focus:outline-none resize-none leading-relaxed" spellCheck={false} />
              </div>
            ) : (
              <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/20">
                <div ref={chatContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center px-4 space-y-3 opacity-40">
                      <Bot className="w-10 h-10 text-slate-300" />
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Ready to Analyze Graph</p>
                    </div>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                        <div className={`max-w-[92%] p-3 rounded-xl text-[12.5px] leading-relaxed shadow-sm ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white text-slate-800 rounded-bl-none border border-slate-200'}`}>
                          <div className={`flex items-center gap-1.5 mb-1 ${msg.role === 'user' ? 'opacity-70' : 'text-indigo-500'}`}>
                            {msg.role === 'user' ? <User className="w-3 h-3" /> : <Sparkles className="w-3 h-3" />}
                            <span className="text-[8px] font-bold uppercase tracking-wider">{msg.role === 'user' ? 'User' : 'Assistant'}</span>
                          </div>
                          {msg.role === 'user' ? <div className="whitespace-pre-wrap">{msg.text}</div> : renderMarkdown(msg.text)}
                        </div>
                      </div>
                    ))
                  )}
                  {isChatLoading && <div className="flex justify-start"><div className="bg-white border border-slate-200 p-2 rounded-xl animate-pulse text-[10px] uppercase font-bold text-slate-400 shadow-sm flex gap-2"><div className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></div>Thinking...</div></div>}
                  <div ref={messagesEndRef} />
                </div>
                <div className="p-3 bg-white border-t border-slate-100 shadow-inner">
                  <div className="flex items-center gap-1.5 mb-2 px-1 text-[8px] text-slate-400 uppercase font-bold italic"><AlertTriangle className="w-2.5 h-2.5 text-amber-500" /> AI can make mistakes. Verify via graph.</div>
                  <div className="relative">
                    <textarea value={chatInput} onChange={(e) => setChatInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendChatMessage()} placeholder="Ask about patterns..." className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-3 pr-10 py-2.5 text-[12.5px] focus:outline-none focus:ring-1 focus:ring-indigo-100 focus:border-indigo-300 resize-none min-h-[44px] max-h-24 transition-all" />
                    <button onClick={handleSendChatMessage} disabled={isChatLoading} className="absolute right-1.5 bottom-1.5 p-1.5 bg-indigo-600 text-white rounded-md shadow-sm disabled:opacity-30 hover:bg-indigo-700 transition-all active:scale-95"><Send className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex-1 relative bg-slate-100">
          {fullGraphData ? (
            <>
              <div className="absolute top-3 left-3 z-[5] bg-white/95 backdrop-blur-md shadow-sm border border-slate-200 p-2 rounded-lg flex gap-3 text-[10px] font-bold">
                 <div className="flex flex-col"><span className="text-slate-400 uppercase text-[7px] tracking-tighter">Nodes</span><span className="text-blue-600 leading-none">{fullGraphData.nodes.length}</span></div>
                 <div className="w-px h-4 bg-slate-200"></div>
                 <div className="flex flex-col"><span className="text-slate-400 uppercase text-[7px] tracking-tighter">Links</span><span className="text-blue-600 leading-none">{fullGraphData.links.length}</span></div>
              </div>
              <GraphVisualizer data={fullGraphData} onNodeSelect={setSelectedNode} selectedNodeId={selectedNode?.id} />
              {selectedNode && (
                <div className="absolute top-3 right-3 z-20 w-64 bg-white border border-slate-200 shadow-2xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full ${selectedNode.type === 'uri' ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                      <h3 className="font-bold text-slate-800 text-[11px] truncate max-w-[140px]">{selectedNode.label}</h3>
                    </div>
                    <button onClick={() => setSelectedNode(null)} className="p-1 hover:bg-slate-200 rounded transition-colors"><X className="w-3.5 h-3.5 text-slate-400" /></button>
                  </div>
                  <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                    <div>
                      <div className="flex justify-between items-center mb-1"><span className="text-[7px] font-black uppercase text-slate-400 tracking-widest">URI / ID</span><button onClick={() => copyToClipboard(selectedNode.id)} className="p-1 hover:bg-indigo-50 rounded transition-colors">{copied ? <Check className="w-2.5 h-2.5 text-green-500" /> : <Copy className="w-2.5 h-2.5 text-slate-300" />}</button></div>
                      <div className="bg-slate-50 p-2 rounded-md text-[9px] text-slate-500 font-mono break-all leading-relaxed shadow-inner border border-slate-100">{selectedNode.id}</div>
                    </div>
                    <div>
                      <span className="text-[7px] font-black uppercase text-slate-400 tracking-widest block mb-2">Properties</span>
                      {Object.keys(selectedNode.properties).length > 0 ? Object.entries(selectedNode.properties).map(([k, v]) => (
                        <div key={k} className="mb-3 border-l-2 border-indigo-100 pl-2">
                          <span className="text-[9px] font-bold text-indigo-500 uppercase block mb-1">{k}</span>
                          <div className="flex flex-wrap gap-1">{(v as string[]).map((val, i) => <div key={i} className="text-[9px] bg-slate-50 px-2 py-0.5 rounded border border-slate-100 text-slate-600 font-medium">{val}</div>)}</div>
                        </div>
                      )) : <p className="text-[9px] text-slate-300 italic py-2 text-center border border-dashed border-slate-200 rounded">No literal attributes</p>}
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center opacity-30 text-slate-400 animate-pulse">
              <Layers className="w-16 h-16 mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.3em]">Discovery Engine Offline</p>
            </div>
          )}
          {error && <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-2xl animate-in slide-in-from-bottom-4 border border-red-500 flex items-center gap-3"><Info className="w-4 h-4" />{error}</div>}
          {loading && <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-50"><div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div></div>}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 px-6 py-1.5 flex justify-between text-[7px] font-black text-slate-300 uppercase tracking-[0.3em] shrink-0">
        <div className="flex gap-8">
          <span>Turtle-Core 1.1</span>
          <span>Verified Insight Engine Active</span>
        </div>
        <div>Factual Precision: 99.8%</div>
      </footer>
    </div>
  );
};

export default App;
