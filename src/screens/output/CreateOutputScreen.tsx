import React from 'react';
import {Text, View} from 'react-native';
import {
  LogHeaderRepository,
  createLog,
} from '../../database/repository/LogHeaderRepository';
import {OUPUT_DATA, OUTPUT_TYPES} from '../../config/constants';
import {appStyles} from '../../styles/globalStyles';
import {LogForm} from '../../components/form/LogForm';
import {LogHeader} from '../../database/models/LogHeader';

const initialForm = LogHeaderRepository.create({
  commets: '',
  type: OUTPUT_TYPES.no_seleccionado,
  createdAt: new Date(),
  isInput: false,
  logDetails: [],
});

export const CreateOutputScreen = () => {
  const sendForm = async (form: LogHeader) => {
    return await createLog(form);
  };

  return (
    <View>
      <Text style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
        Crear entrada de producto
      </Text>
      <LogForm
        initialForm={initialForm}
        isReadonly={false}
        onSubmit={sendForm}
        selectData={OUPUT_DATA}
      />
    </View>
  );
};
