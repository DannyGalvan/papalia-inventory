import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  PermissionsAndroid,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../hooks/useTheme';
import { PermissionsScreenProps } from '../../interfaces/IAppStartNavigation';

interface PermissionItem {
  key: string;
  permission: string;
  title: string;
  description: string;
  icon: string;
  status: 'granted' | 'denied' | 'never_ask_again' | 'unknown';
}

const getRequiredPermissions = (): Omit<PermissionItem, 'status'>[] => {
  const apiLevel = parseInt(Platform.Version.toString(), 10);

  if (apiLevel >= 33) {
    return [
      {
        key: 'images',
        permission: PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES,
        title: 'Acceso a imágenes',
        description: 'Necesario para asignar fotos a los productos del inventario.',
        icon: 'image-outline',
      },
    ];
  }

  if (apiLevel >= 29) {
    return [
      {
        key: 'read',
        permission: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        title: 'Leer almacenamiento',
        description: 'Necesario para leer imágenes de productos desde el almacenamiento.',
        icon: 'folder-open-outline',
      },
    ];
  }

  return [
    {
      key: 'read',
      permission: PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
      title: 'Leer almacenamiento',
      description: 'Necesario para leer imágenes de productos desde el almacenamiento.',
      icon: 'folder-open-outline',
    },
    {
      key: 'write',
      permission: PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      title: 'Escribir almacenamiento',
      description: 'Necesario para guardar reportes Excel en la carpeta de descargas.',
      icon: 'download-outline',
    },
  ];
};

