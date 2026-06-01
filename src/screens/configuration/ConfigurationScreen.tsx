import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { version as appVersion } from '../../../package.json';
import { TouchableButton } from '../../components/button/TouchableButton';
import { Toast } from '../../components/feedback/Toast';
import { InputForm } from '../../components/input/InputForm';
import {
  DEFAULT_COMPANY_NAME,
  DEFAULT_CURRENCY_SYMBOL,
  DEFAULT_LOW_STOCK_THRESHOLD,
  KEY_COMPANY_NAME,
  KEY_CURRENCY_SYMBOL,
  KEY_LOW_STOCK_THRESHOLD,
} from '../../config/constants';
import { getConfigurationByKey, upsertConfiguration } from '../../database/repository/ConfigurationRepository';
import { useDownloadBd } from '../../hooks/useDownloadBd';
import { useImages } from '../../hooks/useImages';
import { useTheme } from '../../hooks/useTheme';
import { ConfigurationScreenProps } from '../../interfaces/IAppStartNavigation';

type ToastState = {
  visible: boolean;
  message: string;
  type: 'success' | 'error';
};

const EMPTY_TOAST: ToastState = {visible: false, message: '', type: 'success'};

export const ConfigurationScreen = ({navigation}: ConfigurationScreenProps) => {
  const {theme} = useTheme();
  const {save, downloadResult, clearResult} = useDownloadBd();
  const {dirImages, changeDirImages, isLoading} = useImages();

  // Image folder
  const [folderInput, setFolderInput] = useState(dirImages ?? '');
  const [folderToast, setFolderToast] = useState<ToastState>(EMPTY_TOAST);

  // Currency symbol
  const [currencyInput, setCurrencyInput] = useState(DEFAULT_CURRENCY_SYMBOL);
  const [currencyToast, setCurrencyToast] = useState<ToastState>(EMPTY_TOAST);

  // Low stock threshold
  const [thresholdInput, setThresholdInput] = useState(String(DEFAULT_LOW_STOCK_THRESHOLD));
  const [thresholdToast, setThresholdToast] = useState<ToastState>(EMPTY_TOAST);

  // Company name
  const [companyInput, setCompanyInput] = useState(DEFAULT_COMPANY_NAME);
  const [companyToast, setCompanyToast] = useState<ToastState>(EMPTY_TOAST);

  const [settingsLoading, setSettingsLoading] = useState(true);

  useEffect(() => {
    if (dirImages) {
      setFolderInput(dirImages);
    }
  }, [dirImages]);

  useEffect(() => {
    (async () => {
      setSettingsLoading(true);
      const [currencyConfig, thresholdConfig, companyConfig] = await Promise.all([
        getConfigurationByKey(KEY_CURRENCY_SYMBOL),
        getConfigurationByKey(KEY_LOW_STOCK_THRESHOLD),
        getConfigurationByKey(KEY_COMPANY_NAME),
      ]);
      if (currencyConfig?.value) {setCurrencyInput(currencyConfig.value);}
      if (thresholdConfig?.value) {setThresholdInput(thresholdConfig.value);}
      if (companyConfig?.value) {setCompanyInput(companyConfig.value);}
      setSettingsLoading(false);
    })();
  }, []);

  // --- Save handlers ---

  const handleSaveFolder = useCallback(async () => {
    try {
      await changeDirImages(folderInput);
      setFolderToast({visible: true, message: 'Carpeta actualizada correctamente', type: 'success'});
    } catch {
      setFolderToast({visible: true, message: 'Error al guardar la carpeta', type: 'error'});
    }
  }, [changeDirImages, folderInput]);

  const handleSaveCurrency = useCallback(async () => {
    const trimmed = currencyInput.trim();
    if (!trimmed) {
      setCurrencyToast({visible: true, message: 'El símbolo no puede estar vacío', type: 'error'});
      return;
    }
    if (trimmed.length > 5) {
      setCurrencyToast({visible: true, message: 'El símbolo no puede tener más de 5 caracteres', type: 'error'});
      return;
    }
    const result = await upsertConfiguration(KEY_CURRENCY_SYMBOL, trimmed);
    setCurrencyToast({
      visible: true,
      message: result.success ? 'Símbolo de moneda guardado' : result.message,
      type: result.success ? 'success' : 'error',
    });
  }, [currencyInput]);

  const handleSaveThreshold = useCallback(async () => {
    const num = parseInt(thresholdInput, 10);
    if (isNaN(num) || num < 1 || num > 999) {
      setThresholdToast({visible: true, message: 'El umbral debe ser un número entre 1 y 999', type: 'error'});
      return;
    }
    const result = await upsertConfiguration(KEY_LOW_STOCK_THRESHOLD, String(num));
    setThresholdToast({
      visible: true,
      message: result.success ? 'Umbral de stock guardado' : result.message,
      type: result.success ? 'success' : 'error',
    });
  }, [thresholdInput]);

  const handleSaveCompany = useCallback(async () => {
    const trimmed = companyInput.trim();
    if (!trimmed) {
      setCompanyToast({visible: true, message: 'El nombre no puede estar vacío', type: 'error'});
      return;
    }
    const result = await upsertConfiguration(KEY_COMPANY_NAME, trimmed);
    setCompanyToast({
      visible: true,
      message: result.success ? 'Nombre de empresa guardado' : result.message,
      type: result.success ? 'success' : 'error',
    });
  }, [companyInput]);

  const inputStyle = [
    styles.input,
    {
      borderColor: theme.colors.border,
      borderRadius: theme.borderRadius.md,
      color: theme.colors.text,
    },
  ];

  const btnStyle = [
    styles.saveButton,
    {backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md},
  ];

  return (
    <KeyboardAvoidingView
      style={[styles.screen, {backgroundColor: theme.colors.background}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled">
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
          accessibilityRole="header">
          Configuración
        </Text>

        {/* ── Descargar base de datos ── */}
        <View style={[styles.section, {borderColor: theme.colors.border}]}>
          <Text style={[styles.sectionTitle, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>
            Descargar base de datos
          </Text>
          <Text style={[styles.sectionDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
            {Platform.OS === 'ios'
              ? 'Guarda una copia en Archivos (app).'
              : 'Guarda una copia en la carpeta Descargas.'}
          </Text>
          <TouchableButton
            icon="download"
            onPress={save}
            styles={[styles.saveButton, {backgroundColor: theme.colors.primary, borderRadius: theme.borderRadius.md}]}
            textStyle={[styles.btnText, {color: theme.colors.surface}]}
            title="Descargar"
            iconColor={theme.colors.surface}
            accessibilityLabel="Descargar base de datos"
          />
        </View>

        {settingsLoading || isLoading ? (
          <ActivityIndicator color={theme.colors.primary} style={styles.loader} />
        ) : (
          <>
            {/* ── Carpeta de imágenes ── */}
            <View style={[styles.section, {borderColor: theme.colors.border}]}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>
                Carpeta de imágenes
              </Text>
              <Text style={[styles.sectionDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                Nombre de la carpeta donde se guardan las fotos de productos.
              </Text>
              <InputForm
                label="Nombre de carpeta"
                placeholder="imagenes_productos"
                value={folderInput}
                onChangeText={(text: string) => setFolderInput(text)}
                secureTextEntry={false}
                colorText={{color: theme.colors.text}}
                placeholderTextColor={theme.colors.textSecondary}
                style={inputStyle}
              />
              <TouchableButton
                icon="save"
                onPress={handleSaveFolder}
                styles={btnStyle}
                textStyle={[styles.btnText, {color: theme.colors.surface}]}
                title="Guardar"
                iconColor={theme.colors.surface}
                accessibilityLabel="Guardar carpeta de imágenes"
              />
            </View>

            {/* ── Símbolo de moneda ── */}
            <View style={[styles.section, {borderColor: theme.colors.border}]}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>
                Símbolo de moneda
              </Text>
              <Text style={[styles.sectionDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                Prefijo que se muestra en precios e inventario (ej. Q, $, €).
              </Text>
              <InputForm
                label="Símbolo"
                placeholder="Q"
                value={currencyInput}
                onChangeText={(text: string) => setCurrencyInput(text)}
                secureTextEntry={false}
                colorText={{color: theme.colors.text}}
                placeholderTextColor={theme.colors.textSecondary}
                style={inputStyle}
              />
              <TouchableButton
                icon="save"
                onPress={handleSaveCurrency}
                styles={btnStyle}
                textStyle={[styles.btnText, {color: theme.colors.surface}]}
                title="Guardar"
                iconColor={theme.colors.surface}
                accessibilityLabel="Guardar símbolo de moneda"
              />
            </View>

            {/* ── Umbral de stock bajo ── */}
            <View style={[styles.section, {borderColor: theme.colors.border}]}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>
                Umbral de stock bajo
              </Text>
              <Text style={[styles.sectionDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                Productos con stock igual o menor a este número aparecen en el Reporte Crítico.
              </Text>
              <InputForm
                label="Umbral (unidades)"
                placeholder="5"
                value={thresholdInput}
                onChangeText={(text: string) => setThresholdInput(text)}
                secureTextEntry={false}
                colorText={{color: theme.colors.text}}
                placeholderTextColor={theme.colors.textSecondary}
                keyboardType="numeric"
                style={inputStyle}
              />
              <TouchableButton
                icon="save"
                onPress={handleSaveThreshold}
                styles={btnStyle}
                textStyle={[styles.btnText, {color: theme.colors.surface}]}
                title="Guardar"
                iconColor={theme.colors.surface}
                accessibilityLabel="Guardar umbral de stock"
              />
            </View>

            {/* ── Nombre de empresa ── */}
            <View style={[styles.section, {borderColor: theme.colors.border}]}>
              <Text style={[styles.sectionTitle, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>
                Nombre de empresa
              </Text>
              <Text style={[styles.sectionDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
                Nombre que identifica tu negocio dentro de la aplicación.
              </Text>
              <InputForm
                label="Empresa"
                placeholder="Mi empresa"
                value={companyInput}
                onChangeText={(text: string) => setCompanyInput(text)}
                secureTextEntry={false}
                colorText={{color: theme.colors.text}}
                placeholderTextColor={theme.colors.textSecondary}
                style={inputStyle}
              />
              <TouchableButton
                icon="save"
                onPress={handleSaveCompany}
                styles={btnStyle}
                textStyle={[styles.btnText, {color: theme.colors.surface}]}
                title="Guardar"
                iconColor={theme.colors.surface}
                accessibilityLabel="Guardar nombre de empresa"
              />
            </View>
          </>
        )}

        {/* ── Catálogo de tipos de movimiento ── */}
        <TouchableOpacity
          style={[styles.catalogBtn, {backgroundColor: theme.colors.surface, borderColor: theme.colors.border, borderRadius: theme.borderRadius.md}]}
          onPress={() => navigation.navigate('MovementTypeCatalog')}
          accessibilityRole="button"
          accessibilityLabel="Gestionar tipos de movimiento">
          <Icon name="list-outline" size={22} color={theme.colors.primary} />
          <View style={styles.catalogBtnText}>
            <Text style={[styles.catalogBtnTitle, {color: theme.colors.text, fontSize: theme.typography.body.fontSize}]}>
              Tipos de movimiento
            </Text>
            <Text style={[styles.catalogBtnDesc, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
              Gestiona los tipos de entradas y salidas del inventario.
            </Text>
          </View>
          <Icon name="chevron-forward" size={18} color={theme.colors.textSecondary} />
        </TouchableOpacity>

        {/* ── Versión ── */}
        <Text
          style={[styles.versionText, {color: theme.colors.textSecondary, fontSize: theme.typography.caption.fontSize}]}>
          Versión: {appVersion}
        </Text>
      </ScrollView>

      <Toast
        message={downloadResult?.message || ''}
        type={downloadResult?.success ? 'success' : 'error'}
        visible={downloadResult !== null}
        onDismiss={clearResult}
      />
      <Toast message={folderToast.message} type={folderToast.type} visible={folderToast.visible}
        onDismiss={() => setFolderToast(EMPTY_TOAST)} />
      <Toast message={currencyToast.message} type={currencyToast.type} visible={currencyToast.visible}
        onDismiss={() => setCurrencyToast(EMPTY_TOAST)} />
      <Toast message={thresholdToast.message} type={thresholdToast.type} visible={thresholdToast.visible}
        onDismiss={() => setThresholdToast(EMPTY_TOAST)} />
      <Toast message={companyToast.message} type={companyToast.type} visible={companyToast.visible}
        onDismiss={() => setCompanyToast(EMPTY_TOAST)} />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1},
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 48,
    alignItems: 'center',
  },
  title: {
    fontStyle: 'italic',
    paddingVertical: 12,
    textAlign: 'center',
  },
  loader: {marginTop: 32},
  section: {
    width: '100%',
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionDesc: {
    marginBottom: 8,
    lineHeight: 18,
  },
  saveButton: {
    marginTop: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  btnText: {fontWeight: '600'},
  input: {
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  catalogBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
    padding: 14,
    marginTop: 8,
    borderWidth: StyleSheet.hairlineWidth,
  },
  catalogBtnText: {flex: 1},
  catalogBtnTitle: {fontWeight: '600'},
  catalogBtnDesc: {marginTop: 2},
  versionText: {
    marginTop: 24,
    textAlign: 'center',
  },
});
