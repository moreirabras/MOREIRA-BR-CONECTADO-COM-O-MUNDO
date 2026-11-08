import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import {
  Flame,
  DollarSign,
  ArrowUpRight,
  Clock,
  CheckCircle2,
  Filter,
  RefreshCw,
  Building2,
  ShieldCheck,
  Zap,
  Sparkles,
  QrCode
} from 'lucide-react';

interface HeatmapDataPoint {
  day: string;
  dayIndex: number;
  timeSlot: string;
  timeIndex: number;
  inflowBRL: number;
  liquidityAvailableBRL: number;
  payoutStatus: 'DISPONIVEL_D0' | 'PROCESSANDO_BACEN' | 'AGUARDANDO_CICLO';
  primaryChannel: string;
}

const DAYS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];
const TIME_SLOTS = ['00h-03h', '03h-06h', '06h-09h', '09h-12h', '12h-15h', '15h-18h', '18h-21h', '21h-24h'];

const generateLiquidityData = (): HeatmapDataPoint[] => {
  const points: HeatmapDataPoint[] = [];

  DAYS.forEach((day, dIdx) => {
    TIME_SLOTS.forEach((slot, tIdx) => {
      // Simulate higher volume during business hours (09h-18h)
      const isPeak = tIdx >= 3 && tIdx <= 5 && dIdx < 5;
      const baseInflow = isPeak ? 180000 + Math.random() * 220000 : 35000 + Math.random() * 75000;
      const liquidity = baseInflow * 0.985; // 98.5% net liquidity after fees

      const channels = ['Pix Direct MP (+5573998599213)', 'Cartão Mercado Pago', 'Boleto Asaas CIP', 'Câmbio SWIFT UAE'];
      const channel = isPeak ? channels[0] : channels[dIdx % channels.length];

      points.push({
        day,
        dayIndex: dIdx,
        timeSlot: slot,
        timeIndex: tIdx,
        inflowBRL: Math.round(baseInflow),
        liquidityAvailableBRL: Math.round(liquidity),
        payoutStatus: 'DISPONIVEL_D0',
        primaryChannel: channel,
      });
    });
  });

  return points;
};

