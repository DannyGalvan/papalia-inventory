import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { Fab } from '../../components/button/Fab';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Toast } from '../../components/feedback/Toast';
import { InputDate } from '../../components/input/InputDate';
import { LogItems } from '../../components/LogItems';
import { useTimezone } from '../../context/TimezoneContext';
import { MovementType } from '../../database/models/MovementType';
import { LogHeaderRepository } from '../../database/repository/LogHeaderRepository';
import { getAllMovementTypes } from '../../database/repository/MovementTypeRepository';
import { useInputs } from '../../hooks/useInputs';
import { useTheme } from '../../hooks/useTheme';
import { InputListScreenProps } from '../../interfaces/IInputNavigation';
import { excelService } from '../../services/ExcelService';

export const InputListScreen = ({ navigation }: InputListScreenProps) => {
  const { theme } = useTheme();
  const {getTodayBounds} = useTimezone();
  const todayBounds = useMemo(() => getTodayBounds(), [getTodayBounds]);
  const [initialDate, setInitialDate] = useState(todayBounds.fechaInicio);
  const [finalDate, setFinalDate] = useState(todayBounds.fechaFin);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [typeCatalog, setTypeCatalog] = useState<MovementType[]>([]);
  const { inputs, isLoading, loadData } = useInputs(initialDate, finalDate);

  useEffect(() => {
    getAllMovementTypes().then(setTypeCatalog);
  }, []);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState<'success' | 'error' | 'warning'>('success');

  const showToast = (message: string, type: 'success' | 'error' | 'warning') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const downloadFile = async () => {
    try {
      setIsLoadingDownload(true);
      const logs = await LogHeaderRepository.find({
        where: { isInput: true },
        order: { id: 'DESC' },
        relations: ['logDetails'],
      });
      const details = logs.flatMap(log => log.logDetails);
      const filePath = await excelService.exportLogs(logs, details, true);
      const fileName = filePath.split('/').pop() ?? filePath;
      const location = Platform.OS === 'ios' ? 'Archivos (app)' : 'Descargas';
      showToast(`Guardado en ${location}: ${fileName}`, 'success');
      setIsLoadingDownload(false);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Error al exportar el archivo';
      showToast(msg, 'error');
      setIsLoadingDownload(false);
    }
  };

  const renderEmptyList = useCallback(() => {
    if (isLoading) {
      return null;
    }
    return (
      <EmptyState
        title="Sin entradas"
        description="No hay entradas en el rango de fechas seleccionado. Presiona el botón + para registrar una nueva entrada."
        icon="enter-outline"
      />
    );
  }, [isLoading]);

  return (
    <View style={[styles.screen, { backgroundColor: theme.colors.background }]}>
      <Toast
        message={toastMessage}
        type={toastType}
        visible={toastVisible}
        onDismiss={() => setToastVisible(false)}
      />
      <Text
        style={[
          styles.title,
          { color: theme.colors.text, fontSize: theme.typography.h2.fontSize, fontWeight: theme.typography.h2.fontWeight },
        ]}
        accessibilityRole="header">
        Lista de entradas
      </Text>
      <InputDate
        date={initialDate}
        setDate={setInitialDate}
        label="Fecha Inicial"
        isFinal={false}
      />
      <InputDate
        date={finalDate}
        setDate={setFinalDate}
        label="Fecha Final"
        isFinal
      />
      <Text
        style={[
          styles.resultText,
          { color: theme.colors.textSecondary, fontSize: theme.typography.body.fontSize },
        ]}
        accessibilityLabel={`Total de resultados: ${inputs.length}`}>
        Total de Resultados: {inputs.length}
      </Text>
      <FlatList
        style={[styles.list]}
        data={inputs}
        renderItem={({ item }) => (
          <LogItems
            logHeader={item}
            typeCatalog={typeCatalog}
            navigation={(id: number) => {
              navigation.navigate('ReadInput', { id });
            }}
          />
        )}
        refreshing={false}
        onRefresh={loadData}
        keyExtractor={item => item.id.toString()}
        accessibilityRole="list"
        accessibilityLabel="Lista de entradas de inventario"
        ListEmptyComponent={renderEmptyList}
      />
      <Fab
        style={[styles.fabR, { backgroundColor: theme.colors.primary }]}
        iconName="add"
        onPress={() => navigation.navigate('CreateInput')}
        accessibilityLabel="Crear entrada"
        accessibilityHint="Abre el formulario para crear una nueva entrada de inventario"
      />
      <Fab
        style={[styles.fabDash, { backgroundColor: theme.colors.warning }]}
        iconName="grid-outline"
        onPress={() => navigation.navigate('DashboarInput')}
        accessibilityLabel="Ver dashboard de entradas"
        accessibilityHint="Abre el resumen de entradas por tipo"
      />
      <Fab
        style={[styles.fabL, { backgroundColor: theme.colors.success }]}
        iconName="download"
        onPress={downloadFile}
        isLoading={isLoadingDownload}
        accessibilityLabel="Descargar entradas"
        accessibilityHint="Descarga las entradas en formato Excel"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  title: {
    fontStyle: 'italic',
    paddingVertical: 10,
    textAlign: 'center',
  },
  resultText: {
    textAlign: 'center',
  },
  fabR: {
    bottom: 20,
    right: 20,
    position: 'absolute' as 'absolute',
  },
  fabL: {
    bottom: 20,
    left: 20,
    position: 'absolute' as 'absolute',
  },
  fabDash: {
    bottom: 80,
    left: 20,
    position: 'absolute' as 'absolute',
  },
  list: {
    padding: 10,
    marginVertical: 20,
    marginHorizontal: 10,
  },
});
