import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { InputDate } from '../../components/input/InputDate';
import { ReportCard } from '../../components/ReportCard';
import {
  DEFAULT_CURRENCY_SYMBOL,
  KEY_CURRENCY_SYMBOL,
} from '../../config/constants';
import { useTimezone } from '../../context/TimezoneContext';
import { getConfigurationByKey } from '../../database/repository/ConfigurationRepository';
import { useTheme } from '../../hooks/useTheme';
import {
  getProfitReportData,
  ProductProfit,
  ProfitReportData,
} from '../../services/ProfitReportService';
import {
  DateRange,
  getPresetRange,
  Granularity,
  normalizeRange,
  RangePreset,
} from '../../utils/dateRanges';
import { formatCurrency } from '../../utils/formatCurrency';
import { formatPct } from '../../utils/profit';

type Filter = RangePreset | 'custom';

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'today', label: 'Hoy' },
  { key: 'week', label: 'Esta semana' },
  { key: 'month', label: 'Este mes' },
  { key: 'prevMonth', label: 'Mes anterior' },
  { key: 'custom', label: 'Personalizado' },
];

const GRANULARITY_LABEL: Record<Granularity, string> = {
  day: 'por día',
  week: 'por semana',
  month: 'por mes',
};

/** Text drawn on top of the selected (accent) filter chip. */
const ON_ACCENT_TEXT = '#FFFFFF';

