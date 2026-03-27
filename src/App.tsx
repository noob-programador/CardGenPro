import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { 
  Download, Image as ImageIcon, Type, Palette, 
  Sparkles, RefreshCw, Upload, AlignLeft, 
  AlignCenter, AlignRight, CheckCircle2, AlertCircle,
  ChevronDown, ChevronUp, Wand2
} from 'lucide-react';

const QUOTES = [
  "Nunca desista dos seus sonhos!",
  "Você é mais forte do que imagina.",
  "Cada novo dia é uma nova chance.",
  "Acredite em si mesmo e vá em frente!",
  "O sucesso é construído com pequenos passos.",
  "Seja a mudança que você deseja ver no mundo."
];

const AI_MODELS: Record<string, {value: string, label: string}[]> = {
  groq: [
    { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B Versatile" },
    { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    { value: "gemma2-9b-it", label: "Gemma 2 9B" },
    { value: "deepseek-r1-distill-llama-70b", label: "DeepSeek-R1 Distill 70B" }
  ],
  mistral: [
    { value: "mistral-large-latest", label: "Mistral Large Latest" },
    { value: "mistral-small-latest", label: "Mistral Small Latest" },
    { value: "pixtral-12b-2409", label: "Pixtral 12B" },
    { value: "codestral-latest", label: "Codestral Latest" }
  ],
  gemini: [
    { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
    { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" }
  ]
};

const FORMATS: Record<string, {w: number, h: number, label: string}> = {
  "9:16": { w: 360, h: 640, label: "9:16 (Kwai/TikTok)" },
  "1:1": { w: 400, h: 400, label: "1:1 (Instagram)" },
  "4:5": { w: 400, h: 500, label: "4:5 (Pinterest)" }
};

const FONTS = [
  { value: "Roboto", label: "Roboto" },
  { value: "Lobster", label: "Lobster" },
  { value: "Montserrat", label: "Montserrat" },
  { value: "Pacifico", label: "Pacifico" },
  { value: "Open Sans", label: "Open Sans" }
];

const GRADIENTS = [
  { value: "none", label: "Nenhum" },
  { value: "linear-gradient(to right, #ff0000, #ff9900)", label: "Vermelho-Laranja" },
  { value: "linear-gradient(to right, #0000ff, #00ffff)", label: "Azul-Ciano" },
  { value: "linear-gradient(to right, #ffff00, #00ff00)", label: "Amarelo-Verde" },
  { value: "linear-gradient(to right, #ff69b4, #8a2be2)", label: "Rosa-Roxo" }
];

const CARD_STYLES = [
  { value: "default", label: "Padrão" },
  { value: "bordered", label: "Borda Decorativa" },
  { value: "gradient-purple", label: "Gradiente Roxo" },
  { value: "gradient-sunset", label: "Gradiente Sunset" },
  { value: "gradient-ocean", label: "Gradiente Oceano" },
  { value: "gradient-forest", label: "Gradiente Floresta" },
  { value: "glass", label: "Glassmorphism" },
  { value: "shadow", label: "Sombra Forte" },
  { value: "ornamental", label: "Ornamental" },
  { value: "geometric", label: "Geométrico" },
  { value: "transparent", label: "Transparente" }
];

const IMAGE_FILTERS = [
  { value: "none", label: "Nenhum" },
  { value: "brightness(80%)", label: "Escurecer" },
  { value: "brightness(120%)", label: "Clarear" },
  { value: "grayscale(100%)", label: "Cinza" },
  { value: "sepia(100%)", label: "Sépia" },
  { value: "blur(4px)", label: "Desfoque" }
];

export default function App() {
  // Content State
  const [quote, setQuote] = useState("Acredite em si mesmo e vá em frente!");
  const [handle, setHandle] = useState("@seuusuario");
  const [bgImage, setBgImage] = useState<string | null>(null);
  
  // Style State
  const [format, setFormat] = useState("9:16");
  const [cardStyle, setCardStyle] = useState("default");
  const [cardBgColor, setCardBgColor] = useState("#18181b");
  const [font, setFont] = useState("Montserrat");
  const [textColor, setTextColor] = useState("#ffffff");
  const [gradient, setGradient] = useState("none");
  const [fontSize, setFontSize] = useState(32);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("center");
  const [textBorderWidth, setTextBorderWidth] = useState(0);
  const [textBorderStyle, setTextBorderStyle] = useState("solid");
  const [textBorderColor, setTextBorderColor] = useState("#ffffff");
  const [imageFilter, setImageFilter] = useState("brightness(80%)");
  
  // Shadow State
  const [shadowColor, setShadowColor] = useState("#000000");
  const [shadowX, setShadowX] = useState(2);
  const [shadowY, setShadowY] = useState(2);
  const [shadowBlur, setShadowBlur] = useState(8);

  // AI State
  const [aiProvider, setAiProvider] = useState("groq");
  const [aiModel, setAiModel] = useState("llama-3.3-70b-versatile");
  const [aiKey, setAiKey] = useState("");
  const [aiQuantity, setAiQuantity] = useState(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiPhrases, setAiPhrases] = useState<string[]>([]);
  const [selectedPhrases, setSelectedPhrases] = useState<Set<number>>(new Set());
  const [aiError, setAiError] = useState("");
  
  // UI State
  const [activeTab, setActiveTab] = useState<"content" | "style" | "ai">("content");
  const [isDownloading, setIsDownloading] = useState(false);
  const [isDownloadingAll, setIsDownloadingAll] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState({ current: 0, total: 0 });
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setBgImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const setRandomQuote = () => {
    const idx = Math.floor(Math.random() * QUOTES.length);
    setQuote(QUOTES[idx]);
  };

  const getPrompt = (qty: number) => `Crie exatamente ${qty} frases motivacionais curtas, impactantes e 100% originais em português brasileiro (máximo 12 palavras cada).
Regras obrigatórias:
- Tom positivo, empoderador, direto e inspirador
- NUNCA repetir ideias
- Cada frase deve ser única e forte
- Formato de saída EXATO:
FRASE 1: Sua frase motivacional aqui
FRASE 2: Outra frase diferente
... até FRASE ${qty}`;

  const generateAIPhrases = async () => {
    if (!aiKey.trim()) {
      setAiError("Por favor, insira sua API Key.");
      return;
    }
    
    setIsGenerating(true);
    setAiError("");
    
    try {
      let endpoint, headers, body, responseTextPath;

      if (aiProvider === 'groq' || aiProvider === 'mistral') {
        endpoint = aiProvider === 'groq'
          ? 'https://api.groq.com/openai/v1/chat/completions'
          : 'https://api.mistral.ai/v1/chat/completions';

        headers = {
          'Authorization': `Bearer ${aiKey}`,
          'Content-Type': 'application/json'
        };

        body = {
          model: aiModel,
          messages: [{ role: 'user', content: getPrompt(aiQuantity) }],
          temperature: 0.85,
          max_tokens: 1800
        };

        responseTextPath = (data: any) => data.choices?.[0]?.message?.content || '';
      } else if (aiProvider === 'gemini') {
        endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${aiModel}:generateContent?key=${aiKey}`;
        headers = { 'Content-Type': 'application/json' };
        body = { contents: [{ parts: [{ text: getPrompt(aiQuantity) }] }] };
        responseTextPath = (data: any) => data.candidates?.[0]?.content?.parts?.[0]?.text || '';
      }

      const res = await fetch(endpoint as string, {
        method: 'POST',
        headers: headers as any,
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`HTTP ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const text = responseTextPath(data).trim();
      
      const phrases = text.split(/FRASE \d+:/i)
        .map((p: string) => p.replace(/@\w+/g, '').trim())
        .filter((p: string) => p.length > 5);
        
      if (phrases.length === 0) {
        throw new Error("Não foi possível extrair as frases da resposta.");
      }
      
      setAiPhrases(phrases);
      setSelectedPhrases(new Set());
    } catch (err: any) {
      setAiError(err.message || "Erro ao gerar frases. Verifique sua chave e conexão.");
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadSelectedAsZip = async () => {
    const phrasesToDownload = selectedPhrases.size > 0 
      ? aiPhrases.filter((_, i) => selectedPhrases.has(i))
      : aiPhrases;

    if (!previewRef.current || phrasesToDownload.length === 0) return;
    
    setIsDownloadingAll(true);
    const originalQuote = quote;
    
    try {
      if (phrasesToDownload.length === 1) {
        setQuote(phrasesToDownload[0]);
        await new Promise(resolve => setTimeout(resolve, 500));
        const canvas = await html2canvas(previewRef.current, {
          scale: 3,
          useCORS: true,
          allowTaint: true,
          backgroundColor: cardStyle === 'transparent' ? null : undefined,
        });
        const link = document.createElement('a');
        link.download = `card-motivacional-${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
      } else {
        const zip = new JSZip();
        for (let i = 0; i < phrasesToDownload.length; i++) {
          setDownloadProgress({ current: i + 1, total: phrasesToDownload.length });
          setQuote(phrasesToDownload[i]);
          
          // Wait for React to render the new quote and fonts to settle
          await new Promise(resolve => setTimeout(resolve, 500));
          
          const canvas = await html2canvas(previewRef.current, {
            scale: 3, // High quality
            useCORS: true,
            allowTaint: true,
            backgroundColor: cardStyle === 'transparent' ? null : undefined,
          });
          
          const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/png'));
          if (blob) {
            zip.file(`card-motivacional-${i + 1}.png`, blob);
          }
        }
        
        setDownloadProgress({ current: phrasesToDownload.length, total: phrasesToDownload.length });
        const zipContent = await zip.generateAsync({ type: 'blob' });
        saveAs(zipContent, `cards-motivacionais-${Date.now()}.zip`);
      }
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao gerar download em massa:", err);
      alert("Ocorreu um erro ao gerar o download.");
    } finally {
      setQuote(originalQuote);
      setIsDownloadingAll(false);
      setDownloadProgress({ current: 0, total: 0 });
    }
  };

  const downloadCard = async () => {
    if (!previewRef.current) return;
    
    setIsDownloading(true);
    try {
      // Temporarily remove border radius for clean download if needed, 
      // but html2canvas handles it okay usually.
      const canvas = await html2canvas(previewRef.current, {
        scale: 3, // High quality
        useCORS: true,
        allowTaint: true,
        backgroundColor: cardStyle === 'transparent' ? null : undefined,
      });
      
      const link = document.createElement('a');
      link.download = `card-motivacional-${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000);
    } catch (err) {
      console.error("Erro ao baixar:", err);
      alert("Ocorreu um erro ao gerar a imagem.");
    } finally {
      setIsDownloading(false);
    }
  };

  // Dynamic Styles for Preview
  const getPreviewContainerStyle = () => {
    const baseStyle: React.CSSProperties = {
      width: `${FORMATS[format].w}px`,
      height: `${FORMATS[format].h}px`,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      transition: 'all 0.3s ease',
      backgroundColor: cardBgColor, // Use state instead of hardcoded zinc-900
      color: '#ffffff', // Force hex color to prevent oklch inheritance
    };

    switch (cardStyle) {
      case 'bordered':
        baseStyle.border = '8px solid #6366f1';
        baseStyle.borderRadius = '24px';
        break;
      case 'gradient-purple':
        baseStyle.background = 'linear-gradient(135deg, #a78bfa, #7c3aed)';
        break;
      case 'gradient-sunset':
        baseStyle.background = 'linear-gradient(135deg, #ff5f6d, #ffc371)';
        break;
      case 'gradient-ocean':
        baseStyle.background = 'linear-gradient(135deg, #2193b0, #6dd5ed)';
        break;
      case 'gradient-forest':
        baseStyle.background = 'linear-gradient(135deg, #11998e, #38ef7d)';
        break;
      case 'glass':
        baseStyle.background = 'rgba(255, 255, 255, 0.1)';
        baseStyle.backdropFilter = 'blur(12px)';
        baseStyle.border = '1px solid rgba(255, 255, 255, 0.2)';
        baseStyle.borderRadius = '24px';
        break;
      case 'shadow':
        baseStyle.boxShadow = 'inset 0 0 100px rgba(0,0,0,0.8)';
        break;
      case 'ornamental':
        baseStyle.border = 'double 8px #f59e0b';
        baseStyle.borderRadius = '32px';
        break;
      case 'geometric':
        baseStyle.background = 'repeating-linear-gradient(45deg, #1e293b, #1e293b 20px, #334155 20px, #334155 40px)';
        break;
      case 'transparent':
        baseStyle.backgroundColor = 'transparent';
        break;
      default:
        baseStyle.border = '2px solid #3f3f46';
        break;
    }

    return baseStyle;
  };

  const getQuoteContainerStyle = (): React.CSSProperties => {
    const hasBorder = textBorderWidth > 0;
    return {
      textAlign: textAlign,
      position: 'relative',
      zIndex: 10,
      width: '100%',
      margin: 'auto 0',
      border: hasBorder ? `${textBorderWidth}px ${textBorderStyle} ${textBorderColor}` : undefined,
      padding: hasBorder ? '24px' : '0',
      borderRadius: hasBorder ? '16px' : '0',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
    };
  };

  const getQuoteTextStyle = (): React.CSSProperties => {
    const style: React.CSSProperties = {
      fontFamily: font,
      fontSize: `${fontSize}px`,
      lineHeight: 1.3,
      textShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`,
      display: 'inline-block',
    };

    if (gradient !== 'none') {
      style.backgroundImage = gradient;
      style.WebkitBackgroundClip = 'text';
      style.WebkitTextFillColor = 'transparent';
      style.color = 'transparent';
      // Fallback for html2canvas which sometimes struggles with background-clip: text
      // We ensure the background is ONLY on the text span
    } else {
      style.color = textColor;
    }

    return style;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col lg:flex-row font-sans">
      
      {/* Sidebar Controls */}
      <aside className="w-full lg:w-[420px] bg-zinc-900/80 backdrop-blur-xl border-r border-zinc-800 flex flex-col h-screen overflow-hidden shrink-0 z-20 shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent flex items-center gap-2">
            <Sparkles className="text-indigo-400" size={24} />
            CardGen Pro
          </h1>
          <p className="text-sm text-zinc-400 mt-1">Crie cards virais em segundos</p>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-zinc-800 bg-zinc-900/50">
          <button 
            onClick={() => setActiveTab('content')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'content' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Type size={16} /> Conteúdo
          </button>
          <button 
            onClick={() => setActiveTab('style')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'style' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Palette size={16} /> Estilo
          </button>
          <button 
            onClick={() => setActiveTab('ai')}
            className={`flex-1 py-3 text-sm font-medium flex justify-center items-center gap-2 transition-colors ${activeTab === 'ai' ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5' : 'text-zinc-400 hover:text-zinc-200'}`}
          >
            <Wand2 size={16} /> IA
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
          
          {/* CONTENT TAB */}
          {activeTab === 'content' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium text-zinc-300">Frase Motivacional</label>
                  <button onClick={setRandomQuote} className="text-xs text-indigo-400 hover:text-indigo-300 flex items-center gap-1">
                    <RefreshCw size={12} /> Aleatória
                  </button>
                </div>
                <textarea 
                  value={quote}
                  onChange={(e) => setQuote(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-none h-24"
                  placeholder="Digite sua frase aqui..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Nome de Usuário (@)</label>
                <input 
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                  placeholder="@seuusuario"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-300">Imagem de Fundo</label>
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                  />
                  <div className="w-full bg-zinc-950 border border-zinc-800 border-dashed rounded-xl p-4 flex flex-col items-center justify-center gap-2 text-zinc-400 hover:text-indigo-400 hover:border-indigo-500/50 transition-colors">
                    <Upload size={24} />
                    <span className="text-sm">Clique ou arraste uma imagem</span>
                  </div>
                </div>
                {bgImage && (
                  <button onClick={() => setBgImage(null)} className="text-xs text-red-400 hover:text-red-300 mt-2">
                    Remover imagem
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STYLE TAB */}
          {activeTab === 'style' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              
              {/* Format & Card Style */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Formato</label>
                  <select 
                    value={format} 
                    onChange={(e) => setFormat(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    {Object.entries(FORMATS).map(([val, {label}]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Estilo do Card</label>
                  <select 
                    value={cardStyle} 
                    onChange={(e) => setCardStyle(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    {CARD_STYLES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-zinc-400">Cor do Fundo</label>
                <div className="flex gap-2">
                  <input 
                    type="color" 
                    value={cardBgColor} 
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-zinc-950 border border-zinc-800 p-1 shrink-0"
                  />
                  <input 
                    type="text" 
                    value={cardBgColor} 
                    onChange={(e) => setCardBgColor(e.target.value)}
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500 uppercase"
                  />
                </div>
              </div>

              <hr className="border-zinc-800" />

              {/* Typography */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><Type size={16}/> Tipografia</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Fonte</label>
                    <select 
                      value={font} 
                      onChange={(e) => setFont(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                    >
                      {FONTS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Tamanho: {fontSize}px</label>
                    <input 
                      type="range" min="16" max="80" 
                      value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))}
                      className="w-full accent-indigo-500 mt-2"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Cor do Texto</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer bg-zinc-950 border border-zinc-800 p-1"
                      />
                      <input 
                        type="text" 
                        value={textColor} 
                        onChange={(e) => setTextColor(e.target.value)}
                        className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-sm outline-none focus:border-indigo-500 uppercase"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Alinhamento</label>
                    <div className="flex bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden">
                      <button onClick={() => setTextAlign('left')} className={`flex-1 py-2 flex justify-center ${textAlign === 'left' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-800'}`}><AlignLeft size={16}/></button>
                      <button onClick={() => setTextAlign('center')} className={`flex-1 py-2 flex justify-center border-x border-zinc-800 ${textAlign === 'center' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-800'}`}><AlignCenter size={16}/></button>
                      <button onClick={() => setTextAlign('right')} className={`flex-1 py-2 flex justify-center ${textAlign === 'right' ? 'bg-indigo-500/20 text-indigo-400' : 'text-zinc-400 hover:bg-zinc-800'}`}><AlignRight size={16}/></button>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Gradiente no Texto</label>
                  <select 
                    value={gradient} 
                    onChange={(e) => setGradient(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                  >
                    {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>

                <div className="space-y-4 pt-2">
                  <h4 className="text-xs font-semibold text-zinc-300">Borda da Citação</h4>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Espessura: {textBorderWidth}px</label>
                      <input 
                        type="range" min="0" max="20" 
                        value={textBorderWidth} onChange={(e) => setTextBorderWidth(Number(e.target.value))}
                        className="w-full accent-indigo-500 mt-2"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Estilo</label>
                      <select 
                        value={textBorderStyle} 
                        onChange={(e) => setTextBorderStyle(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                      >
                        <option value="solid">Sólida</option>
                        <option value="dashed">Tracejada</option>
                        <option value="dotted">Pontilhada</option>
                        <option value="double">Dupla</option>
                      </select>
                    </div>

                    <div className="space-y-2">
                      <label className="text-xs font-medium text-zinc-400">Cor</label>
                      <div className="flex gap-2">
                        <input 
                          type="color" 
                          value={textBorderColor} 
                          onChange={(e) => setTextBorderColor(e.target.value)}
                          className="w-10 h-10 rounded cursor-pointer bg-zinc-950 border border-zinc-800 p-1"
                        />
                        <input 
                          type="text" 
                          value={textBorderColor} 
                          onChange={(e) => setTextBorderColor(e.target.value)}
                          className="flex-1 w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2 text-xs outline-none focus:border-indigo-500 uppercase"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <hr className="border-zinc-800" />

              {/* Shadow & Effects */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><ImageIcon size={16}/> Efeitos</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Filtro da Imagem</label>
                    <select 
                      value={imageFilter} 
                      onChange={(e) => setImageFilter(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                    >
                      {IMAGE_FILTERS.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Cor da Sombra</label>
                    <div className="flex gap-2">
                      <input 
                        type="color" 
                        value={shadowColor} 
                        onChange={(e) => setShadowColor(e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer bg-zinc-950 border border-zinc-800 p-1"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Sombra X: {shadowX}</label>
                    <input type="range" min="-20" max="20" value={shadowX} onChange={(e) => setShadowX(Number(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Sombra Y: {shadowY}</label>
                    <input type="range" min="-20" max="20" value={shadowY} onChange={(e) => setShadowY(Number(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Desfoque: {shadowBlur}</label>
                    <input type="range" min="0" max="40" value={shadowBlur} onChange={(e) => setShadowBlur(Number(e.target.value))} className="w-full accent-indigo-500" />
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* AI TAB */}
          {activeTab === 'ai' && (
            <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
              <div className="bg-indigo-500/10 border border-indigo-500/20 rounded-xl p-4 text-sm text-indigo-200">
                Gere dezenas de frases originais e impactantes usando os melhores modelos de IA do mercado.
              </div>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Provedor</label>
                    <select 
                      value={aiProvider} 
                      onChange={(e) => {
                        setAiProvider(e.target.value);
                        setAiModel(AI_MODELS[e.target.value][0].value);
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                    >
                      <option value="groq">Groq (Rápido)</option>
                      <option value="mistral">Mistral</option>
                      <option value="gemini">Google Gemini</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-medium text-zinc-400">Modelo</label>
                    <select 
                      value={aiModel} 
                      onChange={(e) => setAiModel(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm outline-none focus:border-indigo-500"
                    >
                      {AI_MODELS[aiProvider].map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">API Key ({aiProvider})</label>
                  <input 
                    type="password"
                    value={aiKey}
                    onChange={(e) => setAiKey(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                    placeholder={`Insira sua chave da ${aiProvider}`}
                  />
                  <p className="text-[10px] text-zinc-500">Sua chave não é salva e é usada apenas para esta requisição.</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-400">Quantidade: {aiQuantity}</label>
                  <input 
                    type="range" min="1" max="20" 
                    value={aiQuantity} onChange={(e) => setAiQuantity(Number(e.target.value))}
                    className="w-full accent-indigo-500"
                  />
                </div>

                <button 
                  onClick={generateAIPhrases}
                  disabled={isGenerating}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 disabled:bg-zinc-800 disabled:text-zinc-500 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-all"
                >
                  {isGenerating ? (
                    <><RefreshCw size={18} className="animate-spin" /> Gerando...</>
                  ) : (
                    <><Wand2 size={18} /> Gerar Frases</>
                  )}
                </button>

                {aiError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-2 text-red-400 text-sm">
                    <AlertCircle size={16} className="shrink-0 mt-0.5" />
                    <p>{aiError}</p>
                  </div>
                )}
              </div>

              {aiPhrases.length > 0 && (
                <div className="space-y-3 mt-6">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-zinc-200">Resultados ({aiPhrases.length})</h3>
                      <button
                        onClick={() => {
                          if (selectedPhrases.size === aiPhrases.length) {
                            setSelectedPhrases(new Set());
                          } else {
                            setSelectedPhrases(new Set(aiPhrases.map((_, i) => i)));
                          }
                        }}
                        className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
                      >
                        {selectedPhrases.size === aiPhrases.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                      </button>
                    </div>
                    <button 
                      onClick={downloadSelectedAsZip}
                      disabled={isDownloadingAll}
                      className="text-xs bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-500 text-white px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                    >
                      {isDownloadingAll ? (
                        <><RefreshCw size={12} className="animate-spin" /> {downloadProgress.current}/{downloadProgress.total}</>
                      ) : (
                        <><Download size={12} /> {selectedPhrases.size > 0 ? `Baixar Selecionados (${selectedPhrases.size})` : 'Baixar Todos (ZIP)'}</>
                      )}
                    </button>
                  </div>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
                    {aiPhrases.map((phrase, i) => (
                      <div 
                        key={i}
                        onClick={() => !isDownloadingAll && setQuote(phrase)}
                        className={`p-3 flex gap-3 bg-zinc-950 border ${selectedPhrases.has(i) ? 'border-indigo-500/50' : 'border-zinc-800'} rounded-lg text-sm transition-colors group ${isDownloadingAll ? 'opacity-50 cursor-not-allowed' : 'hover:border-indigo-500/50 cursor-pointer'}`}
                      >
                        <div className="pt-0.5">
                          <input 
                            type="checkbox" 
                            checked={selectedPhrases.has(i)}
                            onChange={() => {}}
                            onClick={(e) => {
                              e.stopPropagation();
                              const newSet = new Set(selectedPhrases);
                              if (newSet.has(i)) newSet.delete(i);
                              else newSet.add(i);
                              setSelectedPhrases(newSet);
                            }}
                            className="w-4 h-4 rounded border-zinc-700 text-indigo-500 focus:ring-indigo-500 bg-zinc-900 cursor-pointer"
                          />
                        </div>
                        <p className={isDownloadingAll ? '' : 'group-hover:text-indigo-300 transition-colors'}>{phrase}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </aside>

      {/* Main Preview Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 bg-zinc-950 relative overflow-hidden min-h-[600px]">
        {/* Decorative Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[100px]"></div>
        </div>

        {/* Preview Wrapper with scaling for smaller screens */}
        <div className="relative z-10 flex flex-col items-center w-full max-w-full overflow-hidden">
          
          <div className="mb-6 text-center">
            <h2 className="text-xl font-semibold text-zinc-200">Pré-visualização</h2>
            <p className="text-sm text-zinc-500">{FORMATS[format].label}</p>
          </div>

          {/* The actual card to capture */}
          <div 
            className="shadow-2xl ring-1 ring-white/10"
            style={{
              // Scale down on small screens if needed, but keep aspect ratio
              transformOrigin: 'top center',
              transform: typeof window !== 'undefined' && window.innerWidth < FORMATS[format].w + 40 
                ? `scale(${(window.innerWidth - 40) / FORMATS[format].w})` 
                : 'scale(1)',
              marginBottom: typeof window !== 'undefined' && window.innerWidth < FORMATS[format].w + 40 
                ? `-${FORMATS[format].h * (1 - (window.innerWidth - 40) / FORMATS[format].w)}px`
                : '0'
            }}
          >
            <div 
              ref={previewRef} 
              style={getPreviewContainerStyle()}
            >
              {/* Background Image */}
              {bgImage && (
                <img 
                  src={bgImage} 
                  alt="Background" 
                  className="absolute inset-0 w-full h-full object-cover z-0"
                  style={{ filter: imageFilter }}
                  crossOrigin="anonymous"
                />
              )}
              
              {/* Dark overlay if image is present to make text readable */}
              {bgImage && (
                <div 
                  className="absolute inset-0 z-0"
                  style={{ backgroundColor: 'rgba(0,0,0,0.2)' }}
                ></div>
              )}

              {/* Quote */}
              <div style={getQuoteContainerStyle()}>
                <span style={getQuoteTextStyle()}>
                  {quote || "Sua frase aparecerá aqui"}
                </span>
              </div>

              {/* Handle */}
              {handle && (
                <div 
                  className="absolute bottom-6 left-0 w-full text-center z-10 px-4"
                  style={{
                    fontFamily: font,
                    fontSize: `${Math.max(12, Math.round(fontSize * 0.5))}px`,
                    color: gradient === 'none' ? textColor : '#ffffff',
                    textShadow: `${shadowX}px ${shadowY}px ${shadowBlur}px ${shadowColor}`,
                    background: bgImage ? 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' : 'none',
                    paddingTop: bgImage ? '24px' : '0',
                    paddingBottom: bgImage ? '12px' : '0',
                    bottom: bgImage ? '0' : '24px'
                  }}
                >
                  {handle}
                </div>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center">
            <button 
              onClick={downloadCard} 
              disabled={isDownloading || isDownloadingAll}
              className={`px-8 py-3.5 rounded-full font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/25 ${
                downloadSuccess 
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white' 
                  : (isDownloading || isDownloadingAll) ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-500 text-white hover:scale-105 active:scale-95'
              }`}
            >
              {(isDownloading || isDownloadingAll) ? (
                <><RefreshCw size={20} className="animate-spin" /> Processando...</>
              ) : downloadSuccess ? (
                <><CheckCircle2 size={20} /> Salvo com sucesso!</>
              ) : (
                <><Download size={20} /> Baixar Imagem em Alta Qualidade</>
              )}
            </button>
            <p className="text-xs text-zinc-500 mt-3">A imagem será baixada no formato selecionado.</p>
          </div>

        </div>
      </main>

      {/* Custom scrollbar styles */}
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #3f3f46;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #52525b;
        }
      `}} />
    </div>
  );
}