export const LiquidityHeatmapD3: React.FC = () => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [data, setData] = useState<HeatmapDataPoint[]>(generateLiquidityData);
  const [channelFilter, setChannelFilter] = useState<string>('TODOS');
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);
  const [payoutMessage, setPayoutMessage] = useState<string | null>(null);
  const [isProcessingPayout, setIsProcessingPayout] = useState(false);

  const formatBRL = (val: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      maximumFractionDigits: 0
    }).format(val);
  };

  const handleRefreshData = () => {
    setData(generateLiquidityData());
  };

  const handleSimulatePayout = () => {
    setIsProcessingPayout(true);
    setPayoutMessage(null);
    setTimeout(() => {
      setIsProcessingPayout(false);
      setPayoutMessage('✅ Solicitação de Saque Instantâneo Mercado Pago efetuada! R$ 142.850.400,00 liquidados via Pix (+5573998599213 - CNPJ 68.603.032/0001-15).');
    }, 1200);
  };

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous SVG contents
    d3.select(svgRef.current).selectAll('*').remove();

    const containerWidth = containerRef.current.clientWidth || 800;
    const margin = { top: 30, right: 30, bottom: 50, left: 80 };
    const width = containerWidth - margin.left - margin.right;
    const height = 320 - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', containerWidth)
      .attr('height', height + margin.top + margin.bottom)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X scale (Time Slots)
    const x = d3.scaleBand()
      .range([0, width])
      .domain(TIME_SLOTS)
      .padding(0.08);

    // Y scale (Days)
    const y = d3.scaleBand()
      .range([0, height])
      .domain(DAYS)
      .padding(0.08);

    // Filter data based on selected channel
    const filteredData = channelFilter === 'TODOS'
      ? data
      : data.filter(d => d.primaryChannel.toLowerCase().includes(channelFilter.toLowerCase()));

    // Color scale: Emerald gradient for liquidity
    const maxVal = d3.max(data, d => d.liquidityAvailableBRL) || 400000;
    const colorScale = d3.scaleSequential()
      .interpolator(d3.interpolateRgb('#022c22', '#34d399'))
      .domain([20000, maxVal]);

    // Draw X Axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(x).tickSize(0))
      .select('.domain').remove();

    svg.selectAll('.tick text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'monospace')
      .attr('dy', '15');

    // Draw Y Axis
    svg.append('g')
      .call(d3.axisLeft(y).tickSize(0))
      .select('.domain').remove();

    svg.selectAll('g.tick text')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', 'bold');

    // Draw Heatmap Cells
    svg.selectAll('rect.heatmap-cell')
      .data(filteredData)
      .enter()
      .append('rect')
      .attr('class', 'heatmap-cell')
      .attr('x', d => x(d.timeSlot) || 0)
      .attr('y', d => y(d.day) || 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('width', x.bandwidth())
      .attr('height', y.bandwidth())
      .style('fill', d => colorScale(d.liquidityAvailableBRL))
      .style('stroke', '#0f172a')
      .style('stroke-width', '2px')
      .style('cursor', 'pointer')
      .style('opacity', 0.9)
      .on('mouseover', function (_event, d) {
        d3.select(this)
          .style('stroke', '#10b981')
          .style('stroke-width', '3px')
          .style('opacity', 1);
        setHoveredCell(d);
      })
      .on('mouseout', function () {
        d3.select(this)
          .style('stroke', '#0f172a')
          .style('stroke-width', '2px')
          .style('opacity', 0.9);
      });

  }, [data, channelFilter]);

  return (
    <div className="space-y-6">
      {/* Header Banner - D3 Liquidity Heatmap */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/70 to-slate-900 border border-emerald-500/40 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-400" /> MAPA DE CALOR D3.JS
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 text-sky-300 border border-sky-500/30">
                JANELAS D+0 MERCADO PAGO
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-500/15 text-purple-300 border border-purple-500/30">
                CNPJ 68.603.032/0001-15
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
              <Flame className="w-7 h-7 text-amber-400" />
              Mapa de Calor de Liquidez Diária & Janelas de Saque Mercado Pago
            </h2>
            <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
              Visualização vetorial D3.js das janelas de pico de disponibilidade de saque instantâneo no Mercado Pago (Agência 0001, Conta 8731119479-4, Chave Pix +5573998599213) correlacionadas aos ciclos globais de entrada de capital.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleRefreshData}
              className="p-2.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-slate-300 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Recalcular heatmap D3"
            >
              <RefreshCw className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline text-[11px] font-mono">Atualizar D3</span>
            </button>

            <button
              type="button"
              onClick={handleSimulatePayout}
              disabled={isProcessingPayout}
              className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-emerald-500/20 cursor-pointer"
            >
              <Zap className={`w-4 h-4 ${isProcessingPayout ? 'animate-spin' : ''}`} />
              <span>{isProcessingPayout ? 'Liquidando Pix MP...' : 'Saque Instantâneo D+0 MP'}</span>
            </button>
          </div>
        </div>

        {/* 4 Summary Cards for Mercado Pago Liquidity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">Saldo Disponível para Saque MP</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-mono font-black text-emerald-400">R$ 142.850.400,00</p>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Liberado D+0 Sem Retenções</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">Conta Mercado Pago Titular</span>
              <Building2 className="w-4 h-4 text-sky-400" />
            </div>
            <p className="text-sm font-mono font-black text-white">Ag 0001 · CC 8731119479-4</p>
            <div className="flex items-center gap-1 text-[11px] text-sky-300 font-mono">
              <span>Chave Pix: +5573998599213</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">Próxima Janela de Liquidação</span>
              <Clock className="w-4 h-4 text-amber-400" />
            </div>
            <p className="text-xl font-mono font-black text-amber-300">EM EXECUÇÃO</p>
            <div className="flex items-center gap-1 text-[11px] text-amber-400 font-mono">
              <span>Janela 12h-15h (Pico de Liquidez)</span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 space-y-1">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[10px] font-mono uppercase tracking-wider">SLA de Repasse Pix MP</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <p className="text-2xl font-mono font-black text-purple-300">100.0% D+0</p>
            <div className="flex items-center gap-1 text-[11px] text-purple-400 font-mono">
              <span>Transferência 24/7/365</span>
            </div>
          </div>
        </div>
      </div>

      {/* Payout Toast Notification */}
      {payoutMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/90 border border-emerald-500/50 text-emerald-200 text-xs font-mono flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{payoutMessage}</span>
          </div>
          <button onClick={() => setPayoutMessage(null)} className="text-emerald-400 hover:text-white font-bold p-1 cursor-pointer">
            ✕
          </button>
        </div>
      )}

      {/* Main D3 Heatmap Section */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-5 h-5 text-amber-400" />
              Matriz D3 de Liquidez: Dias da Semana vs Janela Horária (00h às 24h)
            </h3>
            <p className="text-xs text-slate-400">
              Tons de verde/esmeralda mais intensos indicam maiores volumes de repasse e liquidez disponível para saque.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-slate-400">Filtrar Canal:</span>
            <select
              value={channelFilter}
              onChange={(e) => setChannelFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-emerald-400 rounded-lg p-1.5 font-mono text-xs focus:outline-none"
            >
              <option value="TODOS">Todos os Canais</option>
              <option value="Pix">Apenas Pix Direct MP</option>
              <option value="Cartão">Apenas Cartão MP</option>
              <option value="SWIFT">Apenas Câmbio SWIFT</option>
            </select>
          </div>
        </div>

        {/* D3 Heatmap Container */}
        <div ref={containerRef} className="w-full overflow-x-auto pt-2">
          <svg ref={svgRef} className="w-full min-w-[700px]" />
        </div>

        {/* Gradient Legend */}
        <div className="flex items-center justify-between text-xs font-mono pt-3 border-t border-slate-800/80 text-slate-400">
          <div className="flex items-center gap-2">
            <span>Baixa Liquidez (R$ 35k)</span>
            <div className="h-3 w-32 rounded bg-gradient-to-r from-emerald-950 via-emerald-600 to-emerald-400" />
            <span>Pico de Liquidez (R$ 400k+)</span>
          </div>

          <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
            <QrCode className="w-4 h-4 text-emerald-400" />
            <span>Chave Pix CNPJ: +5573998599213</span>
          </div>
        </div>
      </div>

      {/* Hovered Cell Detail Drawer */}
      {hoveredCell && (
        <div className="p-4 rounded-xl bg-slate-950 border border-emerald-500/40 text-xs font-mono space-y-2 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between">
            <span className="font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              Janela de Liquidez Selecionada: {hoveredCell.day} · {hoveredCell.timeSlot}
            </span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
              STATUS MERCADO PAGO: DISPONÍVEL D+0
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1 border-t border-slate-800/80">
            <div>
              <span className="text-[10px] text-slate-400 block">Capital Ingressado no Período</span>
              <span className="text-sm font-bold text-white">{formatBRL(hoveredCell.inflowBRL)}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">Saldo Líquido Pró-Saque MP</span>
              <span className="text-sm font-bold text-emerald-400">{formatBRL(hoveredCell.liquidityAvailableBRL)}</span>
            </div>

            <div>
              <span className="text-[10px] text-slate-400 block">Canal Principal de Entrada</span>
              <span className="text-xs font-bold text-sky-300">{hoveredCell.primaryChannel}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