export function ProfitReportScreen() {
  const { theme } = useTheme();
  const { ianaTimezone, formatDate } = useTimezone();

  const [filter, setFilter] = useState<Filter>('month');
  const [customFrom, setCustomFrom] = useState<Date>(
    () => getPresetRange('month', ianaTimezone).from,
  );
  const [customTo, setCustomTo] = useState<Date>(() => new Date());
  const [data, setData] = useState<ProfitReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY_SYMBOL);
  const requestId = useRef(0);

  const range: DateRange = useMemo(
    () =>
      filter === 'custom'
        ? normalizeRange(customFrom, customTo, ianaTimezone)
        : getPresetRange(filter, ianaTimezone),
    [filter, customFrom, customTo, ianaTimezone],
  );

  const load = useCallback(async () => {
    const id = ++requestId.current;
    setLoading(true);
    try {
      const [symbolConfig, result] = await Promise.all([
        getConfigurationByKey(KEY_CURRENCY_SYMBOL),
        getProfitReportData(range, ianaTimezone),
      ]);
      // Ignore stale responses when the filter changed mid-request.
      if (id === requestId.current) {
        setCurrency(symbolConfig?.value || DEFAULT_CURRENCY_SYMBOL);
        setData(result);
      }
    } catch (error) {
      console.log('ProfitReportScreen error:', error);
    } finally {
      if (id === requestId.current) {
        setLoading(false);
      }
    }
  }, [range, ianaTimezone]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const money = (value: number) => formatCurrency(value, currency);
  const negativeAware = (value: number) =>
    value < 0 ? theme.colors.error : theme.colors.success;

  const hasActivity =
    !!data &&
    (data.revenue !== 0 ||
      data.nonSaleOutputCost !== 0 ||
      data.purchasesCost !== 0);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Text
        style={[
          styles.title,
          {
            color: theme.colors.text,
            fontSize: theme.typography.h2.fontSize,
            fontWeight: theme.typography.h2.fontWeight,
            lineHeight: theme.typography.h2.lineHeight,
          },
        ]}
        accessibilityRole="header"
      >
        Reporte de Ganancias
      </Text>

      {/* Date filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {FILTERS.map(f => {
          const selected = f.key === filter;
          return (
            <TouchableOpacity
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[
                styles.chip,
                { borderColor: theme.colors.primary },
                selected && { backgroundColor: theme.colors.primary },
              ]}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              accessibilityLabel={`Filtrar: ${f.label}`}
            >
              <Text
                style={[
                  styles.chipText,
                  {
                    color: selected ? ON_ACCENT_TEXT : theme.colors.primary,
                  },
                ]}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {filter === 'custom' && (
        <View style={styles.customRange}>
          <View style={styles.customDate}>
            <InputDate
              date={customFrom}
              setDate={setCustomFrom}
              label="Desde"
              isFinal={false}
            />
          </View>
          <View style={styles.customDate}>
            <InputDate
              date={customTo}
              setDate={setCustomTo}
              label="Hasta"
              isFinal={true}
            />
          </View>
        </View>
      )}

      <Text style={[styles.rangeText, { color: theme.colors.textSecondary }]}>
        {formatDate(range.from)} – {formatDate(range.to)}
        {data ? ` · tendencia ${GRANULARITY_LABEL[data.granularity]}` : ''}
      </Text>

      {loading && !data ? (
        <ActivityIndicator
          style={styles.loader}
          size="large"
          color={theme.colors.primary}
        />
      ) : !data || !hasActivity ? (
        <Text style={[styles.emptyText, { color: theme.colors.textSecondary }]}>
          No hay movimientos en este periodo
        </Text>
      ) : (
        <>
          {loading && (
            <ActivityIndicator
              style={styles.inlineLoader}
              size="small"
              color={theme.colors.primary}
            />
          )}

          <DataWarnings data={data} />

          {/* Hero: net profit */}
          <ReportCard title="Ganancia neta">
            <Text
              style={[
                styles.heroValue,
                { color: negativeAware(data.netProfit) },
              ]}
              accessibilityLabel={`Ganancia neta ${money(data.netProfit)}`}
            >
              {money(data.netProfit)}
            </Text>
            <ChangeVsPrevious
              changePct={data.netProfitChangePct}
              previous={money(data.previous.netProfit)}
            />
          </ReportCard>

          {/* How it is calculated */}
          <ReportCard title="¿Cómo se calcula?">
            <BreakdownRow label="Ventas" value={money(data.revenue)} />
            <BreakdownRow
              label="− Costo de lo vendido"
              value={money(data.costOfGoodsSold)}
            />
            <BreakdownRow
              label="= Ganancia bruta"
              value={`${money(data.grossProfit)} (${formatPct(
                data.grossMarginPct,
              )})`}
              strong
            />
            <BreakdownRow
              label="− Regalos y otras salidas (a costo)"
              value={money(data.nonSaleOutputCost)}
            />
            <BreakdownRow
              label="= Ganancia neta"
              value={money(data.netProfit)}
              strong
              color={negativeAware(data.netProfit)}
            />
          </ReportCard>

          {/* KPI grid */}
          <View style={styles.kpiGrid}>
            <Kpi label="Ventas" value={money(data.revenue)} />
            <Kpi label="Margen bruto" value={formatPct(data.grossMarginPct)} />
            <Kpi label="N.º de ventas" value={String(data.salesCount)} />
            <Kpi label="Ticket promedio" value={money(data.averageTicket)} />
            <Kpi label="Unidades vendidas" value={String(data.unitsSold)} />
            <Kpi
              label="Compras (costo)"
              value={money(data.purchasesCost)}
              hint="Dinero invertido en entradas de inventario"
            />
          </View>

          {/* Trend */}
          {data.timeline.length > 0 && (
            <ReportCard
              title={`Tendencia ${GRANULARITY_LABEL[data.granularity]}`}
            >
              <TrendLegend />
              <Trend data={data} money={money} />
            </ReportCard>
          )}

          {data.topByProfit.length > 0 && (
            <ReportCard title="Productos más rentables">
              {data.topByProfit.map((p, i) => (
                <ProductRow key={p.code} rank={i + 1} p={p} money={money} />
              ))}
            </ReportCard>
          )}

          {data.lowMarginProducts.length > 0 && (
            <ReportCard title="Margen bajo o negativo">
              <Text
                style={[styles.note, { color: theme.colors.textSecondary }]}
              >
                Revisa precio o costo de estos productos.
              </Text>
              {data.lowMarginProducts.map((p, i) => (
                <ProductRow key={p.code} rank={i + 1} p={p} money={money} />
              ))}
            </ReportCard>
          )}

          {data.nonSaleByType.length > 0 && (
            <ReportCard title="Costo de salidas que no son venta">
              {data.nonSaleByType.map(t => (
                <BreakdownRow
                  key={t.typeName}
                  label={`${t.typeName} (${t.units} uds)`}
                  value={money(t.cost)}
                />
              ))}
            </ReportCard>
          )}
        </>
      )}
    </ScrollView>
  );
}

// --- Sub-components ---

