import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export type OutputStackParamList = {
  OutputList: undefined;
  CreateOutput: undefined;
  ReadOutput: {id: number};
  DashboardOutput: undefined;
};

export type OutputListScreenProps = NativeStackScreenProps<
  OutputStackParamList,
  'OutputList'
>;

export type CreateOutputScreenProps = NativeStackScreenProps<
  OutputStackParamList,
  'CreateOutput'
>;

export type ReadOutputScreenProps = NativeStackScreenProps<
  OutputStackParamList,
  'ReadOutput'
>;

export type DashboardOutputScreenProps = NativeStackScreenProps<
  OutputStackParamList,
  'DashboardOutput'
>;
