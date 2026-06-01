import React, { useCallback, useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { Toast } from '../../components/feedback/Toast';
import { Timezone } from '../../database/models/Timezone';
import {
  getAllTimezones,
  toggleTimezoneActive,
} from '../../database/repository/TimezoneRepository';
import { useTheme } from '../../hooks/useTheme';
import { useTimezone } from '../../context/TimezoneContext';

type ToastState = {visible: boolean; message: string; type: 'success' | 'error'};
const EMPTY_TOAST: ToastState = {visible: false, message: '', type: 'success'};

export const TimezoneCatalogScreen = () => {
  const {theme} = useTheme();
  const {ianaTimezone} = useTimezone();
  const [timezones, setTimezones] = useState<Timezone[]>([]);
  const [toast, setToast] = useState<ToastState>(EMPTY_TOAST);

  const showToast = useCallback((message: string, type: 'success' | 'error') => {
    setToast({visible: true, message, type});
  }, []);

  const load = useCallback(async () => {
    setTimezones(await getAllTimezones());
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleToggle = async (item: Timezone) => {
    if (item.ianaName === ianaTimezone && item.isActive) {
      showToast('No puedes desactivar la zona horaria activa', 'error');
      return;
    }
    const result = await toggleTimezoneActive(item.id);
    if (result.success) {
      setTimezones(prev => prev.map(t => t.id === item.id ? {...t, isActive: !t.isActive} : t));
    } else { showToast(result.message, 'error'); }
  };

  // Group by region
  const grouped = timezones.reduce<Record<string, Timezone[]>>((acc, tz) => {
    if (!acc[tz.region]) { acc[tz.region] = []; }
    acc[tz.region].push(tz);
    return acc;
  }, {});

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.title, {color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]} accessibilityRole="header">
          Zonas horarias disponibles
        </Text>
        <Text style={[styles.subtitle, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
          Activa o desactiva las zonas que aparecerán en el selector de Configuración.
        </Text>

        {Object.entries(grouped).map(([region, items]) => (
          <View key={region} style={styles.group}>
            <Text style={[styles.regionHeader, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
              {region.toUpperCase()}
            </Text>
            {items.map(item => {
              const isSelected = item.ianaName === ianaTimezone;
              return (
                <View
                  key={item.id}
                  style={[
                    styles.row,
                    {
                      backgroundColor: isSelected ? theme.colors.primary + '11' : theme.colors.surface,
                      borderRadius: theme.borderRadius.md,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      opacity: item.isActive ? 1 : 0.5,
                    },
                  ]}>
                  <View style={styles.rowLeft}>
                    {isSelected && (
                      <Icon name="checkmark-circle" size={16} color={theme.colors.primary} style={styles.activeIcon} />
                    )}
                    <View>
                      <Text style={[styles.rowName, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>
                        {item.displayName}
                      </Text>
                      <Text style={[styles.rowIana, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                        {item.ianaName} · {item.utcOffset}
                      </Text>
                    </View>
                  </View>
                  <Switch
                    value={item.isActive}
                    onValueChange={() => handleToggle(item)}
                    thumbColor={item.isActive ? theme.colors.primary : theme.colors.disabled}
                    trackColor={{false: theme.colors.border, true: theme.colors.primary + '66'}}
                    accessibilityLabel={`${item.isActive ? 'Desactivar' : 'Activar'} ${item.displayName}`}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <Toast message={toast.message} type={toast.type} visible={toast.visible} onDismiss={() => setToast(EMPTY_TOAST)} />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1},
  content: {padding: 16, paddingBottom: 48},
  title: {textAlign: 'center', fontStyle: 'italic', paddingVertical: 10},
  subtitle: {textAlign: 'center', marginBottom: 16, lineHeight: 18},
  group: {marginBottom: 8},
  regionHeader: {fontWeight: '700', letterSpacing: 1, marginTop: 16, marginBottom: 6},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 6,
    borderWidth: StyleSheet.hairlineWidth,
  },
  rowLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  activeIcon: {marginRight: 8},
  rowName: {fontWeight: '600'},
  rowIana: {marginTop: 2},
});