function DataWarnings({ data }: { data: ProfitReportData }) {
  const { theme } = useTheme();
  const messages: string[] = [];
  if (data.productsWithoutCost.length > 0) {
    const names = data.productsWithoutCost
      .slice(0, 3)
      .map(p => p.name)
      .join(', ');
    const more =
      data.productsWithoutCost.length > 3
        ? ` y ${data.productsWithoutCost.length - 3} más`
        : '';
    messages.push(
      `${data.productsWithoutCost.length} producto(s) vendidos no tienen costo registrado (${names}${more}). Su ganancia aparece más alta de lo real.`,
    );
  }
  if (data.detailsWithoutHistoricalCost > 0) {
    messages.push(
      `${data.detailsWithoutHistoricalCost} movimiento(s) anteriores a esta función usan el costo actual del producto.`,
    );
  }
  if (messages.length === 0) {
    return null;
  }
  return (
    <View
      style={[
        styles.warning,
        {
          borderColor: theme.colors.warning,
          backgroundColor: theme.colors.warning + '1A',
          borderRadius: theme.borderRadius.md,
        },
      ]}
      accessibilityRole="alert"
    >
      <Icon
        name="alert-circle-outline"
        size={20}
        color={theme.colors.warning}
      />
      <View style={styles.warningTextBox}>
        {messages.map(m => (
          <Text
            key={m}
            style={[styles.warningText, { color: theme.colors.text }]}
          >
            {m}
          </Text>
        ))}
      </View>
    </View>
  );
}

function ChangeVsPrevious({
  changePct,
  previous,
}: {
  changePct: number | null;
  previous: string;
}) {
  const { theme } = useTheme();
  if (changePct === null) {
    return (
      <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
        Periodo anterior: {previous}
      </Text>
    );
  }
  const up = changePct >= 0;
  return (
    <Text
      style={[
        styles.change,
        { color: up ? theme.colors.success : theme.colors.error },
      ]}
      accessibilityLabel={`${up ? 'Subió' : 'Bajó'} ${Math.abs(
        changePct,
      ).toFixed(
        1,
      )} por ciento respecto al periodo anterior, que fue ${previous}`}
    >
      {up ? '▲' : '▼'} {formatPct(Math.abs(changePct))} vs periodo anterior (
      {previous})
    </Text>
  );
}