export const PermissionsScreen = ({navigation}: PermissionsScreenProps) => {
  const {theme} = useTheme();
  const [items, setItems] = useState<PermissionItem[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);

  const proceed = useCallback(() => {
    navigation.replace('Home');
  }, [navigation]);

  const checkStatuses = useCallback(async () => {
    if (Platform.OS === 'ios') {
      proceed();
      return;
    }
    const defs = getRequiredPermissions();
    const withStatus: PermissionItem[] = await Promise.all(
      defs.map(async def => {
        const granted = await PermissionsAndroid.check(def.permission as any);
        return {...def, status: granted ? 'granted' : 'unknown'} as PermissionItem;
      }),
    );
    setItems(withStatus);
  }, [proceed]);

  useEffect(() => {
    checkStatuses();
  }, [checkStatuses]);

  const requestAll = useCallback(async () => {
    setIsRequesting(true);
    try {
      const defs = getRequiredPermissions();
      const permissions = defs.map(d => d.permission as any);
      const results = await PermissionsAndroid.requestMultiple(permissions);

      setItems(prev =>
        prev.map(item => {
          const result = results[item.permission as keyof typeof results];
          return {
            ...item,
            status: (result as string) === PermissionsAndroid.RESULTS.GRANTED
              ? 'granted'
              : (result as string) === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
              ? 'never_ask_again'
              : 'denied',
          };
        }),
      );
    } finally {
      setIsRequesting(false);
    }
  }, []);

  const allGranted = items.length > 0 && items.every(i => i.status === 'granted');
  const anyDeniedPermanently = items.some(i => i.status === 'never_ask_again');
  const anyUngranted = items.some(i => i.status !== 'granted');

  const statusIcon = (status: PermissionItem['status']) => {
    switch (status) {
      case 'granted':        return {name: 'checkmark-circle', color: theme.colors.success};
      case 'denied':         return {name: 'close-circle-outline', color: theme.colors.error};
      case 'never_ask_again':return {name: 'ban-outline', color: theme.colors.error};
      default:               return {name: 'ellipse-outline', color: theme.colors.textSecondary};
    }
  };

  if (Platform.OS === 'ios') {
    return null;
  }

  return (
    <ScrollView
      style={[styles.container, {backgroundColor: theme.colors.background}]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled">

      {/* Logo */}
      <Image
        source={require('../../assets/papalia_transparent.png')}
        style={styles.logo}
        resizeMode="contain"
        accessibilityRole="image"
        accessibilityLabel="Logotipo Papalia Inventario"
      />

      <Text
        style={[styles.title, {color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight}]}
        accessibilityRole="header">
        Permisos necesarios
      </Text>
      <Text style={[styles.subtitle, {color: theme.colors.textSecondary, fontSize: theme.typography.body.fontSize}]}>
        Para funcionar correctamente, la app necesita los siguientes permisos. Concédelos ahora para evitar interrupciones.
      </Text>

      {/* Permission cards */}
      <View style={styles.cards}>
        {items.map(item => {
          const si = statusIcon(item.status);
          return (
            <View
              key={item.key}
              style={[
                styles.card,
                {
                  backgroundColor: theme.colors.surface,
                  borderRadius: theme.borderRadius.md,
                  borderColor: item.status === 'granted' ? theme.colors.success : theme.colors.border,
                },
              ]}
              accessible
              accessibilityLabel={`${item.title}: ${item.status === 'granted' ? 'concedido' : 'pendiente'}`}>
              <View style={styles.cardHeader}>
                <Icon name={item.icon} size={24} color={theme.colors.primary} />
                <Text style={[styles.cardTitle, {color: theme.colors.text, fontSize: theme.typography.body.fontSize, fontWeight: '600'}]}>
                  {item.title}
                </Text>
                <Icon name={si.name} size={22} color={si.color} />
              </View>
              <Text style={[styles.cardDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                {item.description}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Permanent denial warning */}
      {anyDeniedPermanently && (
        <View style={[styles.warningBox, {backgroundColor: theme.colors.error + '20', borderColor: theme.colors.error, borderRadius: theme.borderRadius.sm}]}>
          <Icon name="warning-outline" size={18} color={theme.colors.error} />
          <Text style={[styles.warningText, {color: theme.colors.error, fontSize: theme.typography.caption.fontSize}]}>
            Uno o más permisos fueron denegados permanentemente. Ve a Configuración {'>'} Aplicaciones {'>'} Papalia Inventory {'>'} Permisos para habilitarlos.
          </Text>
        </View>
      )}

      {/* Actions */}
      {anyUngranted && !anyDeniedPermanently && (
        <TouchableOpacity
          style={[styles.primaryBtn, {backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.lg}]}
          onPress={requestAll}
          disabled={isRequesting}
          accessibilityRole="button"
          accessibilityLabel="Conceder permisos">
          <Icon name="shield-checkmark-outline" size={20} color="#FFFFFF" />
          <Text style={styles.primaryBtnText}>
            {isRequesting ? 'Solicitando...' : 'Conceder permisos'}
          </Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        style={[
          styles.secondaryBtn,
          {
            borderRadius: theme.borderRadius.lg,
            borderColor: allGranted ? theme.colors.success : theme.colors.border,
            backgroundColor: allGranted ? theme.colors.success : 'transparent',
          },
        ]}
        onPress={proceed}
        accessibilityRole="button"
        accessibilityLabel={allGranted ? 'Continuar a la aplicación' : 'Continuar sin todos los permisos'}>
        <Icon name={allGranted ? 'rocket-outline' : 'arrow-forward-outline'} size={20} color={allGranted ? '#FFFFFF' : theme.colors.textSecondary} />
        <Text style={[styles.secondaryBtnText, {color: allGranted ? '#FFFFFF' : theme.colors.textSecondary}]}>
          {allGranted ? 'Continuar' : 'Continuar de todos modos'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
    alignItems: 'center',
    paddingBottom: 48,
  },
  logo: {
    width: 160,
    height: 160,
    marginTop: 16,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  cards: {
    width: '100%',
    gap: 12,
    marginBottom: 24,
  },
  card: {
    padding: 16,
    borderWidth: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 6,
  },
  cardTitle: {
    flex: 1,
  },
  cardDesc: {
    lineHeight: 18,
    paddingLeft: 34,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderWidth: 1,
    width: '100%',
    marginBottom: 20,
  },
  warningText: {
    flex: 1,
    lineHeight: 18,
  },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    marginBottom: 12,
  },
  primaryBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    width: '100%',
    paddingVertical: 14,
    borderWidth: 1,
  },
  secondaryBtnText: {
    fontSize: 16,
    fontWeight: '500',
  },
});
