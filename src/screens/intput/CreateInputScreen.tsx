import React from 'react';
import {Text, View} from 'react-native';
import {appStyles} from '../../styles/globalStyles';
import {CreateInputScreenProps} from '../../interfaces/IInputNavigation';
import {LogForm} from '../../components/form/LogForm';
import {
  LogHeaderRepository,
  createLog,
} from '../../database/repository/LogHeaderRepository';
import {INPUT_DATA, INPUT_TYPES} from '../../config/constants';
import {LogHeader} from '../../database/models/LogHeader';
import {dateNowCreate} from '../../utils/dateTime';

const initialForm = LogHeaderRepository.create({
  commets: '',
  type: INPUT_TYPES.no_seleccionado,
  createdAt: dateNowCreate(),
  isInput: true,
  logDetails: [],
});

export const CreateInputScreen = ({}: CreateInputScreenProps) => {
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
        selectData={INPUT_DATA}
      />
    </View>
  );
};
