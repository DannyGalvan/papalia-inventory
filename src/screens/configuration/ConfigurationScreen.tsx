import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { appColors, appStyles } from '../../styles/globalStyles';
import { TouchableButton } from '../../components/button/TouchableButton';
import { InputForm } from '../../components/input/InputForm';
import { useDownloadBd } from '../../hooks/useDownloadBd';
import { useImages } from '../../hooks/useImages';

export const ConfigurationScreen = () => {
  const { save } = useDownloadBd();
  const { dirImages, changeDirImages, isLoading } = useImages();
  const [textInput, setTextInput] = useState(dirImages);

  const handleChangeText = (text: string) => {
    setTextInput(text);
  };

  return (
    <View style={[appStyles.screen, appStyles.alignCenter]}>
      <Text style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
        Configuración
      </Text>
      <View
        style={[appStyles.flexRow, appStyles.justifyBetween, styles.download]}>
        <Text style={[appStyles.subTitle, appStyles.textDark]}>
          Descargar Base de datos
        </Text>
        <TouchableButton
          icon="download"
          onPress={save}
          styles={styles.downloadButton}
          textStyle={appStyles.subTitle}
          title="Descargar"
          iconColor={appColors.white}
        />
      </View>
      {isLoading ? (
        <ActivityIndicator />
      ) : (
        <View style={styles.directory}>
          <InputForm
            label="Carpeta Imagenes"
            placeholder="Nombre de la carpeta que almacenara las imagenes de los productos"
            value={textInput}
            onChangeText={handleChangeText}
            secureTextEntry={false}
            placeholderTextColor={appColors.gray}
            style={styles.input}
          />
          <TouchableButton
            icon="save"
            onPress={async () => {
              await changeDirImages(textInput);
              setTextInput(dirImages);
            }}
            styles={styles.directoryButton}
            textStyle={appStyles.subTitle}
            title="Guardar Nombre"
            iconColor={appColors.white}
          />
        </View>
      )}
      <View>
        <Text
          style={[appStyles.text, appStyles.textDark, appStyles.textCenter]}>
          Version: 1.0.0
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  download: {
    width: '95%',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderTopWidth: 1,
  },
  downloadButton: {
    backgroundColor: appColors.primary,
    width: 125,
    paddingVertical: 5,
  },
  directory: {
    width: '95%',
    paddingHorizontal: 15,
    paddingVertical: 20,
    borderBottomWidth: 1,
    marginBottom: 20,
  },
  directoryButton: {
    backgroundColor: appColors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginTop: 10,
    color: appColors.black,
  },
});
