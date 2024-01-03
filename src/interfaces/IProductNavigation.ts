import type {NativeStackScreenProps} from '@react-navigation/native-stack';

export type ProductStackParamList = {
  ListProduct: undefined;
  CreateProduct: undefined;
  EditProduct: {id: string};
};

export type ProductListScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'ListProduct'
>;

export type ProductCreateScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'CreateProduct'
>;

export type ProductEditScreenProps = NativeStackScreenProps<
  ProductStackParamList,
  'EditProduct'
>;
