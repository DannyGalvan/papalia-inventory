import React, {useState} from 'react';
import {Alert, FlatList, StyleSheet, Text, View} from 'react-native';
import {appColors, appStyles} from '../../styles/globalStyles';
import {OutputListScreenProps} from '../../interfaces/IOutputNavigation';
import {useOutputs} from '../../hooks/useOutputs';
import {dateNow} from '../../utils/dateTime';
import {InputDate} from '../../components/input/InputDate';
import {LogItems} from '../../components/LogItems';
import {Fab} from '../../components/button/Fab';
import {getAllOutputLogs} from '../../database/repository/LogHeaderRepository';
import {utils, write} from 'xlsx';
import {DownloadDirectoryPath, writeFile} from '@dr.pogodin/react-native-fs';

const {fechaFin, fechaInicio} = dateNow();

export const OutputListScreen = ({navigation}: OutputListScreenProps) => {
  const [initialDate, setInitialDate] = useState(fechaInicio);
  const [finalDate, setFinalDate] = useState(fechaFin);
  const [isLoadingDownload, setIsLoadingDownload] = useState(false);
  const {outputs, isLoading, loadData} = useOutputs(initialDate, finalDate);

  const downloadFile = async () => {
    try {
      setIsLoadingDownload(true);
      const data = await getAllOutputLogs();
      const ws = utils.json_to_sheet(data);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, 'Salidas');
      const wbout = write(wb, {type: 'binary', bookType: 'xlsx'});
      const fileSave = `${DownloadDirectoryPath}/Salidas.xlsx`;
      await writeFile(fileSave, wbout, 'ascii');
      Alert.alert('Archivo guardado en descargas', fileSave);
      setIsLoadingDownload(false);
    } catch (e) {
      Alert.alert('Error al descargar el archivo', e.message);
      setIsLoadingDownload(false);
    }
  };

  return (
    <View style={appStyles.screen}>
      <Text style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
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
      <Text style={[appStyles.text, appStyles.textDark, appStyles.textCenter]}>
        Total de Resultados: {outputs.length}
      </Text>
      <FlatList
        style={[styles.list]}
        data={outputs}
        renderItem={({item}) => (
          <LogItems
            logHeader={item}
            navigation={(id: number) => {
              navigation.navigate('ReadOutput', {id});
            }}
          />
        )}
        refreshing={isLoading}
        onRefresh={loadData}
        keyExtractor={item => item.id.toString()}
      />
      <Fab
        style={styles.fabR}
        iconName="add"
        onPress={() => navigation.navigate('CreateOutput')}
      />
      <Fab
        style={styles.fabDash}
        iconName="grid-outline"
        onPress={() => navigation.navigate('DashboardOutput')}
      />
      <Fab
        style={styles.fabL}
        iconName="download"
        onPress={downloadFile}
        isLoading={isLoadingDownload}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  fabR: {
    bottom: 20,
    right: 20,
    position: 'absolute' as 'absolute',
  },
  fabL: {
    bottom: 20,
    left: 20,
    position: 'absolute' as 'absolute',
    backgroundColor: appColors.success,
  },
  fabDash: {
    bottom: 80,
    left: 20,
    position: 'absolute' as 'absolute',
    backgroundColor: appColors.warning,
  },
  labelDate: {
    marginHorizontal: 20,
  },
  list: {
    padding: 10,
    marginVertical: 20,
    marginHorizontal: 10,
  },
  date: {
    height: 50,
    backgroundColor: appColors.white,
    borderRadius: 10,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 10,
    marginHorizontal: 20,
  },
});
