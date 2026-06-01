import React, { useEffect, useState } from 'react';
import {
  DimensionValue,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import {
  DEFAULT_CURRENCY_SYMBOL,
  KEY_CURRENCY_SYMBOL,
} from '../config/constants';
import { LogHeader } from '../database/models/LogHeader';
import { MovementType } from '../database/models/MovementType';
import { getConfigurationByKey } from '../database/repository/ConfigurationRepository';
import { getAllMovementTypes } from '../database/repository/MovementTypeRepository';
import { useTheme } from '../hooks/useTheme';
import { formatCurrency } from '../utils/formatCurrency';

interface Props {
  log: LogHeader;
}

const formatDate = (date: Date | string): string => {
  const d = date instanceof Date ? date : new Date(date);
  if (isNaN(d.getTime())) {return '—';}
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}   ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const resolveTypeName = (typeId: number, catalog: MovementType[]): string => {
  const found = catalog.find(t => t.id === typeId);
  return found?.name ?? `Tipo ${typeId}`;
};

export const LogDetailView = ({log}: Props) => {
  const {theme} = useTheme();
  const [currencySymbol, setCurrencySymbol] = useState(DEFAULT_CURRENCY_SYMBOL);
  const [typeCatalog, setTypeCatalog] = useState<MovementType[]>([]);
  const noImage = require('../assets/sin_imagen.png');

  useEffect(() => {
    Promise.all([
      getConfigurationByKey(KEY_CURRENCY_SYMBOL),
      getAllMovementTypes(),
    ]).then(([symbolConfig, catalog]) => {
      if (symbolConfig?.value) {setCurrencySymbol(symbolConfig.value);}
      setTypeCatalog(catalog);
    });
  }, []);

  const isInput = log.isInput;
  const badgeColor = isInput ? theme.colors.success : theme.colors.error;
  const badgeIcon = isInput ? 'arrow-down-circle' : 'arrow-up-circle';
  const badgeLabel = isInput ? 'Entrada' : 'Salida';
  const typeName = resolveTypeName(log.type, typeCatalog);

  const details = log.logDetails ?? [];
  const total = details.reduce((sum, d) => sum + Number(d.total), 0);

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}>

      {/* ── Header card ── */}
      <View style={[styles.card, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md}, theme.elevation.low]}>
        <View style={styles.headerRow}>
          <View style={[styles.badge, {backgroundColor: badgeColor + '22', borderColor: badgeColor}]}>
            <Icon name={badgeIcon} size={16} color={badgeColor} />
            <Text style={[styles.badgeText, {color: badgeColor}]}>{badgeLabel}</Text>
          </View>
          <Text style={[styles.typeLabel, {color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]}>
            {typeName}
          </Text>
        </View>

        <View style={[styles.divider, {backgroundColor: theme.colors.border}]} />

        <View style={styles.infoRow}>
          <Icon name="calendar-outline" size={16} color={theme.colors.textSecondary} />
          <Text style={[styles.infoLabel, {color: theme.colors.textSecondary}]}>Fecha</Text>
          <Text style={[styles.infoValue, {color: theme.colors.text}]}>
            {formatDate(log.createdAt)}
          </Text>
        </View>

        {!!log.comments && (
          <View style={[styles.infoRow, styles.commentsRow]}>
            <Icon name="chatbubble-outline" size={16} color={theme.colors.textSecondary} />
            <Text style={[styles.infoLabel, {color: theme.colors.textSecondary}]}>Comentarios</Text>
            <Text style={[styles.infoValue, styles.commentsValue, {color: theme.colors.text}]}>
              {log.comments}
            </Text>
          </View>
        )}
      </View>

      {/* ── Products section ── */}
      <Text style={[styles.sectionTitle, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
        PRODUCTOS ({details.length})
      </Text>

      {details.length === 0 ? (
        <Text style={[styles.emptyText, {color: theme.colors.textSecondary}]}>
          Sin productos registrados
        </Text>
      ) : (
        details.map((detail, idx) => (
          <View
            key={detail.id ?? idx}
            style={[
              styles.card,
              styles.productCard,
              {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md},
              theme.elevation.low,
            ]}>
            <Image
              source={detail.product?.image ? {uri: detail.product.image} : noImage}
              style={styles.productImage}
              resizeMode="contain"
              accessibilityRole="image"
              accessibilityLabel={`Imagen de ${detail.name}`}
            />
            <View style={styles.productInfo}>
              <Text
                style={[styles.productName, {color: theme.colors.text, fontSize: theme.typography.body.fontSize, fontWeight: '600'}]}
                numberOfLines={2}>
                {detail.name}
              </Text>
              <Text style={[styles.productCode, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                Cód. {detail.productCode}
              </Text>
              <View style={styles.productCalc}>
                <Text style={[styles.calcText, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                  {detail.quantity} uds × {formatCurrency(Number(detail.price), currencySymbol)}
                </Text>
              </View>
            </View>
            <Text style={[styles.productSubtotal, {color: theme.colors.text, fontSize: theme.typography.body.fontSize, fontWeight: '700'}]}>
              {formatCurrency(Number(detail.total), currencySymbol)}
            </Text>
          </View>
        ))
      )}

      {/* ── Total footer ── */}
      {details.length > 0 && (
        <View style={[styles.totalCard, {backgroundColor: theme.colors.surface, borderRadius: theme.borderRadius.md, borderColor: theme.colors.border}]}>
          <Text style={[styles.totalLabel, {color: theme.colors.textSecondary, fontSize: theme.typography.body.fontSize}]}>
            Total del movimiento
          </Text>
          <Text style={[styles.totalValue, {color: isInput ? theme.colors.success : theme.colors.error, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]}>
            {isInput ? '+' : '-'}{formatCurrency(total, currencySymbol)}
          </Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1},
  content: {padding: 16, paddingBottom: 40, gap: 12},
  card: {padding: 14},
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
    flexWrap: 'wrap',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  badgeText: {fontSize: 13, fontWeight: '700'},
  typeLabel: {flex: 1},
  divider: {height: StyleSheet.hairlineWidth, marginBottom: 12},
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  commentsRow: {alignItems: 'flex-start'},
  infoLabel: {fontSize: 13, fontWeight: '600', width: 100},
  infoValue: {flex: 1, fontSize: 14},
  commentsValue: {flexShrink: 1},
  sectionTitle: {
    fontWeight: '600',
    letterSpacing: 1,
    marginTop: 4,
    marginBottom: 4,
  },
  emptyText: {textAlign: 'center', fontStyle: 'italic'},
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  productImage: {
    width: 56 as DimensionValue,
    height: 56,
    borderRadius: 6,
    backgroundColor: 'transparent',
  },
  productInfo: {flex: 1},
  productName: {marginBottom: 2},
  productCode: {marginBottom: 4},
  productCalc: {flexDirection: 'row', alignItems: 'center'},
  calcText: {},
  productSubtotal: {textAlign: 'right', minWidth: 80},
  totalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  totalLabel: {},
  totalValue: {},
});
