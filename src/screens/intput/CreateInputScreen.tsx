import React from 'react';
import {ScrollView, Text} from 'react-native';
import {appStyles} from '../../styles/globalStyles';
import {CreateInputScreenProps} from '../../interfaces/IInputNavigation';
import {LogForm} from '../../components/form/LogForm';
import {
  LogHeaderRepository,
  createLog,
} from '../../database/repository/LogHeaderRepository';
import {INPUT_DATA, INPUT_TYPES} from '../../config/constants';
import {LogHeader} from '../../database/models/LogHeader';

const initialForm = LogHeaderRepository.create({
  commets: '',
  type: INPUT_TYPES.no_seleccionado,
  createdAt: new Date(),
  isInput: true,
  logDetails: [],
});

export const CreateInputScreen = ({}: CreateInputScreenProps) => {
  const sendForm = async (form: LogHeader) => {
    return await createLog(form);
  };
  return (
    <ScrollView>
      <Text style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
        Crear entrada de producto
      </Text>
      <LogForm
        initialForm={initialForm}
        isReadonly={false}
        onSubmit={sendForm}
        selectData={INPUT_DATA}
      />
    </ScrollView>
  );
};