function BreakdownRow({
  label,
  value,
  strong,
  color,
}: {
  label: string;
  value: string;
  strong?: boolean;
  color?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.breakdownRow}>
      <Text
        style={[
          styles.breakdownLabel,
          strong && styles.strong,
          { color: theme.colors.text },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.breakdownValue,
          strong && styles.strong,
          { color: color ?? theme.colors.text },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

function Kpi({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.kpi,
        {
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.md,
        },
        theme.elevation.low,
      ]}
      accessible
      accessibilityLabel={`${label}: ${value}${hint ? `. ${hint}` : ''}`}
    >
      <Text style={[styles.kpiLabel, { color: theme.colors.textSecondary }]}>
        {label}
      </Text>
      <Text
        style={[styles.kpiValue, { color: theme.colors.text }]}
        numberOfLines={1}
        adjustsFontSizeToFit
      >
        {value}
      </Text>
    </View>
  );
}

function TrendLegend() {
  const { theme } = useTheme();
  return (
    <View style={styles.legend}>
      <View
        style={[styles.legendDot, { backgroundColor: theme.colors.primary }]}
      />
      <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
        Ventas
      </Text>
      <View
        style={[styles.legendDot, { backgroundColor: theme.colors.success }]}
      />
      <Text style={[styles.legendText, { color: theme.colors.textSecondary }]}>
        Ganancia neta
      </Text>
    </View>
  );
}

function Trend({
  data,
  money,
}: {
  data: ProfitReportData;
  money: (v: number) => string;
}) {
  const { theme } = useTheme();
  const max = Math.max(
    1,
    ...data.timeline.map(p => Math.max(p.revenue, Math.abs(p.netProfit))),
  );
  return (
    <View>
      {data.timeline.map(p => (
        <View
          key={p.key}
          style={styles.trendRow}
          accessible
          accessibilityLabel={`${p.label}: ventas ${money(
            p.revenue,
          )}, ganancia neta ${money(p.netProfit)}`}
        >
          <Text
            style={[styles.trendLabel, { color: theme.colors.textSecondary }]}
            numberOfLines={1}
          >
            {p.label}
          </Text>
          <View style={styles.trendBars}>
            <View
              style={[
                styles.bar,
                {
                  width: `${(p.revenue / max) * 100}%`,
                  backgroundColor: theme.colors.primary,
                },
              ]}
            />
            <View
              style={[
                styles.bar,
                {
                  width: `${(Math.abs(p.netProfit) / max) * 100}%`,
                  backgroundColor:
                    p.netProfit < 0 ? theme.colors.error : theme.colors.success,
                },
              ]}
            />
          </View>
          <Text
            style={[
              styles.trendValue,
              {
                color: p.netProfit < 0 ? theme.colors.error : theme.colors.text,
              },
            ]}
            numberOfLines={1}
          >
            {money(p.netProfit)}
          </Text>
        </View>
      ))}
    </View>
  );
}

function ProductRow({
  rank,
  p,
  money,
}: {
  rank: number;
  p: ProductProfit;
  money: (v: number) => string;
}) {
  const { theme } = useTheme();
  return (
    <View
      style={[styles.productRow, { borderBottomColor: theme.colors.border }]}
      accessible
      accessibilityLabel={`${rank}. ${p.name}: ${
        p.unitsSold
      } unidades, ventas ${money(p.revenue)}, ganancia ${money(
        p.profit,
      )}, margen ${formatPct(p.marginPct)}`}
    >
      <Text style={[styles.rank, { color: theme.colors.textSecondary }]}>
        {rank}
      </Text>
      <View style={styles.productInfo}>
        <Text
          style={[styles.productName, { color: theme.colors.text }]}
          numberOfLines={1}
        >
          {p.name}
        </Text>
        <Text style={[styles.note, { color: theme.colors.textSecondary }]}>
          {p.unitsSold} uds · ventas {money(p.revenue)} · margen{' '}
          {formatPct(p.marginPct)}
        </Text>
      </View>
      <Text
        style={[
          styles.productProfit,
          { color: p.profit < 0 ? theme.colors.error : theme.colors.success },
        ]}
      >
        {money(p.profit)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 32 },
  title: { textAlign: 'center', paddingVertical: 10, fontStyle: 'italic' },
  chips: { gap: 8, paddingVertical: 4, paddingHorizontal: 4 },
  chip: {
    borderWidth: 1,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    minHeight: 36,
    justifyContent: 'center',
  },
  chipText: { fontSize: 14, fontWeight: '600' },
  customRange: { flexDirection: 'row', marginTop: 8 },
  customDate: { flex: 1 },
  rangeText: { textAlign: 'center', fontSize: 13, marginVertical: 8 },
  loader: { marginTop: 32 },
  inlineLoader: { marginBottom: 4 },
  emptyText: { textAlign: 'center', marginTop: 32, fontSize: 16 },
  warning: {
    flexDirection: 'row',
    gap: 8,
    borderWidth: 1,
    padding: 12,
    marginHorizontal: 4,
    marginVertical: 8,
  },
  warningTextBox: { flex: 1, gap: 4 },
  warningText: { fontSize: 13 },
  heroValue: { fontSize: 32, fontWeight: '700', marginTop: 4 },
  change: { fontSize: 13, fontWeight: '600', marginTop: 4 },
  note: { fontSize: 12, marginTop: 2 },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
    gap: 8,
  },
  breakdownLabel: { flex: 1, fontSize: 14 },
  breakdownValue: { fontSize: 14 },
  strong: { fontWeight: '700' },
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginHorizontal: 4,
  },
  kpi: { width: '48%', padding: 12, marginVertical: 6 },
  kpiLabel: { fontSize: 12 },
  kpiValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, marginRight: 8 },
  trendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  trendLabel: { width: 64, fontSize: 12 },
  trendBars: { flex: 1, gap: 2 },
  bar: { height: 8, borderRadius: 4, minWidth: 2 },
  trendValue: { width: 88, fontSize: 12, textAlign: 'right' },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 8,
  },
  rank: { width: 20, fontSize: 13, textAlign: 'center' },
  productInfo: { flex: 1 },
  productName: { fontSize: 14, fontWeight: '600' },
  productProfit: { fontSize: 14, fontWeight: '700' },
});
