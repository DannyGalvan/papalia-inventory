/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import React, {useEffect, useState} from 'react';
import {NavigationContainer} from '@react-navigation/native';
import {dataSource} from './src/database/connection/DataSource';
import PrincipalStack from './src/stacks/PrincipalStack';
import {ActivityIndicator, Text, View} from 'react-native';
import {appStyles} from './src/styles/globalStyles';

function App(): React.JSX.Element {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const connect = async () => {
      try {
        if (!dataSource.isInitialized) {
          await dataSource.initialize();
        }
      } catch (error) {
        console.log('error', error);
      }

      setIsLoading(false);
    };

    connect();
  }, [isLoading]);

  console.log('isLoading', isLoading && !dataSource.isInitialized);

  return (
    <NavigationContainer>
      {isLoading && !dataSource.isInitialized ? (
        <View
          style={[
            appStyles.screen,
            appStyles.flexColumn,
            appStyles.justifyCenter,
            appStyles.alignCenter,
          ]}>
          <Text
            style={[appStyles.title, appStyles.textDark, appStyles.textCenter]}>
            Iniciando La Applicacion Porfavor Espere...
          </Text>
          <ActivityIndicator size="large" color="#0000ff" />
        </View>
      ) : (
        <PrincipalStack />
      )}
    </NavigationContainer>
  );
}

export default App;
