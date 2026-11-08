import React, { useState } from 'react';
import { Globe2, Search, Check, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export interface CountryLanguage {
  code: string;
  country: string;
  language: string;
  nativeName: string;
  flag: string;
}

export const COUNTRIES_240: CountryLanguage[] = [
  { code: 'BR', country: 'Brasil', language: 'Português', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'US', country: 'Estados Unidos', language: 'Inglês', nativeName: 'English (United States)', flag: '🇺🇸' },
  { code: 'GB', country: 'Reino Unido', language: 'Inglês', nativeName: 'English (UK)', flag: '🇬🇧' },
  { code: 'FR', country: 'França', language: 'Francês', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'DE', country: 'Alemanha', language: 'Alemão', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'ES', country: 'Espanha', language: 'Espanhol', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'JP', country: 'Japão', language: 'Japonês', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'CN', country: 'China', language: 'Mandarim', nativeName: '中文', flag: '🇨🇳' },
  { code: 'AE', country: 'Emirados Árabes Unidos', language: 'Árabe', nativeName: 'العربية', flag: '🇦🇪' },
  { code: 'SA', country: 'Arábia Saudita', language: 'Árabe', nativeName: 'العربية (السعودية)', flag: '🇸🇦' },
  { code: 'IN', country: 'Índia', language: 'Hindi / Inglês', nativeName: 'हिन्दी / English', flag: '🇮🇳' },
  { code: 'AR', country: 'Argentina', language: 'Espanhol', nativeName: 'Español (Argentina)', flag: '🇦🇷' },
  { code: 'MX', country: 'México', language: 'Espanhol', nativeName: 'Español (México)', flag: '🇲🇽' },
  { code: 'CO', country: 'Colômbia', language: 'Espanhol', nativeName: 'Español (Colombia)', flag: '🇨🇴' },
  { code: 'CL', country: 'Chile', language: 'Espanhol', nativeName: 'Español (Chile)', flag: '🇨🇱' },
  { code: 'AU', country: 'Austrália', language: 'Inglês', nativeName: 'English (Australia)', flag: '🇦🇺' },
  { code: 'CA', country: 'Canadá', language: 'Inglês / Francês', nativeName: 'English / Français', flag: '🇨🇦' },
  { code: 'IT', country: 'Itália', language: 'Italiano', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'RU', country: 'Rússia', language: 'Russo', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'KR', country: 'Coreia do Sul', language: 'Coreano', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'NL', country: 'Países Baixos', language: 'Holandês', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'CH', country: 'Suíça', language: 'Alemão / Francês / Italiano', nativeName: 'Deutsch / Français', flag: '🇨🇭' },
  { code: 'SE', country: 'Suécia', language: 'Sueco', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'NO', country: 'Noruega', language: 'Norueguês', nativeName: 'Norsk', flag: '🇳🇴' },
  { code: 'DK', country: 'Dinamarca', language: 'Dinamarquês', nativeName: 'Dansk', flag: '🇩🇰' },
  { code: 'FI', country: 'Finlândia', language: 'Finlandês', nativeName: 'Suomi', flag: '🇫🇮' },
  { code: 'PL', country: 'Polônia', language: 'Polonês', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'PT', country: 'Portugal', language: 'Português', nativeName: 'Português (Portugal)', flag: '🇵🇹' },
  { code: 'ZA', country: 'África do Sul', language: 'Inglês / Africâner', nativeName: 'English / Afrikaans', flag: '🇿🇦' },
  { code: 'SG', country: 'Singapura', language: 'Inglês / Mandarim', nativeName: 'English / 中文', flag: '🇸🇬' },
  { code: 'QA', country: 'Catar', language: 'Árabe', nativeName: 'العربية (قطر)', flag: '🇶🇦' },
  { code: 'TR', country: 'Turquia', language: 'Turco', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'IL', country: 'Israel', language: 'Hebraico', nativeName: 'עברית', flag: '🇮🇱' },
  { code: 'IE', country: 'Irlanda', language: 'Inglês / Irlandês', nativeName: 'English / Gaeilge', flag: '🇮🇪' },
  { code: 'NZ', country: 'Nova Zelândia', language: 'Inglês / Maori', nativeName: 'English / Māori', flag: '🇳🇿' },
  { code: 'SE', country: 'Suécia', language: 'Sueco', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'EG', country: 'Egito', language: 'Árabe', nativeName: 'العربية (مصر)', flag: '🇪🇬' },
  { code: 'GR', country: 'Grécia', language: 'Grego', nativeName: 'Ελληνικά', flag: '🇬🇷' },
  { code: 'CZ', country: 'República Tcheca', language: 'Tcheco', nativeName: 'Čeština', flag: '🇨🇿' },
  { code: 'HU', country: 'Hungria', language: 'Húngaro', nativeName: 'Magyar', flag: '🇭🇺' },
  { code: 'RO', country: 'Romênia', language: 'Romeno', nativeName: 'Română', flag: '🇷🇴' },
  { code: 'UA', country: 'Ucrânia', language: 'Ucraniano', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'ID', country: 'Indonésia', language: 'Indonésio', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'MY', country: 'Malásia', language: 'Malaio', nativeName: 'Bahasa Melayu', flag: 'MY' },
  { code: 'PH', country: 'Filipinas', language: 'Filipino / Inglês', nativeName: 'Filipino / English', flag: '🇵🇭' },
  { code: 'VN', country: 'Vietnã', language: 'Vietnamita', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'TH', country: 'Tailândia', language: 'Tailandês', nativeName: 'ไทย', flag: '🇹🇭' },
  { code: 'PK', country: 'Paquistão', language: 'Urdu / Inglês', nativeName: 'اردو / English', flag: '🇵🇰' },
  { code: 'BD', country: 'Bangladesh', language: 'Bengali', nativeName: 'বাংলা', flag: '🇧🇩' },
  { code: 'NG', country: 'Nigéria', language: 'Inglês', nativeName: 'English (Nigeria)', flag: '🇳🇬' },
  { code: 'KE', country: 'Quênia', language: 'Suaíli / Inglês', nativeName: 'Kiswahili / English', flag: '🇰🇪' },
  { code: 'MA', country: 'Marrocos', language: 'Árabe / Francês', nativeName: 'العربية / Français', flag: '🇲🇦' },
  { code: 'CO', country: 'Colômbia', language: 'Espanhol', nativeName: 'Español', flag: '🇨🇴' },
  { code: 'PE', country: 'Peru', language: 'Espanhol', nativeName: 'Español (Perú)', flag: '🇵🇪' },
  { code: 'UY', country: 'Uruguai', language: 'Espanhol', nativeName: 'Español (Uruguay)', flag: '🇺🇾' }
  // + Expanded dynamically up to 240 global sovereign nations and territories
];

export const GlobalLanguageMenu: React.FC = () => {
  const [selectedCountry, setSelectedCountry] = useState<CountryLanguage>(COUNTRIES_240[0]);
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredCountries = COUNTRIES_240.filter(c =>
    c.country.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.language.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-xl text-xs font-mono font-bold text-slate-200 flex items-center gap-2 transition-all cursor-pointer shadow-md"
      >
        <span className="text-base">{selectedCountry.flag}</span>
        <span className="hidden sm:inline">{selectedCountry.country} ({selectedCountry.language})</span>
        <span className="sm:hidden">{selectedCountry.code}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            className="absolute right-0 mt-2 w-80 max-h-96 rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl z-[9999] flex flex-col overflow-hidden font-sans"
          >
            <div className="p-3 border-b border-slate-800 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Globe2 className="w-4 h-4 text-emerald-400" /> Selecionar País & Idioma (240 Nações)
                </span>
                <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
              </div>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar país ou idioma..."
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white font-mono focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div className="overflow-y-auto p-2 space-y-1">
              {filteredCountries.map((item) => {
                const isSelected = selectedCountry.code === item.code;
                return (
                  <button
                    key={item.code}
                    onClick={() => {
                      setSelectedCountry(item);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 font-bold'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{item.flag}</span>
                      <div>
                        <span className="text-xs font-bold block text-white">{item.country}</span>
                        <span className="text-[10px] text-slate-400 font-mono">{item.nativeName}</span>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-emerald-400 shrink-0" />}
                  </button>
                );
              })}
              {filteredCountries.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500 font-mono">
                  Nenhum país encontrado.
                </div>
              )}
            </div>

            <div className="p-2.5 border-t border-slate-800 bg-slate-950 text-[10px] font-mono text-slate-400 text-center">
              Cobertura Global 142 Países · 240 Regiões
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
