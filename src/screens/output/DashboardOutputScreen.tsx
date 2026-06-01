import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { DashboardItem } from '../../components/DashboardItem';
import { EmptyState } from '../../components/feedback/EmptyState';
import { InputDate } from '../../components/input/InputDate';
import { DashboardResponse } from '../../database/models/response/DashboardResponse';
import { useTimezone } from '../../context/TimezoneContext';
import { getDashboardOutputs } from '../../database/repository/LogHeaderRepository';
import { useTheme } from '../../hooks/useTheme';

export const DashboardOutputScreen = () => {
  const {theme} = useTheme();
  const {getTodayBounds} = useTimezone();
  const todayBounds = useMemo(() => getTodayBounds(), [getTodayBounds]);
  const [initialDate, setInitialDate] = useState(todayBounds.fechaInicio);
  const [finalDate, setFinalDate] = useState(todayBounds.fechaFin);
  const [response, setResponse] = useState<DashboardResponse[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isLoadingRef = useRef(false);

  const loadData = useCallback(async () => {
    if (isLoadingRef.current) {return;}
    isLoadingRef.current = true;
    setIsLoading(true);
    try {
      const data = await getDashboardOutputs(initialDate, finalDate);
      setResponse(data);
    } catch (error) {
      console.log('DashboardOutputScreen error:', error);
    } finally {
      isLoadingRef.current = false;
      setIsLoading(false);
    }
  }, [initialDate, finalDate]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData]),
  );

  return (
    <View style={[styles.screen, {backgroundColor: theme.colors.background}]}>
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
        Dashboard de salidas
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
        style={[styles.resultText, {color: theme.colors.textSecondary, fontSize: theme.typography.body.fontSize}]}
        accessibilityLabel={`Total de tipos: ${response.length}`}>
        Tipos de movimiento: {response.length}
      </Text>

      <FlatList
        style={styles.list}
        data={response}
        renderItem={({item}) => <DashboardItem item={item} />}
        refreshing={isLoading}
        onRefresh={loadData}
        keyExtractor={item => item.tipo}
        accessibilityRole="list"
        accessibilityLabel="Resumen de salidas por tipo"
        ListEmptyComponent={
          isLoading ? null : (
            <EmptyState
              title="Sin movimientos"
              description="No hay salidas en el rango de fechas seleccionado."
              icon="exit-outline"
            />
          )
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1},
  title: {
    textAlign: 'center',
    paddingVertical: 10,
    fontStyle: 'italic',
  },
  resultText: {
    textAlign: 'center',
  },
  list: {
    width: '100%',
    paddingHorizontal: 10,
    marginVertical: 5,
  },
});
