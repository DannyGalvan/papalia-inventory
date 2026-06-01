import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, Platform, StyleSheet, Text, View } from 'react-native';
import { Fab } from '../../components/button/Fab';
import { EmptyState } from '../../components/feedback/EmptyState';
import { Toast } from '../../components/feedback/Toast';
import { InputDate } from '../../components/input/InputDate';
import { LogItems } from '../../components/LogItems';
import { MovementType } from '../../database/models/MovementType';
import { LogHeaderRepository } from '../../database/repository/LogHeaderRepository';
import { getAllMovementTypes } from '../../database/repository/MovementTypeRepository';
import { useOutputs } from '../../hooks/useOutputs';
import { useTheme } from '../../hooks/useTheme';
import { OutputListScreenProps } from '../../interfaces/IOutputNavigation';
import { excelService } from '../../services/ExcelService';
import { dateNow } from '../../utils/dateTime';

const {fechaFin, fechaInicio} = dateNow();

export const OutputListScreen = ({navigation}: OutputListScreenProps) => {
  const { theme } = useTheme();
  const [initialDate, setInitialDate] = useState(fechaInicio);
  const [finalDate, setFinalDate] = useState(fechaFin);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const [typeCatalog, setTypeCatalog] = useState<MovementType[]>([]);
  const {outputs, isLoading, loadData} = useOutputs(initialDate, finalDate);

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
        where: {isInput: false},
        order: {id: 'DESC'},
        relations: ['logDetails'],
      });
      const details = logs.flatMap(log => log.logDetails);
      const filePath = await excelService.exportLogs(logs, details, false);
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
        title="Sin salidas"
        description="No hay salidas en el rango de fechas seleccionado. Presiona el botón + para registrar una nueva salida."
        icon="exit-outline"
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
        Lista de salidas
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
        accessibilityLabel={`Total de resultados: ${outputs.length}`}>
        Total de Resultados: {outputs.length}
      </Text>
      <FlatList
        style={[styles.list]}
        data={outputs}
        renderItem={({item}) => (
          <LogItems
            logHeader={item}
            typeCatalog={typeCatalog}
            navigation={(id: number) => {
              navigation.navigate('ReadOutput', {id});
            }}
          />
        )}
        refreshing={false}
        onRefresh={loadData}
        keyExtractor={item => item.id.toString()}
        accessibilityRole="list"
        accessibilityLabel="Lista de salidas de inventario"
        ListEmptyComponent={renderEmptyList}
      />
      <Fab
        style={[styles.fabR, { backgroundColor: theme.colors.primary }]}
        iconName="add"
        onPress={() => navigation.navigate('CreateOutput')}
        accessibilityLabel="Crear salida"
        accessibilityHint="Abre el formulario para crear una nueva salida de inventario"
      />
      <Fab
        style={[styles.fabDash, { backgroundColor: theme.colors.warning }]}
        iconName="grid-outline"
        onPress={() => navigation.navigate('DashboardOutput')}
        accessibilityLabel="Ver dashboard de salidas"
        accessibilityHint="Abre el resumen de salidas por tipo"
      />
      <Fab
        style={[styles.fabL, { backgroundColor: theme.colors.success }]}
        iconName="download"
        onPress={downloadFile}
        isLoading={isLoadingDownload}
        accessibilityLabel="Descargar salidas"
        accessibilityHint="Descarga las salidas en formato Excel"
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
