import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { LogDetailView } from '../../components/LogDetailView';
import { LogHeader } from '../../database/models/LogHeader';
import { getLogById } from '../../database/repository/LogHeaderRepository';
import { useTheme } from '../../hooks/useTheme';
import { ReadInputScreenProps } from '../../interfaces/IInputNavigation';

export const ReadInputScreen = ({route}: ReadInputScreenProps) => {
  const {theme} = useTheme();
  const {id} = route.params;
  const [log, setLog] = useState<LogHeader | null>(null);

  useEffect(() => {
    getLogById(id).then(setLog);
  }, [id]);

  if (!log) {
    return (
      <View style={[styles.centered, {backgroundColor: theme.colors.background}]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return <LogDetailView log={log} />;
};

const styles = StyleSheet.create({
  centered: {flex: 1, alignItems: 'center', justifyContent: 'center'},
});
