import React, {useEffect, useState} from 'react';
import {Text, View} from 'react-native';
import {LogForm} from '../../components/form/LogForm';
import {appStyles} from '../../styles/globalStyles';
import {getLogById} from '../../database/repository/LogHeaderRepository';
import {LogHeader} from '../../database/models/LogHeader';

export const ReadOutputScreen = ({route, navigation}) => {
  const {id} = route.params;
  const [logState, setLogState] = useState<LogHeader>(new LogHeader());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const log = await getLogById(id);
      setLogState(log);
      setIsLoading(false);
    })();
  }, [id]);

  return (
    <View style={appStyles.screen}>
      <Text style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
        Detalle de Operacion {id}
      </Text>
      {!isLoading && (
        <LogForm
          isReadonly
          initialForm={logState}
          onSubmit={null}
          navigate={navigation}
        />
      )}
    </View>
  );
};
