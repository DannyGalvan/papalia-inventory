import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type InputStackParamList = {
  InputList: undefined;
  CreateInput: undefined;
  ReadInput: { id: number };
};

export type InputListScreenProps = NativeStackScreenProps<
  InputStackParamList,
  'InputList'
>;

export type CreateInputScreenProps = NativeStackScreenProps<
  InputStackParamList,
  'CreateInput'
>;

export type ReadInputScreenProps = NativeStackScreenProps<
  InputStackParamList,
  'ReadInput'
>;
