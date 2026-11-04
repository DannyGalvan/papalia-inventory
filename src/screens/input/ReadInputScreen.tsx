import React from 'react';
import { MovementDetail } from '../../components/movement/MovementDetail';
import { ReadInputScreenProps } from '../../interfaces/IInputNavigation';

export const ReadInputScreen = ({ route }: ReadInputScreenProps) => (
  <MovementDetail id={route.params.id} />
);
