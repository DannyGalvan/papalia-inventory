import React from 'react';
import { MovementDetail } from '../../components/movement/MovementDetail';
import { ReadOutputScreenProps } from '../../interfaces/IOutputNavigation';

export const ReadOutputScreen = ({ route }: ReadOutputScreenProps) => (
  <MovementDetail id={route.params.id} />
);
